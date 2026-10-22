import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
const owner = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  stranger = "33333333-3333-4333-8333-333333333333",
  doc = "44444444-4444-4444-8444-444444444444";
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
  );
  await db.exec(readFileSync("supabase/schema.sql", "utf8"));
  await db.exec(
    readFileSync(
      "supabase/migrations/20261021_product_tiers.sql",
      "utf8",
    ).replace(/^\uFEFF/, ""),
  );
}, 30000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec("truncate public.users,auth.users cascade;");
  await db.query(
    "insert into public.users(id,email,name) values ($1,$2,$3),($4,$5,$6),($7,$8,$9)",
    [
      owner,
      "owner@test.com",
      "Owner",
      bob,
      "bob@test.com",
      "Bob",
      stranger,
      "stranger@test.com",
      "Stranger",
    ],
  );
  await db.query("insert into auth.users values($1,$2,now()),($3,$4,null)", [
    bob,
    "bob@test.com",
    stranger,
    "stranger@test.com",
  ]);
  await db.query("insert into documents(id,owner_id,title) values($1,$2,$3)", [
    doc,
    owner,
    "Project brief",
  ]);
  await db.query(
    "insert into shares(document_id,user_id,role) values($1,$2,'editor')",
    [doc, bob],
  );
});
const save = (actor = owner, revision = 1, title = "Changed") =>
  db.query("select plainpage_save($1,$2,$3,$4)", [doc, actor, revision, title]);
const review = (action: string, actor = owner, revision = 1, message = "") =>
  db.query(
    "select plainpage_review($1,$2,$3,$4,array[$5]::uuid[],now()+interval '1 day',$6)",
    [doc, actor, action, revision, bob, message],
  );
