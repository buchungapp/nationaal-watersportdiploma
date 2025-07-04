"use server";

import {
  grantPvbLeercoachPermission,
  retrievePvbAanvraagByHandle,
  updatePvbBeoordelaar,
  updatePvbLeercoach,
  updatePvbStartTime,
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

export async function grantPvbLeercoachPermissionAction(handle: string) {
  const aanvraag = await retrievePvbAanvraagByHandle(handle);
  await grantPvbLeercoachPermission({
    pvbAanvraagId: aanvraag.id,
  });
}
