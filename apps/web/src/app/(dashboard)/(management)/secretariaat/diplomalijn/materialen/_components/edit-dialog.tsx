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
import type { listGearTypes } from "~/lib/nwd";
import update from "../_actions/update";

export default function EditDialog({
  editGearType,
}: {
  editGearType: Awaited<ReturnType<typeof listGearTypes>>[number] | null;
}) {
  const [editGearTypeId, setEditGearTypeId] = useQueryState<string>(
    "bewerken",
    parseAsString.withDefault(""),
  );

  const [state, formAction] = useFormState(
    async (_prevState: unknown, formData: FormData) => {
      const title = formData.get("title") as string;
      const handle = formData.get("handle") as string;

      const result = await update(editGearTypeId, { title, handle });
      if (result.message === "Success") {
        toast.success("Materiaal is geüpdatet.");
        await setEditGearTypeId(null);
      }

      return result;
    },
    null,
  );

  if (!editGearType) {
    return null;
  }

  return (
    <Dialog open={!!editGearTypeId} onClose={() => setEditGearTypeId(null)}>
      <DialogTitle>Materiaal wijzigen</DialogTitle>
      <DialogDescription>
        Pas de gegevens van het materiaal aan.
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
                  defaultValue={editGearType.title ?? undefined}
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
                  defaultValue={editGearType.handle}
                  required
                />
                {state?.errors?.handle ? (
                  <ErrorMessage>{state.errors.handle}</ErrorMessage>
                ) : null}
              </Field>
            </FieldGroup>
          </Fieldset>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setEditGearTypeId(null)}>
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
