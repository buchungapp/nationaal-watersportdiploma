import { describe, expect, it } from "vitest";
import { countDisplayModules } from "./module-counts";

function requiredModule({
  newlyIssuable,
  completedCompetenciesInCertificate,
}: {
  newlyIssuable: boolean;
  completedCompetenciesInCertificate: number;
}) {
  return {
    module: { type: "required" },
    newlyIssuable,
    completedCompetenciesInCertificate,
  };
}

function optionalModule({
  newlyIssuable,
  completedCompetenciesInCertificate,
}: {
  newlyIssuable: boolean;
  completedCompetenciesInCertificate: number;
}) {
  return {
    module: { type: "optional" },
    newlyIssuable,
    completedCompetenciesInCertificate,
  };
}

describe("countDisplayModules", () => {
  it("counts newly issuable modules before a cohort certificate is issued", () => {
    const moduleStatus = [
      requiredModule({
        newlyIssuable: false,
        completedCompetenciesInCertificate: 0,
      }),
      requiredModule({
        newlyIssuable: true,
        completedCompetenciesInCertificate: 0,
      }),
      requiredModule({
        newlyIssuable: true,
        completedCompetenciesInCertificate: 0,
      }),
      requiredModule({
        newlyIssuable: true,
        completedCompetenciesInCertificate: 0,
      }),
    ];

    expect(countDisplayModules(moduleStatus, "required", false)).toBe(3);
  });

  it("counts modules on the issued cohort certificate after issuance", () => {
    const moduleStatus = [
      requiredModule({
        newlyIssuable: false,
        completedCompetenciesInCertificate: 0,
      }),
      requiredModule({
        newlyIssuable: false,
        completedCompetenciesInCertificate: 1,
      }),
      requiredModule({
        newlyIssuable: false,
        completedCompetenciesInCertificate: 1,
      }),
      requiredModule({
        newlyIssuable: false,
        completedCompetenciesInCertificate: 1,
      }),
    ];

    expect(countDisplayModules(moduleStatus, "required", true)).toBe(3);
  });

  it("keeps required and optional module counts separate", () => {
    const moduleStatus = [
      requiredModule({
        newlyIssuable: true,
        completedCompetenciesInCertificate: 0,
      }),
      optionalModule({
        newlyIssuable: true,
        completedCompetenciesInCertificate: 0,
      }),
      optionalModule({
        newlyIssuable: false,
        completedCompetenciesInCertificate: 1,
      }),
    ];

    expect(countDisplayModules(moduleStatus, "required", false)).toBe(1);
    expect(countDisplayModules(moduleStatus, "optional", false)).toBe(1);
    expect(countDisplayModules(moduleStatus, "required", true)).toBe(0);
    expect(countDisplayModules(moduleStatus, "optional", true)).toBe(1);
  });
});
