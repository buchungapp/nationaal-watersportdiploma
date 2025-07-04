"use client";

import {
  CheckIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { grantLeercoachPermissionAction } from "~/app/_actions/pvb/leercoach-permission-action";
import type { retrievePvbAanvraagByHandle } from "~/lib/nwd";
import Spinner from "~/app/_components/spinner";

type AanvraagType = Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;

export function LeercoachView({ aanvraag }: { aanvraag: AanvraagType }) {
  const router = useRouter();
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);
  const [reason, setReason] = useState("");

  const { execute: grantPermission, isPending: isGranting } = useAction(
    grantLeercoachPermissionAction,
    {
      onSuccess: () => {
        setIsGrantDialogOpen(false);
        setReason("");
        toast.success("Toestemming succesvol verleend");
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.serverError || "Er is een fout opgetreden");
      },
    }
  );

  // Only show actions if status is "wacht_op_voorwaarden" and permission hasn't been given yet
  if (
    aanvraag.status !== "wacht_op_voorwaarden" ||
    aanvraag.leercoach?.status === "gegeven"
  ) {
    return null;
  }

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
                  onClick={() => setIsGrantDialogOpen(true)}
                  className={`${
                    focus
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300"
                  } block w-full px-4 py-2 text-left text-sm flex items-center gap-2`}
                >
                  <CheckIcon className="h-4 w-4 text-green-600" />
                  Toestemming geven
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={() => setIsDenyDialogOpen(true)}
                  className={`${
                    focus
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300"
                  } block w-full px-4 py-2 text-left text-sm flex items-center gap-2`}
                >
                  <XMarkIcon className="h-4 w-4 text-red-600" />
                  Toestemming weigeren
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Menu>

      {/* Grant Permission Dialog */}
      <Dialog open={isGrantDialogOpen} onClose={() => setIsGrantDialogOpen(false)}>
        <DialogTitle>Toestemming geven voor PvB</DialogTitle>
        <DialogBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Je staat op het punt om toestemming te geven voor deze PvB aanvraag.
              Dit betekent dat je bevestigt dat de kandidaat klaar is voor de
              beoordeling.
            </p>
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Opmerkingen (optioneel)
              </label>
              <Textarea
                id="reason"
                name="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Eventuele opmerkingen..."
                className="w-full"
              />
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button
            type="button"
            plain
            onClick={() => {
              setIsGrantDialogOpen(false);
              setReason("");
            }}
            disabled={isGranting}
          >
            Annuleren
          </Button>
          <Button
            type="button"
            color="branding-orange"
            onClick={() =>
              grantPermission({
                aanvraagHandle: aanvraag.handle,
                reason: reason || undefined,
              })
            }
            disabled={isGranting}
          >
            {isGranting ? <Spinner className="text-white" /> : <CheckIcon />}
            Toestemming geven
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deny Permission Dialog - Currently not implemented */}
      <Dialog open={isDenyDialogOpen} onClose={() => setIsDenyDialogOpen(false)}>
        <DialogTitle>Toestemming weigeren voor PvB</DialogTitle>
        <DialogBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Deze functie is momenteel niet beschikbaar. Neem contact op met het
              secretariaat als je de toestemming wilt weigeren.
            </p>
          </div>
        </DialogBody>
        <DialogActions>
          <Button
            type="button"
            plain
            onClick={() => {
              setIsDenyDialogOpen(false);
              setReason("");
            }}
          >
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}