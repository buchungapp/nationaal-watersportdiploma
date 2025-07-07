"use client";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import {
  type InferUseActionHookReturn,
  useAction,
} from "next-safe-action/hooks";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { FieldManagement } from "~/app/(dashboard)/_components/exports/field-management";
import { FormatSelector } from "~/app/(dashboard)/_components/exports/format-selector";
import { ExportFieldsProvider } from "~/app/(dashboard)/_components/exports/use-export-fields";
import { ExportFormatProvider } from "~/app/(dashboard)/_components/exports/use-export-format";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { exportStudentListAction } from "~/app/_actions/cohort/exports/export-student-list";
import {
  studentListFieldCategories,
  studentListFields,
} from "~/app/_actions/cohort/exports/student-list-mappers";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import { downloadBlob, exportFileName } from "~/lib/export";

interface Props {
  cohortId: string;
  cohortLabel: string;
}

function exportStudentListErrorMessage(
  error: InferUseActionHookReturn<typeof exportStudentListAction>["result"],
) {
  if (error.serverError) {
    return error.serverError;
  }

  if (error.validationErrors) {
    console.log(error.validationErrors);

    return "Een van de velden is niet correct ingevuld.";
  }

  if (error.bindArgsValidationErrors) {
    return DEFAULT_SERVER_ERROR_MESSAGE;
  }

  return null;
}

export function ExportStudentsListDialog({ cohortId, cohortLabel }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
  };

  const { execute } = useAction(exportStudentListAction.bind(null, cohortId), {
    onSuccess: ({ data }) => {
      if (data) {
        downloadBlob(
          data.data,
          exportFileName(data.format, `cohort-${cohortLabel}`),
        );
      }

      close();
      toast.success("Cursisten zijn geëxporteerd.");
    },
    onError: (error) => {
      toast.error(exportStudentListErrorMessage(error.error));
    },
  });

  return (
    <>
      <Button outline onClick={() => setIsOpen(true)}>
        <ArrowDownTrayIcon />
      </Button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Exporteer cursisten</DialogTitle>

        <form action={execute}>
          <DialogBody>
            <Subheading>Kies export formaat en velden</Subheading>
            <ExportFieldsProvider
              categories={studentListFieldCategories}
              fields={studentListFields}
            >
              <div className="space-y-4">
                <ExportFormatProvider>
                  <FormatSelector />
                  <FieldManagement />
                </ExportFormatProvider>
              </div>
            </ExportFieldsProvider>
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
