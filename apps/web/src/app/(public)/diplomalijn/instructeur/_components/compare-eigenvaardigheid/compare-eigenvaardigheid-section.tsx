import { getEigenvaardigheidCompareData } from "~/lib/eigenvaardigheid-compare";
import { getIsActiveInstructor } from "~/lib/nwd";
import { CompareEigenvaardigheid } from "./compare-eigenvaardigheid";

export async function CompareEigenvaardigheidSection() {
  const [disciplines, canViewRequirements] = await Promise.all([
    getEigenvaardigheidCompareData(),
    getIsActiveInstructor(),
  ]);

  // Client props are public: redact before serialization without changing
  // the cached data shared with authorized requests.
  const visibleDisciplines = canViewRequirements
    ? disciplines
    : disciplines.map((discipline) => ({
        ...discipline,
        levels: discipline.levels.map((level) => ({
          ...level,
          modules: level.modules.map((module) => ({
            ...module,
            competencies: module.competencies.map((competency) => ({
              ...competency,
              requirement: null,
            })),
          })),
        })),
      }));

  return (
    <CompareEigenvaardigheid
      disciplines={visibleDisciplines}
      canViewRequirements={canViewRequirements}
    />
  );
}
