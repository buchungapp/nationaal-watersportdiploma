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
import { exportQualificationsListAction } from "~/app/_actions/kss/exports/export-qualifications-list";
import {
  qualificationsListFieldCategories,
  qualificationsListFields,
} from "~/app/_actions/kss/exports/qualifications-list-mappers";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import { downloadBlob, exportFileName } from "~/lib/export";

interface Props {
  instructors: Array<{
    id: string;
    firstName: string;
    lastNamePrefix: string | null;
    lastName: string | null;
    handle: string;
    dateOfBirth: string | null;
    birthCity: string | null;
    birthCountry: {
      name: string;
      code: string;
    } | null;
    email: string | null;
  }>;
  courses: Array<{
    id: string;
    handle: string;
    title: string | null;
    abbreviation: string | null;
  }>;
  kwalificaties: Array<{
    personId: string;
    courseId: string;
    richting: string;
    hoogsteNiveau: number;
  }>;
  locationHandle: string;
}

function exportQualificationsListErrorMessage(
  error: InferUseActionHookReturn<
    typeof exportQualificationsListAction
  >["result"],
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

export function ExportQualificationsDialog({
  instructors,
  courses,
  kwalificaties,
  locationHandle,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
  };

  const exportData = {
    instructors,
    courses,
    kwalificaties,
    locationHandle,
  };

  const { execute } = useAction(
    exportQualificationsListAction.bind(null, exportData),
    {
      onSuccess: ({ data }) => {
        if (data) {
          downloadBlob(
            data.data,
            exportFileName(data.format, `kwalificaties-${locationHandle}`),
          );
        }

        close();
        toast.success("Kwalificaties zijn geëxporteerd.");
      },
      onError: (error) => {
        toast.error(exportQualificationsListErrorMessage(error.error));
      },
    },
  );

  // Get fields with courses
  const fields = qualificationsListFields(courses);

  return (
    <>
      <Button outline onClick={() => setIsOpen(true)}>
        <ArrowDownTrayIcon />
        Exporteer
      </Button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Exporteer kwalificaties</DialogTitle>

        <form action={execute}>
          <DialogBody>
            <Subheading>Kies export formaat en velden</Subheading>
            <ExportFieldsProvider
              categories={qualificationsListFieldCategories}
              fields={fields}
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
