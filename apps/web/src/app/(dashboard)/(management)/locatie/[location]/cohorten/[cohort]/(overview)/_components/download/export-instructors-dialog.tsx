"use client";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import {
  type InferUseActionHookReturn,
  useAction,
} from "next-safe-action/hooks";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { exportInstructorProgrammesAction } from "~/app/_actions/cohort/exports/export-instructor-programmes";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { FormatSelector } from "~/app/(dashboard)/_components/exports/format-selector";
import { ExportFormatProvider } from "~/app/(dashboard)/_components/exports/use-export-format";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { downloadBlob, exportFileName } from "~/lib/export";

interface Props {
  cohortId: string;
  cohortLabel: string;
}

function exportInstructorProgrammesErrorMessage(
  error: InferUseActionHookReturn<
    typeof exportInstructorProgrammesAction
  >["result"],
) {
  if (error.serverError) {
    return error.serverError;
  }

  if (error.validationErrors) {
    return "Een van de velden is niet correct ingevuld.";
  }

  return null;
}

export function ExportInstructorsDialog({ cohortId, cohortLabel }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
  };

  const { execute } = useAction(
    exportInstructorProgrammesAction.bind(null, cohortId),
    {
      onSuccess: ({ data }) => {
        if (data) {
          downloadBlob(
            data.data,
            exportFileName(
              data.format,
              `cohort-${cohortLabel}-instructeurs`,
            ),
          );
        }

        close();
        toast.success("Instructeurs zijn geëxporteerd.");
      },
      onError: (error) => {
        toast.error(exportInstructorProgrammesErrorMessage(error.error));
      },
    },
  );

  return (
    <>
      <Button outline onClick={() => setIsOpen(true)} title="Exporteer instructeurs">
        <ArrowDownTrayIcon />
      </Button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Exporteer instructeurs</DialogTitle>

        <form action={execute}>
          <DialogBody>
            <Subheading>Kies export formaat</Subheading>
            <ExportFormatProvider>
              <FormatSelector />
            </ExportFormatProvider>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={close}>
              Sluiten
            </Button>
            <SubmitButton />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Exporteer
    </Button>
  );
}
