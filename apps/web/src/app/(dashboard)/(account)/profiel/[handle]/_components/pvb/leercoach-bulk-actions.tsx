"use client";

import { CheckIcon } from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import { Text } from "~/app/(dashboard)/_components/text";
import { bulkGrantLeercoachPermissionAction } from "~/app/_actions/pvb/leercoach-permission-action";
import type { listPvbsForPersonAsLeercoach } from "~/lib/nwd";

export function LeercoachBulkActions({
  pvbsNeedingPermission,
}: {
  pvbsNeedingPermission: Awaited<
    ReturnType<typeof listPvbsForPersonAsLeercoach>
  >;
}) {
  const [selectedPvbs, setSelectedPvbs] = useState<Set<string>>(new Set());
  const bulkGrantAction = useAction(bulkGrantLeercoachPermissionAction);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPvbs(new Set(pvbsNeedingPermission.map((pvb) => pvb.id)));
    } else {
      setSelectedPvbs(new Set());
    }
  };

  const handleSelectPvb = (pvbId: string, checked: boolean) => {
    const newSelection = new Set(selectedPvbs);
    if (checked) {
      newSelection.add(pvbId);
    } else {
      newSelection.delete(pvbId);
    }
    setSelectedPvbs(newSelection);
  };

  const handleBulkGrant = () => {
    if (selectedPvbs.size === 0) {
      toast.error("Selecteer minimaal één aanvraag");
      return;
    }

    const pvbIds = Array.from(selectedPvbs);
    if (pvbIds.length === 0) return;

    bulkGrantAction.execute({
      pvbAanvraagIds: pvbIds as [string, ...string[]],
    });
  };

  // Handle action result
  useEffect(() => {
    if (bulkGrantAction.result.data) {
      toast.success(bulkGrantAction.result.data.message);
      setSelectedPvbs(new Set());
      bulkGrantAction.reset();
    } else if (bulkGrantAction.result.serverError) {
      toast.error(bulkGrantAction.result.serverError);
    }
  }, [bulkGrantAction.result, bulkGrantAction.reset]);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={
              pvbsNeedingPermission.length > 0 &&
              selectedPvbs.size === pvbsNeedingPermission.length
            }
            indeterminate={
              selectedPvbs.size > 0 &&
              selectedPvbs.size < pvbsNeedingPermission.length
            }
            onChange={(checked) => handleSelectAll(checked)}
          />
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            {pvbsNeedingPermission.length} aanvragen wachten op toestemming
          </Text>
        </div>
        <Button
          color="branding-light"
          onClick={handleBulkGrant}
          disabled={
            selectedPvbs.size === 0 || bulkGrantAction.status === "executing"
          }
        >
          <CheckIcon />
          {bulkGrantAction.status === "executing"
            ? "Bezig..."
            : `Toestemming geven (${selectedPvbs.size})`}
        </Button>
      </div>

      {/* Individual checkboxes for each PvB */}
      <div className="space-y-2 mb-4">
        {pvbsNeedingPermission.map((pvb) => (
          <div key={pvb.id} className="flex items-center gap-2">
            <Checkbox
              checked={selectedPvbs.has(pvb.id)}
              onChange={(checked) => handleSelectPvb(pvb.id, checked)}
            />
            <Text className="text-sm">
              {pvb.handle} - {pvb.kandidaat.firstName}{" "}
              {pvb.kandidaat.lastNamePrefix} {pvb.kandidaat.lastName}
            </Text>
          </div>
        ))}
      </div>
    </>
  );
}
