"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { ActivateDialog } from "./activate-dialog";
import { BeoordelaarDialog } from "./beoordelaar-dialog";
import { LeercoachDialog } from "./leercoach-dialog";
import { PermissionDialog } from "./permission-dialog";
import { StartTimeDialog } from "./start-time-dialog";
import { WithdrawDialog } from "./withdraw-dialog";

type PvbAanvraag = {
  id: string;
  status:
    | "concept"
    | "wacht_op_voorwaarden"
    | "gereed_voor_beoordeling"
    | "in_beoordeling"
    | "afgerond"
    | "ingetrokken"
    | "afgebroken";
  leercoach: {
    id: string;
    status: "gevraagd" | "gegeven" | "geweigerd" | "herroepen" | null;
  } | null;
  onderdelen: Array<{
    beoordelaar: { id: string } | null;
  }>;
};

export function AanvraagActions({
  params,
  aanvraag,
  locatieId,
}: {
  params: Promise<{ location: string; handle: string }>;
  aanvraag: PvbAanvraag;
  locatieId: string;
}) {
  const [leercoachOpen, setLeercoachOpen] = useState(false);
  const [beoordelaarOpen, setBeoordelaarOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Determine which actions are available based on business logic
  const canActivate = aanvraag.status === "concept";
  const canManageLeercoach =
    (aanvraag.status === "concept" ||
      aanvraag.status === "wacht_op_voorwaarden") &&
    (!aanvraag.leercoach || aanvraag.leercoach.status !== "gegeven");
  const canManageStartTime =
    aanvraag.status === "concept" ||
    aanvraag.status === "wacht_op_voorwaarden" ||
    aanvraag.status === "gereed_voor_beoordeling";
  const canManageBeoordelaar =
    aanvraag.status === "concept" ||
    aanvraag.status === "wacht_op_voorwaarden" ||
    aanvraag.status === "gereed_voor_beoordeling";
  const canGrantPermission =
    aanvraag.status === "wacht_op_voorwaarden" &&
    aanvraag.leercoach &&
    aanvraag.leercoach.status !== "gegeven";
  const canWithdraw =
    aanvraag.status === "concept" ||
    aanvraag.status === "wacht_op_voorwaarden" ||
    aanvraag.status === "gereed_voor_beoordeling";

  // Check if any actions are available
  const hasActions =
    canActivate ||
    canManageLeercoach ||
    canManageStartTime ||
    canManageBeoordelaar ||
    canGrantPermission ||
    canWithdraw;

  if (!hasActions) {
    return null;
  }

  // Determine button labels
  const leercoachButtonLabel = aanvraag.leercoach
    ? "Leercoach wijzigen"
    : "Leercoach toewijzen";
  const beoordelaarButtonLabel = aanvraag.onderdelen.some((o) => o.beoordelaar)
    ? "Beoordelaar wijzigen"
    : "Beoordelaar toewijzen";

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <MenuButton className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 p-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
        </MenuButton>

        <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {canActivate && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => setActivateOpen(true)}
                    className={`${
                      focus
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    Aanvraag indienen
                  </button>
                )}
              </MenuItem>
            )}

            {canWithdraw && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => setWithdrawOpen(true)}
                    className={`${
                      focus
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    Aanvraag intrekken
                  </button>
                )}
              </MenuItem>
            )}

            {canManageLeercoach && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => setLeercoachOpen(true)}
                    className={`${
                      focus
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    {leercoachButtonLabel}
                  </button>
                )}
              </MenuItem>
            )}

            {canManageStartTime && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => setStartTimeOpen(true)}
                    className={`${
                      focus
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    Starttijd wijzigen
                  </button>
                )}
              </MenuItem>
            )}

            {canManageBeoordelaar && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => setBeoordelaarOpen(true)}
                    className={`${
                      focus
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    {beoordelaarButtonLabel}
                  </button>
                )}
              </MenuItem>
            )}

            {canGrantPermission && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => setPermissionOpen(true)}
                    className={`${
                      focus
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    Toestemming namens leercoach
                  </button>
                )}
              </MenuItem>
            )}
          </div>
        </MenuItems>
      </Menu>

      {canActivate && (
        <ActivateDialog
          open={activateOpen}
          onClose={() => setActivateOpen(false)}
          params={params}
        />
      )}
      {canManageLeercoach && (
        <LeercoachDialog
          open={leercoachOpen}
          onClose={() => setLeercoachOpen(false)}
          params={params}
          locatieId={locatieId}
        />
      )}
      {canManageBeoordelaar && (
        <BeoordelaarDialog
          open={beoordelaarOpen}
          onClose={() => setBeoordelaarOpen(false)}
          params={params}
          locatieId={locatieId}
        />
      )}
      {canManageStartTime && (
        <StartTimeDialog
          open={startTimeOpen}
          onClose={() => setStartTimeOpen(false)}
          params={params}
        />
      )}
      {canGrantPermission && (
        <PermissionDialog
          open={permissionOpen}
          onClose={() => setPermissionOpen(false)}
          params={params}
        />
      )}
      {canWithdraw && (
        <WithdrawDialog
          open={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          params={params}
        />
      )}
    </>
  );
}
