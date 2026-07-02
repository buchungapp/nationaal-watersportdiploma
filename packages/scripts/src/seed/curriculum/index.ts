import { processing } from "../utils/processing.ts";
import { addCategories } from "./categories.ts";
import { addCompetences } from "./competencies.ts";
import { addCourses } from "./courses.ts";
import { addCurriculum } from "./curriculum.ts";
import { addDegrees } from "./degrees.ts";
import { addDisciplines } from "./disciplines.ts";
import { addGearTypes } from "./gear-types.ts";
import { addModules } from "./modules.ts";
import { addPrograms } from "./programs.ts";

const INDENTATION = 2;
export async function addCurriculumAndDependencies() {
  // Add disciplines
  await processing(
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await addDisciplines();
    },
    {
      icon: "📚",
      text: "Adding disciplines...",
      successText: "Disciplines added",
      failText: "Failed to add disciplines",
      indentation: INDENTATION,
    },
  );

  // Add categories
  await processing(addCategories, {
    icon: "🔠",
    text: "Adding categories...",
    successText: "Categories added",
    failText: "Failed to add categories",
    indentation: INDENTATION,
  });

  // Add degrees
  await processing(addDegrees, {
    icon: "🎓",
    text: "Adding degrees...",
    successText: "Degrees added",
    failText: "Failed to add degrees",
    indentation: INDENTATION,
  });

  // Add gear types
  await processing(addGearTypes, {
    icon: "⛵",
    text: "Adding gear types...",
    successText: "Gear types added",
    failText: "Failed to add gear types",
    indentation: INDENTATION,
  });

  // Add courses
  await processing(addCourses, {
    icon: "📖",
    text: "Adding courses...",
    successText: "Courses added",
    failText: "Failed to add courses",
    indentation: INDENTATION,
  });

  // Add programs
  await processing(addPrograms, {
    icon: "📃",
    text: "Adding programs...",
    successText: "Programs added",
    failText: "Failed to add programs",
    indentation: INDENTATION,
  });

  // Add modules
  await processing(addModules, {
    icon: "🧩",
    text: "Adding modules...",
    successText: "Modules added",
    failText: "Failed to add modules",
    indentation: INDENTATION,
  });

  // Add competences
  await processing(addCompetences, {
    icon: "🎯",
    text: "Adding competences...",
    successText: "Competences added",
    failText: "Failed to add competences",
    indentation: INDENTATION,
  });

  // Add curriculum
  await processing(addCurriculum, {
    icon: "🏫",
    text: "Adding curriculum...",
    successText: "Curriculum added",
    failText: "Failed to add curriculum",
    indentation: INDENTATION,
  });
}
