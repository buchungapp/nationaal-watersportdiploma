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
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";
import Spinner from "~/app/_components/spinner";
import type { listCompetencies } from "~/lib/nwd";
import update from "../_actions/update";

export default function EditDialog({
  editCompetency,
}: {
  editCompetency: Awaited<ReturnType<typeof listCompetencies>>[number] | null;
}) {
  const [editCompetencyId, setEditCompetencyId] = useQueryState<string>(
    "bewerken",
    parseAsString.withDefault(""),
  );

  const [state, formAction] = useFormState(
    async (_prevState: unknown, formData: FormData) => {
      const title = formData.get("title") as string;
      const handle = formData.get("handle") as string;
      const weight = Number(formData.get("weight"));
      const type = formData.get("type") as "knowledge" | "skill";

      const result = await update(editCompetencyId, {
        title,
        handle,
        weight,
        type,
      });
      if (result.message === "Success") {
        toast.success("Competentie is geüpdatet.");
        await setEditCompetencyId(null);
      }

      return result;
    },
    null,
  );

  if (!editCompetency) {
    return null;
  }

  return (
    <Dialog open={!!editCompetencyId} onClose={() => setEditCompetencyId(null)}>
      <DialogTitle>Competentie wijzigen</DialogTitle>
      <DialogDescription>
        Pas de gegevens van de competentie aan.
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
                  defaultValue={editCompetency.title ?? undefined}
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
                  defaultValue={editCompetency.handle}
                  required
                />
                {state?.errors?.handle ? (
                  <ErrorMessage>{state.errors.handle}</ErrorMessage>
                ) : null}
              </Field>
              <div className="columns-2">
                <Field>
                  <Label>Sortering</Label>
                  <Input
                    type="number"
                    invalid={!!state?.errors?.weight}
                    name="weight"
                    defaultValue={editCompetency.weight}
                    required
                  />
                  {state?.errors?.weight ? (
                    <ErrorMessage>{state.errors.weight}</ErrorMessage>
                  ) : null}
                </Field>
                <Field>
                  <Label>Type</Label>
                  <Listbox
                    name="type"
                    defaultValue={editCompetency.type}
                    invalid={!!state?.errors.type}
                  >
                    <ListboxOption value={"knowledge"}>
                      <ListboxLabel>Kennis</ListboxLabel>
                    </ListboxOption>
                    <ListboxOption value={"skill"}>
                      <ListboxLabel>Vaardigheid</ListboxLabel>
                    </ListboxOption>
                  </Listbox>
                  {state?.errors?.type ? (
                    <ErrorMessage>{state.errors.type}</ErrorMessage>
                  ) : null}
                </Field>
              </div>
            </FieldGroup>
          </Fieldset>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setEditCompetencyId(null)}>
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