describe("product tier database guarantees", () => {
  it("atomically saves a matching revision and stores recoverable versions", async () => {
    await save();
    const result = await db.query<{ revision: number; title: string }>(
      "select revision,title from documents where id=$1",
      [doc],
    );
    expect(Number(result.rows[0].revision)).toBe(2);
    expect(result.rows[0].title).toBe("Changed");
    expect(
      (await db.query("select * from document_versions")).rows,
    ).toHaveLength(2);
  });
  it("rejects stale saves without modifying the current document", async () => {
    await save(owner, 1, "Winner");
    await expect(save(bob, 1, "Overwritten")).rejects.toThrow("CONFLICT");
    expect(
      (await db.query<{ title: string }>("select title from documents")).rows[0]
        .title,
    ).toBe("Winner");
  });
  it("does not allow an unrelated user to save", async () => {
    await expect(save(stranger)).rejects.toThrow("FORBIDDEN");
  });
  it("does not save trashed documents", async () => {
    await db.query("update documents set deleted_at=now() where id=$1", [doc]);
    await expect(save()).rejects.toThrow("NOT_FOUND");
  });
  it("restores history as a new revision", async () => {
    await save();
    await db.query("select plainpage_save($1,$2,2,null,null,1)", [doc, owner]);
    const r = await db.query<{ title: string; revision: number }>(
      "select title,revision from documents",
    );
    expect(r.rows[0].title).toBe("Project brief");
    expect(Number(r.rows[0].revision)).toBe(3);
  });
  it("restricts version restoration to the owner", async () => {
    await save();
    await expect(
      db.query("select plainpage_save($1,$2,2,null,null,1)", [doc, bob]),
    ).rejects.toThrow("FORBIDDEN");
  });
  it("queues an invitation without creating a phantom profile", async () => {
    await db.query(
      "select plainpage_invite($1,$2,'new@test.com','viewer','Invitation')",
      [doc, owner],
    );
    expect((await db.query("select * from users")).rows).toHaveLength(3);
    expect(
      (await db.query("select * from notification_outbox")).rows,
    ).toHaveLength(1);
  });
  it("only binds invitations after email confirmation", async () => {
    await db.query(
      "select plainpage_invite($1,$2,'stranger@test.com','viewer','Invitation')",
      [doc, owner],
    );
    await db.query("select plainpage_accept_invites($1)", [stranger]);
    expect(
      (await db.query("select * from shares where user_id=$1", [stranger]))
        .rows,
    ).toHaveLength(0);
    await db.query(
      "update auth.users set email_confirmed_at=now() where id=$1",
      [stranger],
    );
    await db.query("select plainpage_accept_invites($1)", [stranger]);
    expect(
      (await db.query("select * from shares where user_id=$1", [stranger]))
        .rows,
    ).toHaveLength(1);
  });
  it("makes invitation acceptance idempotent", async () => {
    await db.query(
      "select plainpage_invite($1,$2,'bob@test.com','viewer','Invitation')",
      [doc, owner],
    );
    await db.query("select plainpage_accept_invites($1)", [bob]);
    await db.query("select plainpage_accept_invites($1)", [bob]);
    expect(
      (await db.query("select * from shares where user_id=$1", [bob])).rows,
    ).toHaveLength(1);
  });
  it("requires all approvals before finalizing the reviewed revision", async () => {
    await review("request");
    await expect(review("final")).rejects.toThrow("CONFLICT");
    await review("approved", bob);
    await review("final");
    expect(
      (
        await db.query<{ review_status: string }>(
          "select review_status from documents",
        )
      ).rows[0].review_status,
    ).toBe("final");
  });
  it("invalidates approvals when content changes", async () => {
    await review("request");
    await review("approved", bob);
    await save();
    await expect(review("final", owner, 2)).rejects.toThrow("CONFLICT");
    expect(
      (
        await db.query<{ review_status: string }>(
          "select review_status from documents",
        )
      ).rows[0].review_status,
    ).toBe("draft");
  });
  it("requires feedback for changes requested", async () => {
    await review("request");
    await expect(review("changes_requested", bob)).rejects.toThrow(
      "VALIDATION",
    );
    await review("changes_requested", bob, 1, "Clarify the goal.");
  });
  it("does not accept a response after access is revoked", async () => {
    await review("request");
    await db.query("delete from shares where user_id=$1", [bob]);
    await expect(review("approved", bob)).rejects.toThrow("FORBIDDEN");
  });
  it("limits AI reservations atomically", async () => {
    for (let i = 0; i < 3; i++)
      await db.query("select plainpage_ai_reserve($1,3)", [owner]);
    await expect(
      db.query("select plainpage_ai_reserve($1,3)", [owner]),
    ).rejects.toThrow("RATE_LIMITED");
  });
  it("leases mail so another worker cannot claim it at once", async () => {
    await db.query(
      "select plainpage_invite($1,$2,'new@test.com','viewer','Invitation')",
      [doc, owner],
    );
    expect(
      (await db.query("select * from plainpage_claim_mail()")).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select * from plainpage_claim_mail()")).rows,
    ).toHaveLength(0);
  });
  it("revokes an accepted invitation and its granted access", async () => {
    await db.query(
      "select plainpage_invite($1,$2,'bob@test.com','viewer','Invitation')",
      [doc, owner],
    );
    await db.query("select plainpage_accept_invites($1)", [bob]);
    const i = await db.query<{ id: string }>(
      "select id from document_invitations",
    );
    await db.query("select plainpage_revoke_invite($1,$2)", [
      i.rows[0].id,
      owner,
    ]);
    expect(
      (await db.query("select * from shares where user_id=$1", [bob])).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from notification_outbox")).rows,
    ).toHaveLength(0);
  });
  it("deletes the public profile atomically when its Auth identity is deleted", async () => {
    await db.query("delete from auth.users where id=$1", [bob]);
    expect(
      (await db.query("select * from public.users where id=$1", [bob])).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from shares where user_id=$1", [bob])).rows,
    ).toHaveLength(0);
  });
  it("does not grant browser roles RPC execution", async () => {
    const r = await db.query<{ allowed: boolean }>(
      "select has_function_privilege('authenticated','public.plainpage_save(uuid,uuid,bigint,text,jsonb,bigint)','EXECUTE') allowed",
    );
    expect(r.rows[0].allowed).toBe(false);
  });
});
