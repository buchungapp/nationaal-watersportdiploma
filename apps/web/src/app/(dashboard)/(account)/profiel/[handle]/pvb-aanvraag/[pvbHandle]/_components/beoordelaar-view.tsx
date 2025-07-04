"use client";

import {
  EllipsisVerticalIcon,
  PlayIcon,
  XMarkIcon,
  CheckIcon,
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
import type { retrievePvbAanvraagByHandle } from "~/lib/nwd";
import Spinner from "~/app/_components/spinner";

type AanvraagType = Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;

export function BeoordelaarView({ aanvraag }: { aanvraag: AanvraagType }) {
  const router = useRouter();
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isAbortDialogOpen, setIsAbortDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [abortReason, setAbortReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const canStartAssessment = aanvraag.status === "gereed_voor_beoordeling";
  const canAbortAssessment = aanvraag.status === "in_beoordeling";
  const canFinalizeAssessment =
    aanvraag.status === "in_beoordeling" &&
    aanvraag.onderdelen.every((o) => o.uitslag !== "nog_niet_bekend");

  const handleStartAssessment = async () => {
    setIsProcessing(true);
    try {
      // TODO: Call startPvbAssessmentAction when it's properly implemented
      toast.error("Start beoordeling is nog niet geïmplementeerd");
    } catch (error) {
      toast.error("Er is een fout opgetreden");
    } finally {
      setIsProcessing(false);
      setIsStartDialogOpen(false);
    }
  };

  const handleAbortAssessment = async () => {
    if (!abortReason.trim()) {
      toast.error("Geef een reden op voor het afbreken");
      return;
    }
    setIsProcessing(true);
    try {
      // TODO: Call abortPvbAction when it's properly implemented
      toast.error("Afbreken beoordeling is nog niet geïmplementeerd");
    } catch (error) {
      toast.error("Er is een fout opgetreden");
    } finally {
      setIsProcessing(false);
      setIsAbortDialogOpen(false);
      setAbortReason("");
    }
  };

  const handleFinalizeAssessment = async () => {
    setIsProcessing(true);
    try {
      // TODO: Call finalizePvbAssessmentAction when it's properly implemented
      toast.error("Afronden beoordeling is nog niet geïmplementeerd");
    } catch (error) {
      toast.error("Er is een fout opgetreden");
    } finally {
      setIsProcessing(false);
      setIsFinalizeDialogOpen(false);
    }
  };

  // Don't show menu if no actions are available
  if (!canStartAssessment && !canAbortAssessment && !canFinalizeAssessment) {
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
            {canStartAssessment && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => setIsStartDialogOpen(true)}
                    className={`${
                      focus
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    } block w-full px-4 py-2 text-left text-sm flex items-center gap-2`}
                  >
                    <PlayIcon className="h-4 w-4 text-green-600" />
                    Start beoordeling
                  </button>
                )}
              </MenuItem>
            )}
            {canAbortAssessment && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => setIsAbortDialogOpen(true)}
                    className={`${
                      focus
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    } block w-full px-4 py-2 text-left text-sm flex items-center gap-2`}
                  >
                    <XMarkIcon className="h-4 w-4 text-red-600" />
                    PvB afbreken
                  </button>
                )}
              </MenuItem>
            )}
            {canFinalizeAssessment && (
              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => setIsFinalizeDialogOpen(true)}
                    className={`${
                      focus
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        : "text-gray-700 dark:text-gray-300"
                    } block w-full px-4 py-2 text-left text-sm flex items-center gap-2`}
                  >
                    <CheckIcon className="h-4 w-4 text-green-600" />
                    Uitslag doorgeven
                  </button>
                )}
              </MenuItem>
            )}
          </div>
        </MenuItems>
      </Menu>

      {/* Start Assessment Dialog */}
      <Dialog open={isStartDialogOpen} onClose={() => setIsStartDialogOpen(false)}>
        <DialogTitle>Start beoordeling</DialogTitle>
        <DialogBody>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Je staat op het punt om de beoordeling te starten. Vanaf dat moment
            kun je de verschillende onderdelen beoordelen.
          </p>
        </DialogBody>
        <DialogActions>
          <Button
            type="button"
            plain
            onClick={() => setIsStartDialogOpen(false)}
            disabled={isProcessing}
          >
            Annuleren
          </Button>
          <Button
            type="button"
            color="branding-dark"
            onClick={handleStartAssessment}
            disabled={isProcessing}
          >
            {isProcessing ? <Spinner className="text-white" /> : <PlayIcon />}
            Start beoordeling
          </Button>
        </DialogActions>
      </Dialog>

      {/* Abort Assessment Dialog */}
      <Dialog open={isAbortDialogOpen} onClose={() => setIsAbortDialogOpen(false)}>
        <DialogTitle>PvB afbreken</DialogTitle>
        <DialogBody>
          <div className="space-y-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              Let op: Dit is een destructieve actie. Het afbreken van de PvB
              betekent dat alle onderdelen automatisch als "niet behaald" worden
              gemarkeerd.
            </p>
            <div>
              <label
                htmlFor="abort-reason"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Reden voor afbreken <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="abort-reason"
                name="abort-reason"
                rows={3}
                value={abortReason}
                onChange={(e) => setAbortReason(e.target.value)}
                placeholder="Geef een duidelijke reden op..."
                className="w-full"
                required
              />
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button
            type="button"
            plain
            onClick={() => {
              setIsAbortDialogOpen(false);
              setAbortReason("");
            }}
            disabled={isProcessing}
          >
            Annuleren
          </Button>
          <Button
            type="button"
            color="red"
            onClick={handleAbortAssessment}
            disabled={isProcessing || !abortReason.trim()}
          >
            {isProcessing ? <Spinner className="text-white" /> : <XMarkIcon />}
            PvB afbreken
          </Button>
        </DialogActions>
      </Dialog>

      {/* Finalize Assessment Dialog */}
      <Dialog
        open={isFinalizeDialogOpen}
        onClose={() => setIsFinalizeDialogOpen(false)}
      >
        <DialogTitle>Uitslag doorgeven</DialogTitle>
        <DialogBody>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Weet je zeker dat je de uitslag wilt doorgeven? Na het doorgeven van
            de uitslag is het niet meer mogelijk om wijzigingen door te voeren.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Als er later toch wijzigingen nodig zijn, moet er contact opgenomen
            worden met het Secretariaat.
          </p>
        </DialogBody>
        <DialogActions>
          <Button
            type="button"
            plain
            onClick={() => setIsFinalizeDialogOpen(false)}
            disabled={isProcessing}
          >
            Annuleren
          </Button>
          <Button
            type="button"
            color="branding-orange"
            onClick={handleFinalizeAssessment}
            disabled={isProcessing}
          >
            {isProcessing ? <Spinner className="text-white" /> : <CheckIcon />}
            Uitslag doorgeven
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}