"use server";

import {
  grantPvbLeercoachPermission,
  retrievePvbAanvraagByHandle,
  submitPvbAanvraag,
  updatePvbBeoordelaar,
  updatePvbLeercoach,
  updatePvbStartTime,
  withdrawPvbAanvraag,
} from "~/lib/nwd";

export async function updatePvbLeercoachAction(
  handle: string,
  leercoachId: string,
) {
  const aanvraag = await retrievePvbAanvraagByHandle(handle);
  await updatePvbLeercoach({
    pvbAanvraagId: aanvraag.id,
    leercoachId,
  });
}

export async function updatePvbBeoordelaarAction(
  handle: string,
  beoordelaarId: string,
) {
  const aanvraag = await retrievePvbAanvraagByHandle(handle);
  await updatePvbBeoordelaar({
    pvbAanvraagId: aanvraag.id,
    beoordelaarId,
  });
}

export async function updatePvbStartTimeAction(
  handle: string,
  startDatumTijd: string,
) {
  const aanvraag = await retrievePvbAanvraagByHandle(handle);
  await updatePvbStartTime({
    pvbAanvraagId: aanvraag.id,
    startDatumTijd,
  });
}

export async function grantPvbLeercoachPermissionAction(
  handle: string,
  reason?: string,
) {
  const aanvraag = await retrievePvbAanvraagByHandle(handle);
  await grantPvbLeercoachPermission({
    pvbAanvraagId: aanvraag.id,
    reden: reason,
  });
}

export async function submitPvbAanvraagAction(handle: string) {
  const aanvraag = await retrievePvbAanvraagByHandle(handle);
  await submitPvbAanvraag({
    pvbAanvraagId: aanvraag.id,
  });
}

export async function withdrawPvbAanvraagAction(
  handle: string,
  reason?: string,
) {
  const aanvraag = await retrievePvbAanvraagByHandle(handle);
  await withdrawPvbAanvraag({
    pvbAanvraagId: aanvraag.id,
    reden: reason,
  });
}
