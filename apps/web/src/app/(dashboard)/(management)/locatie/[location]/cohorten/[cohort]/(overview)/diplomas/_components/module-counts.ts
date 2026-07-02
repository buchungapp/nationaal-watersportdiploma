type ModuleType = "required" | "optional";

type ModuleStatus = {
  module: {
    type: string;
  };
  newlyIssuable: boolean;
  completedCompetenciesInCertificate: number;
};

export function countDisplayModules(
  moduleStatus: ModuleStatus[],
  type: ModuleType,
  hasIssuedCertificate: boolean,
) {
  return moduleStatus.filter(
    (status) =>
      status.module.type === type &&
      (hasIssuedCertificate
        ? status.completedCompetenciesInCertificate > 0
        : status.newlyIssuable),
  ).length;
}
