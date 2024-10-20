"use client";
import { parseAsString, useQueryState } from "nuqs";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import {
  ErrorMessage,
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import Spinner from "~/app/_components/spinner";
import type { listDisciplines } from "~/lib/nwd";
import update from "../_actions/update";

export default function EditDialog({
  editDiscipline,
}: {
  editDiscipline: Awaited<ReturnType<typeof listDisciplines>>[number] | null;
}) {
  const [editDisciplineId, setEditDisciplineId] = useQueryState<string>(
    "bewerken",
    parseAsString.withDefault(""),
  );

  const [state, formAction] = useFormState(
    async (_prevState: unknown, formData: FormData) => {
      const title = formData.get("title") as string;
      const handle = formData.get("handle") as string;
      const weight = Number(formData.get("weight"));

      const result = await update(editDisciplineId, {
        title,
        handle,
        weight,
      });
      if (result.message === "Success") {
        toast.success("Discipline is geüpdatet.");
        await setEditDisciplineId(null);
      }

      return result;
    },
    null,
  );

  if (!editDiscipline) {
    return null;
  }

  return (
    <Dialog open={!!editDisciplineId} onClose={() => setEditDisciplineId(null)}>
      <DialogTitle>Discipline wijzigen</DialogTitle>
      <DialogDescription>
        Pas de gegevens van de discipline aan.
      </DialogDescription>
      <form action={formAction}>
        <DialogBody>
          <Fieldset>
            <FieldGroup>
              <Field>
                <Label>Naam</Label>
                <Input
                  name="title"
                  invalid={!!state?.errors?.title}
                  defaultValue={editDiscipline.title ?? undefined}
                  required
                />
                {state?.errors?.title ? (
                  <ErrorMessage>{state.errors.title}</ErrorMessage>
                ) : null}
              </Field>
              <Field>
                <Label>Handle</Label>
                <Input
                  name="handle"
                  invalid={!!state?.errors?.handle}
                  defaultValue={editDiscipline.handle}
                  required
                />
                {state?.errors?.handle ? (
                  <ErrorMessage>{state.errors.handle}</ErrorMessage>
                ) : null}
              </Field>
              <Field>
                <Label>Sortering</Label>
                <Input
                  type="number"
                  invalid={!!state?.errors?.weight}
                  name="weight"
                  defaultValue={editDiscipline.weight}
                  required
                />
                {state?.errors?.weight ? (
                  <ErrorMessage>{state.errors.weight}</ErrorMessage>
                ) : null}
              </Field>
            </FieldGroup>
          </Fieldset>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setEditDisciplineId(null)}>
            Annuleren
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
