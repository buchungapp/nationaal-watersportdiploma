import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateInstructorProgrammeRows,
  type InstructorProgrammeExportStudent,
} from "./aggregate-instructor-programmes.ts";

const instructorA = {
  id: "instructor-a",
  firstName: "Jan",
  lastNamePrefix: "de",
  lastName: "Vries",
};

const instructorB = {
  id: "instructor-b",
  firstName: "Pieter",
  lastNamePrefix: null,
  lastName: "Jansen",
};

function student(
  overrides: Partial<InstructorProgrammeExportStudent> &
    Pick<InstructorProgrammeExportStudent, "instructor">,
): InstructorProgrammeExportStudent {
  return {
    studentCurriculum: null,
    ...overrides,
  };
}

describe("aggregateInstructorProgrammeRows", () => {
  it("groups by instructeur and programma and counts cursisten", () => {
    const rows = aggregateInstructorProgrammeRows([
      student({
        instructor: instructorA,
        studentCurriculum: {
          program: { id: "prog-1" },
          course: { title: "Zeilen" },
          degree: { title: "CWO 3" },
        },
      }),
      student({
        instructor: instructorA,
        studentCurriculum: {
          program: { id: "prog-1" },
          course: { title: "Zeilen" },
          degree: { title: "CWO 3" },
        },
      }),
      student({
        instructor: instructorA,
        studentCurriculum: {
          program: { id: "prog-2" },
          course: { title: "SUP" },
          degree: { title: "Initiator" },
        },
      }),
      student({
        instructor: instructorB,
        studentCurriculum: {
          program: { id: "prog-3" },
          course: { title: "Kano" },
          degree: { title: "Basis" },
        },
      }),
    ]);

    assert.deepEqual(rows, [
      ["Jan de Vries", "SUP Initiator", "1"],
      ["Jan de Vries", "Zeilen CWO 3", "2"],
      ["Pieter Jansen", "Kano Basis", "1"],
    ]);
  });

  it("handles studentCurriculum without program record", () => {
    const rows = aggregateInstructorProgrammeRows([
      student({
        instructor: instructorA,
        studentCurriculum: {
          course: { title: "Zeilen" },
          degree: { title: "CWO 3" },
        },
      }),
    ]);

    assert.deepEqual(rows, [["Jan de Vries", "Zeilen CWO 3", "1"]]);
  });

  it("uses Geen programma when studentCurriculum is missing", () => {
    const rows = aggregateInstructorProgrammeRows([
      student({ instructor: instructorA }),
      student({ instructor: instructorA }),
    ]);

    assert.deepEqual(rows, [["Jan de Vries", "Geen programma", "2"]]);
  });

  it("excludes unclaimed cursisten", () => {
    const rows = aggregateInstructorProgrammeRows([
      student({ instructor: null }),
      student({
        instructor: instructorA,
        studentCurriculum: {
          program: { id: "prog-1" },
          course: { title: "Zeilen" },
          degree: { title: "CWO 3" },
        },
      }),
    ]);

    assert.deepEqual(rows, [["Jan de Vries", "Zeilen CWO 3", "1"]]);
  });

  it("returns empty rows when no cursisten are claimed", () => {
    const rows = aggregateInstructorProgrammeRows([
      student({ instructor: null }),
    ]);

    assert.deepEqual(rows, []);
  });
});
