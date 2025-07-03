"use client";

import { useAction } from "next-safe-action/hooks";
import { useParams } from "next/navigation";
import {
  cancelPvbsAction,
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
  locationId: string;
}

export function PvbTableWrapper({
  pvbs,
  totalItems,
  placeholderRows,
  locationId,
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

  const handleUpdateStartTime = async (pvbIds: string[], startTime: string) => {
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
    await executeUpdateBeoordelaar({
      locationHandle,
      pvbAanvraagIds: pvbIds,
      beoordelaarId,
    });
  };

  const handleCancel = async (pvbIds: string[]) => {
    await executeCancel({
      locationHandle,
      pvbAanvraagIds: pvbIds,
    });
  };

  const handleSubmit = async (pvbIds: string[]) => {
    await executeSubmit({
      locationHandle,
      pvbAanvraagIds: pvbIds,
    });
  };

  return (
    <PvbTable
      pvbs={pvbs}
      totalItems={totalItems}
      placeholderRows={placeholderRows}
      locationId={locationId}
      onUpdateStartTime={handleUpdateStartTime}
      onUpdateLeercoach={handleUpdateLeercoach}
      onUpdateBeoordelaar={handleUpdateBeoordelaar}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
    />
  );
}
