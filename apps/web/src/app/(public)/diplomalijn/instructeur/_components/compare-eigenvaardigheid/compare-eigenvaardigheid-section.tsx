import { getEigenvaardigheidCompareData } from "~/lib/eigenvaardigheid-compare";
import { getIsActiveInstructor } from "~/lib/nwd";
import { CompareEigenvaardigheid } from "./compare-eigenvaardigheid";

export async function CompareEigenvaardigheidSection() {
  const [disciplines, canViewRequirements] = await Promise.all([
    getEigenvaardigheidCompareData(),
    getIsActiveInstructor(),
  ]);

  return (
    <CompareEigenvaardigheid
      disciplines={disciplines}
      canViewRequirements={canViewRequirements}
    />
  );
}
