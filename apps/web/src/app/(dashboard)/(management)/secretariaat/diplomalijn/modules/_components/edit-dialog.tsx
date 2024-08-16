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
import type { listModules } from "~/lib/nwd";
import update from "../_actions/update";

export default function EditDialog({
  editModule,
}: {
  editModule: Awaited<ReturnType<typeof listModules>>[number] | null;
}) {
  const [editModuleId, setEditModuleId] = useQueryState<string>(
    "bewerken",
    parseAsString.withDefault(""),
  );

  const [state, formAction] = useFormState(
    async (_prevState: unknown, formData: FormData) => {
      const title = formData.get("title") as string;
      const handle = formData.get("handle") as string;
      const weight = Number(formData.get("weight"));

      const result = await update(editModuleId, {
        title,
        handle,
        weight,
      });
      if (result.message === "Success") {
        toast.success("Module is geüpdatet.");
        await setEditModuleId(null);
      }

      return result;
    },
    null,
  );

  if (!editModule) {
    return null;
  }

  return (
    <Dialog open={!!editModuleId} onClose={() => setEditModuleId(null)}>
      <DialogTitle>Module wijzigen</DialogTitle>
      <DialogDescription>Pas de gegevens van de module aan.</DialogDescription>
      <form action={formAction}>
        <DialogBody>
          <Fieldset>
            <FieldGroup>
              <Field>
                <Label>Naam</Label>
                <Input
                  name="title"
                  invalid={!!state?.errors?.title}
                  defaultValue={editModule.title ?? undefined}
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
                  defaultValue={editModule.handle}
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
                  defaultValue={editModule.weight}
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
          <Button plain onClick={() => setEditModuleId(null)}>
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
