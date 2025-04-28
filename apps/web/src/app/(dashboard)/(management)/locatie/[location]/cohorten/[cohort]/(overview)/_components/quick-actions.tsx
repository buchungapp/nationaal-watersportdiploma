"use client";
import { EllipsisHorizontalIcon } from "@heroicons/react/16/solid";
import { useParams, useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
} from "~/app/(dashboard)/_components/alert";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import {
  ErrorMessage,
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Strong } from "~/app/(dashboard)/_components/text";
import Spinner from "~/app/_components/spinner";
import dayjs from "~/lib/dayjs";
import { deleteCohort, updateCohort } from "../_actions/nwd";

interface Props {
  cohort: {
    id: string;
    label: string;
    accessStartTime: string;
    accessEndTime: string;
  };
}

export function CohortActions(props: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-center">
      <Dropdown>
        <DropdownButton outline className="-my-1.5">
          <EllipsisHorizontalIcon />
        </DropdownButton>
        <DropdownMenu anchor="bottom end">
          <DropdownItem onClick={() => setIsDialogOpen("edit")}>
            <DropdownLabel>Wijzig</DropdownLabel>
          </DropdownItem>
          <DropdownItem onClick={() => setIsDialogOpen("remove")}>
            <DropdownLabel>Verwijder</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>

      <EditCohortDialog
        {...props}
        isOpen={isDialogOpen === "edit"}
        setIsOpen={(value) => setIsDialogOpen(value ? "edit" : null)}
      />

      <RemoveCohortDialog
        {...props}
        isOpen={isDialogOpen === "remove"}
        setIsOpen={(value) => setIsDialogOpen(value ? "remove" : null)}
      />
    </div>
  );
}

function EditCohortDialog({
  isOpen,
  cohort,
  setIsOpen,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await updateCohort({
      cohortId: cohort.id,
      accessStartTimestamp: dayjs(
        formData.get("accessStartTime") as string,
      ).toISOString(),
      accessEndTimestamp: dayjs(
        formData.get("accessEndTime") as string,
      ).toISOString(),
      label: formData.get("label") as string,
    })
      .then(() => {
        toast.success("Cohort bijgewerkt");
        setIsOpen(false);
      })
      .catch((error) => {
        if (error instanceof Error) {
          return error.message;
        }
        return "Er is een fout opgetreden.";
      });

    return result ? { error: result } : undefined;
  };

  const [state, formAction] = useActionState(submit, undefined);

  return (
    <Dialog open={isOpen} onClose={setIsOpen} size="2xl">
      <DialogTitle>Cohort bewerken</DialogTitle>
      <DialogDescription>Pas de gegevens van dit cohort aan.</DialogDescription>
      <form action={formAction}>
        <DialogBody>
          <Fieldset>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-4">
                <Field className="col-span-2">
                  <Label>Naam</Label>
                  <Input
                    name="label"
                    required
                    minLength={1}
                    defaultValue={cohort.label}
                  />
                </Field>
                <Field>
                  <Label>Opent op</Label>
                  <Input
                    name="accessStartTime"
                    type="datetime-local"
                    defaultValue={
                      dayjs(cohort.accessStartTime).toISOString().split(".")[0]
                    }
                    required
                  />
                </Field>
                <Field>
                  <Label>Sluit op</Label>
                  <Input
                    name="accessEndTime"
                    type="datetime-local"
                    defaultValue={
                      dayjs(cohort.accessEndTime).toISOString().split(".")[0]
                    }
                    required
                  />
                </Field>
              </div>
            </FieldGroup>

            {!!state?.error && <ErrorMessage>{state.error}</ErrorMessage>}
          </Fieldset>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setIsOpen(false)}>
            Sluiten
          </Button>
          <SubmitButton />
        </DialogActions>
      </form>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}

function RemoveCohortDialog({
  isOpen,
  cohort,
  setIsOpen,
}: Props & {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  return (
    <Alert open={isOpen} onClose={setIsOpen} size="md">
      <AlertTitle>Cohort verwijderen</AlertTitle>
      <AlertDescription>
        Weet je zeker dat je dit cohort wilt verwijderen? Dit verwijdert alle
        voortgang, en kan niet ongedaan worden gemaakt.{" "}
        <Strong>Reeds uitgegeven diploma's blijven bestaan.</Strong>
      </AlertDescription>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      <AlertActions>
        <Button plain onClick={() => setIsOpen(false)}>
          Annuleren
        </Button>
        <Button
          color="red"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await deleteCohort({ cohortId: cohort.id })
                .then(() => {
                  setIsOpen(false);
                  router.push(`/locatie/${params.location as string}/cohorten`);
                })
                .catch((error) => {
                  if (error instanceof Error) {
                    return setError(error.message);
                  }
                  setError("Er is een fout opgetreden.");
                });
            });
          }}
        >
          {pending ? <Spinner className="text-white" /> : null} Verwijderen
        </Button>
      </AlertActions>
    </Alert>
  );
}
