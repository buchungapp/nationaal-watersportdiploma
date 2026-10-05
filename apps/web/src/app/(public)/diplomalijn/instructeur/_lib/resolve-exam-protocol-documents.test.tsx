import { describe, expect, it } from "vitest";
import { buildExamProtocolOptions } from "./resolve-exam-protocol-documents";

describe("buildExamProtocolOptions", () => {
  it.each([
    false,
    true,
  ])("selects the newest version regardless of input order (%s)", (reverse) => {
    const documents = [
      "Exameneisen Kielboot.pdf",
      "Examenprotocol NWD-C.pdf",
    ].flatMap((name, index) => [
      {
        id: `old-${index}`,
        name,
        updatedAt: "2025-01-01T00:00:00Z",
        size: 100,
      },
      {
        id: `new-${index}`,
        name,
        updatedAt: "2026-08-01T00:00:00Z",
        size: 200,
      },
    ]);
    const options = buildExamProtocolOptions(
      reverse ? documents.reverse() : documents,
    );
    expect(
      options.find((option) => option.id === "kielboot")?.document?.id,
    ).toBe("new-0");
    expect(options.find((option) => option.id === "nwd-c")?.document?.id).toBe(
      "new-1",
    );
  });

  it("compares instants rather than timestamp strings", () => {
    const options = buildExamProtocolOptions([
      {
        id: "older",
        name: "Exameneisen Kielboot.pdf",
        updatedAt: "2026-08-01T12:00:00+02:00",
        size: 100,
      },
      {
        id: "newer",
        name: "Exameneisen Kielboot.pdf",
        updatedAt: "2026-08-01T11:00:00Z",
        size: 200,
      },
    ]);
    expect(
      options.find((option) => option.id === "kielboot")?.document?.id,
    ).toBe("newer");
  });

  it.each([null, []])("keeps missing documents unavailable", (documents) => {
    expect(
      buildExamProtocolOptions(documents).every(
        (option) => option.document === null,
      ),
    ).toBe(true);
  });
});
