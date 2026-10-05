import { describe, expect, it, vi } from "vitest";
import { getEigenvaardigheidCompareData } from "~/lib/eigenvaardigheid-compare";
import { getIsActiveInstructor } from "~/lib/nwd";
import { CompareEigenvaardigheidSection } from "./compare-eigenvaardigheid-section";
import type { CompareDiscipline } from "./types";

vi.mock("~/lib/eigenvaardigheid-compare", () => ({
  getEigenvaardigheidCompareData: vi.fn(),
}));
vi.mock("~/lib/nwd", () => ({ getIsActiveInstructor: vi.fn() }));
vi.mock("./compare-eigenvaardigheid", () => ({
  CompareEigenvaardigheid: () => null,
}));

const disciplines: CompareDiscipline[] = ["kielboot", "windsurfen"].map(
  (handle) => ({
    id: handle,
    handle,
    title: handle,
    programPageHref: `/disciplines/${handle}`,
    levels: ["A", "B"].map((letter) => ({
      programId: `${handle}-${letter}`,
      label: `NWD ${letter}`,
      letter,
      hasModules: true,
      modules: [
        {
          moduleId: "module",
          handle: "module",
          title: "Module",
          weight: 1,
          competencies: [
            {
              competencyId: "competency",
              handle: "competency",
              title: "Public title",
              weight: 1,
              requirement: `Restricted requirement ${handle}-${letter}`,
            },
          ],
        },
      ],
    })),
  }),
);

describe("requirement authorization at the client boundary", () => {
  it("redacts all unauthorized client props without changing cached data", async () => {
    const original = structuredClone(disciplines);
    vi.mocked(getEigenvaardigheidCompareData).mockResolvedValue(disciplines);
    vi.mocked(getIsActiveInstructor).mockResolvedValue(false);

    const element = await CompareEigenvaardigheidSection();
    expect(element.props.canViewRequirements).toBe(false);
    expect(JSON.stringify(element.props)).not.toContain(
      "Restricted requirement",
    );
    for (const discipline of element.props.disciplines as CompareDiscipline[]) {
      for (const level of discipline.levels) {
        expect(level.modules[0]?.competencies[0]?.requirement).toBeNull();
        expect(level.modules[0]?.competencies[0]?.title).toBe("Public title");
      }
    }
    expect(disciplines).toEqual(original);

    // A later authorized request must still receive the complete cached data.
    vi.mocked(getIsActiveInstructor).mockResolvedValue(true);
    const authorizedElement = await CompareEigenvaardigheidSection();
    expect(authorizedElement.props.canViewRequirements).toBe(true);
    expect(authorizedElement.props.disciplines).toEqual(original);
  });
});
