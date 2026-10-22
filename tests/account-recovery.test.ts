import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  reset: vi.fn(),
  update: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: mocks.getUser,
      resetPasswordForEmail: mocks.reset,
      updateUser: mocks.update,
      signOut: mocks.signOut,
    },
  }),
}));
import { POST as forgot } from "@/app/api/forgot-password/route";
import { POST as change } from "@/app/api/account/password/route";
const req = (body: object) =>
  new NextRequest("https://plainpage.test/api/account/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.reset.mockResolvedValue({ error: null });
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "verified" } },
    error: null,
  });
  mocks.update.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
});
describe("account recovery", () => {
  it("validates reset email without contacting the provider for invalid input", async () => {
    expect((await forgot(req({ email: "invalid" }))).status).toBe(400);
    expect(mocks.reset).not.toHaveBeenCalled();
  });
  it.each([null, { message: "Unknown account" }, { message: "Rate limited" }])(
    "does not reveal account existence for provider result %j",
    async (error) => {
      mocks.reset.mockResolvedValue({ error });
      const response = await forgot(req({ email: "user@test.com" }));
      expect(response.status).toBe(200);
      expect((await response.json()).message).toContain("If an account exists");
      expect(mocks.reset).toHaveBeenCalledWith("user@test.com", {
        redirectTo: "https://plainpage.test/auth/callback?next=/reset-password",
      });
    },
  );
  it("rejects password updates without a verified session", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "expired" },
    });
    expect((await change(req({ password: "newsecurepassword" }))).status).toBe(
      401,
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects short reset passwords", async () => {
    expect((await change(req({ password: "short" }))).status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("updates the password and signs out the reset session", async () => {
    expect((await change(req({ password: "newsecurepassword" }))).status).toBe(
      200,
    );
    expect(mocks.update).toHaveBeenCalledWith({
      password: "newsecurepassword",
    });
    expect(mocks.signOut).toHaveBeenCalledOnce();
  });
  it("shows provider validation failures without reporting success", async () => {
    mocks.update.mockResolvedValue({ error: { message: "Password policy" } });
    expect((await change(req({ password: "newsecurepassword" }))).status).toBe(
      400,
    );
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
