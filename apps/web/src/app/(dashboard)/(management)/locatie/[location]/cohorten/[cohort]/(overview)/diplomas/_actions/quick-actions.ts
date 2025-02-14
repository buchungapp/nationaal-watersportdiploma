"use server";

import { revalidatePath } from "next/cache";
import {
  issueCertificatesInCohort,
  updateDefaultCertificateVisibleFromDate,
  withdrawCertificatesInCohort,
} from "~/lib/nwd";

export async function issueCertificates({
  cohortAllocationIds,
  visibleFrom,
  cohortId,
}: {
  cohortAllocationIds: string[];
  visibleFrom: string | null;
  cohortId: string;
}) {
  if (cohortAllocationIds.length === 0) {
    return;
  }

  const result = await issueCertificatesInCohort({
    cohortId,
    studentAllocationIds: cohortAllocationIds,
    visibleFrom: visibleFrom ?? undefined,
  });

  if (visibleFrom) {
    await updateDefaultCertificateVisibleFromDate({
      cohortId,
      visibleFrom,
    });
  }

  revalidatePath("/locatie/[location]/diplomas", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");

  return result;
}

export async function withDrawCertificates({
  certificateIds,
  cohortId,
}: {
  certificateIds: string[];
  cohortId: string;
}) {
  if (certificateIds.length === 0) {
    return;
  }

  const result = await withdrawCertificatesInCohort({
    cohortId,
    certificateIds,
  });

  revalidatePath("/locatie/[location]/diplomas", "page");
  revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");

  return result;
}
