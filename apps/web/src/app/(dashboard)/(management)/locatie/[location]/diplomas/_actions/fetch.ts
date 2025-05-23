"use server";

import {
  listCurriculaByProgram,
  listGearTypesByCurriculumForLocation,
} from "~/lib/nwd";

export async function getCurriculaByProgram(programId: string) {
  return await listCurriculaByProgram(programId, true);
}

export async function getGearTypesByCurriculumForLocation(
  locationId: string,
  curriculumId: string,
) {
  return await listGearTypesByCurriculumForLocation(locationId, curriculumId);
}
