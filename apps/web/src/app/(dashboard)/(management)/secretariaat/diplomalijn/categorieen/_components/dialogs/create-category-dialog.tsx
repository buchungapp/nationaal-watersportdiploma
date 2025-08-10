"use client";

import { PlusIcon } from "@heroicons/react/16/solid";
import slugify from "@sindresorhus/slugify";
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
import { Text } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { createCategoryAction } from "~/app/_actions/secretariat/category/create-category-action";
import Spinner from "~/app/_components/spinner";
import type { listParentCategories } from "~/lib/nwd";

type ParentCategory = Awaited<ReturnType<typeof listParentCategories>>[number];

export function CreateCategoryDialog({
  parentCategories,
}: {
  parentCategories: ParentCategory[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
    reset();
  };

  const { execute, input, reset } = useAction(createCategoryAction, {
    onSuccess: () => {
      close();
      toast.success("Categorie aangemaakt");
    },
    onError: () => {
      toast.error("Er is iets misgegaan");
    },
  });

  const { getInputValue } = useFormInput(input);
  const [slug, setSlug] = useState("");

  return (
    <>
      <Button color="branding-orange" onClick={() => setIsOpen(true)}>
        <PlusIcon />
        Nieuwe categorie
      </Button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Nieuwe categorie</DialogTitle>
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
                    onChange={(e) => {
                      setSlug(slugify(e.target.value));
                    }}
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
                    defaultValue={getInputValue("parentCategoryId")}
                  >
                    <ListboxOption value="">Geen hoofdcategorie</ListboxOption>
                    {parentCategories.map((category) => (
                      <ListboxOption key={category.id} value={category.id}>
                        {category.title ?? category.handle}
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
                <Field>
                  <Label>Slug</Label>
                  <Text className="text-sm">
                    {slug.length > 0
                      ? slug
                      : "Slug wordt automatisch aangemaakt"}
                  </Text>
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
      Aanmaken
    </Button>
  );
}
