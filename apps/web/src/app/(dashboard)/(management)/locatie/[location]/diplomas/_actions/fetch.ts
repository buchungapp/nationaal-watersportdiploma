"use server";

import { listCurriculaByProgram, listGearTypesByCurriculum } from "~/lib/nwd";

export async function getCurriculaByProgram(programId: string) {
  return await listCurriculaByProgram(programId, true);
}

export async function getGearTypesByCurriculum(curriculumId: string) {
  return await listGearTypesByCurriculum(curriculumId);
}
