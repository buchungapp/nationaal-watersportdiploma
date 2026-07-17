import { describe, expect, it } from "vitest";
import { displayableExternalCertificateMetadata } from "./external-certificate-metadata";

describe("displayableExternalCertificateMetadata", () => {
  it("keeps public scalar values", () => {
    expect(
      displayableExternalCertificateMetadata({
        discipline: "Kielboot",
        level: 3,
        current: true,
      }),
    ).toEqual([
      ["discipline", "Kielboot"],
      ["level", "3"],
      ["current", "true"],
    ]);
  });

  it("hides internal and structured provenance metadata", () => {
    expect(
      displayableExternalCertificateMetadata({
        discipline: "Kielboot",
        __verified: true,
        legacyCwo: {
          importKey: "private-import-key",
          rowHashes: ["private-row-hash"],
        },
        tags: ["legacy"],
        empty: null,
      }),
    ).toEqual([["discipline", "Kielboot"]]);
  });

  it("hides the legacy CWO key even when its value is scalar", () => {
    expect(
      displayableExternalCertificateMetadata({ legacyCwo: "private" }),
    ).toEqual([]);
  });

  it("handles missing metadata", () => {
    expect(displayableExternalCertificateMetadata(null)).toEqual([]);
    expect(displayableExternalCertificateMetadata(undefined)).toEqual([]);
  });
});
