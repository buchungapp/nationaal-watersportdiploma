"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { BeoordelaarDialog } from "./beoordelaar-dialog";
import { LeercoachDialog } from "./leercoach-dialog";
import { PermissionDialog } from "./permission-dialog";
import { StartTimeDialog } from "./start-time-dialog";

export function AanvraagActions({
  params,
}: { params: Promise<{ location: string; handle: string }> }) {
  const [leercoachOpen, setLeercoachOpen] = useState(false);
  const [beoordelaarOpen, setBeoordelaarOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <MenuButton className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 p-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
        </MenuButton>

        <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
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
                  Leercoach toewijzen
                </button>
              )}
            </MenuItem>
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
                  Beoordelaar toewijzen
                </button>
              )}
            </MenuItem>
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
          </div>
        </MenuItems>
      </Menu>

      <LeercoachDialog
        open={leercoachOpen}
        onClose={() => setLeercoachOpen(false)}
        params={params}
      />
      <BeoordelaarDialog
        open={beoordelaarOpen}
        onClose={() => setBeoordelaarOpen(false)}
        params={params}
      />
      <StartTimeDialog
        open={startTimeOpen}
        onClose={() => setStartTimeOpen(false)}
        params={params}
      />
      <PermissionDialog
        open={permissionOpen}
        onClose={() => setPermissionOpen(false)}
        params={params}
      />
    </>
  );
}
