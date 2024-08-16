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
import type { listCategories, listParentCategories } from "~/lib/nwd";
import update from "../_actions/update";

export default function EditDialog({
  editCategory,
  parentCategories,
}: {
  editCategory: Awaited<ReturnType<typeof listCategories>>[number] | null;
  parentCategories: Awaited<ReturnType<typeof listParentCategories>>;
}) {
  const [editCategoryId, setEditCategoryId] = useQueryState<string>(
    "bewerken",
    parseAsString.withDefault(""),
  );

  const [state, formAction] = useFormState(
    async (_prevState: unknown, formData: FormData) => {
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const handle = formData.get("handle") as string;
      const weight = Number(formData.get("weight"));
      const parentCategoryId = formData.get("parentCategoryId") as string;

      const result = await update(editCategoryId, {
        title,
        handle,
        weight,
        description,
        parentCategoryId,
      });
      if (result.message === "Success") {
        toast.success("Categorie is geüpdatet.");
        await setEditCategoryId(null);
      }

      return result;
    },
    null,
  );

  if (!editCategory) {
    return null;
  }

  return (
    <Dialog open={!!editCategoryId} onClose={() => setEditCategoryId(null)}>
      <DialogTitle>Categorie wijzigen</DialogTitle>
      <DialogDescription>
        Pas de gegevens van de categorie aan.
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
                  defaultValue={editCategory.title ?? undefined}
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
                  defaultValue={editCategory.handle}
                  required
                />
                {state?.errors?.handle ? (
                  <ErrorMessage>{state.errors.handle}</ErrorMessage>
                ) : null}
              </Field>
              <Field>
                <Label>Beschrijving</Label>
                <Input
                  name="description"
                  invalid={!!state?.errors?.description}
                  defaultValue={editCategory.description ?? undefined}
                />
                {state?.errors?.description ? (
                  <ErrorMessage>{state.errors.description}</ErrorMessage>
                ) : null}
              </Field>
              <FieldGroup className="sm:columns-2">
                <Field>
                  <Label>Hoofdcategorie</Label>
                  <Listbox
                    name="parentCategoryId"
                    invalid={!!state?.errors?.parentCategoryId}
                    defaultValue={editCategory.parent?.id}
                  >
                    {parentCategories.map((category) => (
                      <ListboxOption value={category.id}>
                        <ListboxLabel>
                          {category.title ?? category.handle}
                        </ListboxLabel>
                      </ListboxOption>
                    ))}
                  </Listbox>
                  {state?.errors?.parentCategoryId ? (
                    <ErrorMessage>{state.errors.parentCategoryId}</ErrorMessage>
                  ) : null}
                </Field>
                <Field>
                  <Label>Sortering</Label>
                  <Input
                    type="number"
                    invalid={!!state?.errors?.weight}
                    name="weight"
                    defaultValue={editCategory.weight}
                    required
                  />
                  {state?.errors?.weight ? (
                    <ErrorMessage>{state.errors.weight}</ErrorMessage>
                  ) : null}
                </Field>
              </FieldGroup>
            </FieldGroup>
          </Fieldset>
        </DialogBody>
        <DialogActions>
          <Button plain onClick={() => setEditCategoryId(null)}>
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
