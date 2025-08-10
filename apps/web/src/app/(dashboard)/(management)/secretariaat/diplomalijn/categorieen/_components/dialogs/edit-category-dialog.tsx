"use client";

import { PencilIcon } from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
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
import {
  Field,
  FieldGroup,
  Fieldset,
  Label,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Listbox, ListboxOption } from "~/app/(dashboard)/_components/listbox";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateCategoryAction } from "~/app/_actions/secretariat/category/update-category-action";
import Spinner from "~/app/_components/spinner";
import type { listParentCategories } from "~/lib/nwd";

type ParentCategory = Awaited<ReturnType<typeof listParentCategories>>[number];

export function EditCategoryDialog({
  category,
  parentCategories,
}: {
  category: {
    id: string;
    title: string | null;
    description: string | null;
    parent: ParentCategory | null;
    weight: number | null;
  };
  parentCategories: ParentCategory[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { execute, input } = useAction(
    updateCategoryAction.bind(null, category.id),
    {
      onSuccess: () => {
        setIsOpen(false);
        toast.success("Categorie bijgewerkt");
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    title: category.title,
    description: category.description,
    parentCategoryId: category.parent?.id,
    weight: category.weight,
  });
  return (
    <>
      <Button outline className="-my-1.5" onClick={() => setIsOpen(true)}>
        <PencilIcon />
        Bewerken
      </Button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>
          Wijzig categorie{category.title ? ` '${category.title}'` : ""}
        </DialogTitle>
        <DialogBody>
          <form action={execute}>
            <Fieldset>
              <FieldGroup>
                <Field>
                  <Label>Naam</Label>
                  <Input
                    name="title"
                    defaultValue={getInputValue("title")}
                    required
                  />
                </Field>
                <Field>
                  <Label>Omschrijving</Label>
                  <Textarea
                    name="description"
                    defaultValue={getInputValue("description")}
                    rows={3}
                  />
                </Field>
                <Field>
                  <Label>Hoofdcategorie</Label>
                  <Listbox
                    name="parentCategoryId"
                    defaultValue={getInputValue("parentCategoryId") ?? null}
                  >
                    <ListboxOption value={null}>Geen</ListboxOption>
                    {parentCategories.map((parentCategory) => (
                      <ListboxOption
                        key={parentCategory.id}
                        value={parentCategory.id}
                      >
                        {parentCategory.title ?? parentCategory.handle}
                      </ListboxOption>
                    ))}
                  </Listbox>
                </Field>
                <Field>
                  <Label>Sortering</Label>
                  <Input
                    name="weight"
                    type="number"
                    min={0}
                    defaultValue={getInputValue("weight")}
                    required
                  />
                </Field>
              </FieldGroup>
            </Fieldset>
            <DialogActions>
              <SubmitButton />
            </DialogActions>
          </form>
        </DialogBody>
      </Dialog>
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" color="blue" disabled={pending}>
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}
