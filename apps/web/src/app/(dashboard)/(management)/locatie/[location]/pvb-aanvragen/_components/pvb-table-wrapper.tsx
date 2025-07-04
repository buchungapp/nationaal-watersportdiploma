"use client";

import { useAction } from "next-safe-action/hooks";
import { useParams } from "next/navigation";
import {
  cancelPvbsAction,
  grantLeercoachPermissionAction,
  submitPvbsAction,
  updatePvbBeoordelaarAction,
  updatePvbLeercoachAction,
  updatePvbStartTimeAction,
} from "~/app/_actions/pvb/bulk-operations-action";
import type { listPvbs } from "~/lib/nwd";
import PvbTable from "./table";

type PvbAanvraag = Awaited<ReturnType<typeof listPvbs>>[number];

interface PvbTableWrapperProps {
  pvbs: PvbAanvraag[];
  totalItems: number;
  placeholderRows?: number;
  location: {
    id: string;
    handle: string;
  };
}

// Helper function to check if array has at least one item and act as type guard
function hasMinimumOneItem<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

export function PvbTableWrapper({
  pvbs,
  totalItems,
  placeholderRows,
  location,
}: PvbTableWrapperProps) {
  const params = useParams();
  const locationHandle = params.location as string;

  const { execute: executeUpdateStartTime } = useAction(
    updatePvbStartTimeAction,
  );
  const { execute: executeUpdateLeercoach } = useAction(
    updatePvbLeercoachAction,
  );
  const { execute: executeUpdateBeoordelaar } = useAction(
    updatePvbBeoordelaarAction,
  );
  const { execute: executeCancel } = useAction(cancelPvbsAction);
  const { execute: executeSubmit } = useAction(submitPvbsAction);
  const { execute: executeGrantLeercoachPermission } = useAction(
    grantLeercoachPermissionAction,
  );

  const handleUpdateStartTime = async (pvbIds: string[], startTime: string) => {
    if (!hasMinimumOneItem(pvbIds)) return;

    const isoDateTime = new Date(startTime).toISOString();
    executeUpdateStartTime({
      locationHandle,
      pvbAanvraagIds: pvbIds,
      startDatumTijd: isoDateTime,
    });
  };

  const handleUpdateLeercoach = async (
    pvbIds: string[],
    leercoachId: string,
  ) => {
    if (!hasMinimumOneItem(pvbIds)) return;

    await executeUpdateLeercoach({
      locationHandle,
      pvbAanvraagIds: pvbIds,
      leercoachId,
    });
  };

  const handleUpdateBeoordelaar = async (
    pvbIds: string[],
    beoordelaarId: string,
  ) => {
    if (!hasMinimumOneItem(pvbIds)) return;

    await executeUpdateBeoordelaar({
      locationHandle,
      pvbAanvraagIds: pvbIds,
      beoordelaarId,
    });
  };

  const handleCancel = async (pvbIds: string[]) => {
    if (!hasMinimumOneItem(pvbIds)) return;

    await executeCancel({
      locationHandle,
      pvbAanvraagIds: pvbIds,
    });
  };

  const handleSubmit = async (pvbIds: string[]) => {
    if (!hasMinimumOneItem(pvbIds)) return;

    await executeSubmit({
      locationHandle,
      pvbAanvraagIds: pvbIds,
    });
  };

  const handleGrantLeercoachPermission = async (pvbIds: string[]) => {
    if (!hasMinimumOneItem(pvbIds)) return;

    await executeGrantLeercoachPermission({
      locationHandle,
      pvbAanvraagIds: pvbIds,
    });
  };

  return (
    <PvbTable
      pvbs={pvbs}
      totalItems={totalItems}
      placeholderRows={placeholderRows}
      location={location}
      onUpdateStartTime={handleUpdateStartTime}
      onUpdateLeercoach={handleUpdateLeercoach}
      onUpdateBeoordelaar={handleUpdateBeoordelaar}
      onGrantLeercoachPermission={handleGrantLeercoachPermission}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
    />
  );
}
