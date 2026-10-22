import { describe, expect, it } from "vitest";
import { analyzeClarity } from "@/lib/clarity";
import { documentMarkdown, documentText } from "@/lib/document-export";
import { redactMonitoringEvent } from "@/lib/monitoring";
describe("document portability and privacy", () => {
  it("exports headings and marked text as Markdown", () => {
    expect(
      documentMarkdown({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Goal", marks: [{ type: "bold" }] }],
      }),
    ).toBe("## **Goal**\n\n");
  });
  it("exports task completion state", () => {
    expect(
      documentMarkdown({
        type: "taskList",
        content: [
          {
            type: "taskItem",
            attrs: { checked: true },
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Review" }],
              },
            ],
          },
        ],
      }),
    ).toContain("- [x] Review");
  });
  it("exports tables with a header separator", () => {
    expect(
      documentMarkdown({
        type: "table",
        content: [
          {
            type: "tableRow",
            content: [
              {
                type: "tableHeader",
                content: [{ type: "text", text: "Goal" }],
              },
            ],
          },
          {
            type: "tableRow",
            content: [
              {
                type: "tableCell",
                content: [{ type: "text", text: "Launch" }],
              },
            ],
          },
        ],
      }),
    ).toContain("| --- |");
  });
  it("does not export a javascript URL as a Markdown link", () => {
    expect(
      documentMarkdown({
        type: "text",
        text: "Link",
        marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
      }),
    ).toBe("Link");
  });
  it("extracts text without executing imported HTML", () => {
    expect(
      documentText({ _html: "<p>Hello <strong>team</strong></p>" }),
    ).toContain("Hello");
    expect(documentText({ _html: "<p>Hello</p>" })).not.toContain("<p>");
  });
  it("flags local sentence and jargon checks without an AI call", () => {
    const report = analyzeClarity(
      "We leverage tools. " + Array(30).fill("word").join(" ") + ".",
    );
    expect(report.longSentences).toHaveLength(1);
    expect(report.jargon).toContain("leverage");
  });
  it("removes document content and account identity from monitoring payloads", () => {
    const event = redactMonitoringEvent({
      type: undefined,
      event_id: "test",
      user: { email: "private@test.com" },
      request: { data: "secret document" },
      extra: { document: "secret" },
      breadcrumbs: [{ message: "private" }],
      exception: {
        values: [
          {
            type: "TypeError",
            value: "secret paragraph",
            stacktrace: {
              frames: [
                {
                  filename: "app.js?private=secret",
                  function: "save",
                  lineno: 1,
                },
              ],
            },
          },
        ],
      },
    });
    const encoded = JSON.stringify(event);
    expect(encoded).not.toContain("secret");
    expect(encoded).not.toContain("private");
    expect(encoded).toContain("TypeError");
    expect(encoded).toContain("app.js");
  });
});
