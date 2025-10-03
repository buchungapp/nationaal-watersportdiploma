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
import { ListSelect } from "~/app/(dashboard)/_components/list-select";
import { Listbox, ListboxOption } from "~/app/(dashboard)/_components/listbox";
import { Text } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateCourseAction } from "~/app/_actions/secretariat/course/update-course-action";
import Spinner from "~/app/_components/spinner";
import type {
  listCategories,
  listDisciplines,
  listParentCategories,
  retrieveCourseByHandle,
} from "~/lib/nwd";

type Discipline = Awaited<ReturnType<typeof listDisciplines>>[number];
type ParentCategory = Awaited<ReturnType<typeof listParentCategories>>[number];
type Category = Awaited<ReturnType<typeof listCategories>>[number];
type Course = NonNullable<Awaited<ReturnType<typeof retrieveCourseByHandle>>>;

export function EditCourseDialog({
  course,
  disciplines,
  parentCategories,
  allCategories,
}: {
  course: Course;
  disciplines: Discipline[];
  parentCategories: ParentCategory[];
  allCategories: Category[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
    reset();
  };

  const { execute, input, reset } = useAction(
    updateCourseAction.bind(null, course.id),
    {
      onSuccess: () => {
        close();
        toast.success("Cursus bijgewerkt");
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );

  const { getInputValue, getInputValueAsArray } = useFormInput(input, {
    abbreviation: course?.abbreviation,
    categories: course?.categories.map((category) => category.id),
    disciplineId: course?.discipline.id,
    description: course?.description,
    title: course?.title,
  });

  return (
    <>
      <Button color="blue" onClick={() => setIsOpen(true)}>
        <PencilIcon />
        Bewerken
      </Button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Cursus bewerken</DialogTitle>
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
                  <Label>Discipline</Label>
                  <Listbox
                    name="disciplineId"
                    defaultValue={getInputValue("disciplineId")}
                  >
                    {disciplines.map((discipline) => (
                      <ListboxOption key={discipline.id} value={discipline.id}>
                        {discipline.title ?? discipline.handle}
                      </ListboxOption>
                    ))}
                  </Listbox>
                </Field>
                <Field>
                  <Label>Afkorting</Label>
                  <Input
                    name="abbreviation"
                    defaultValue={getInputValue("abbreviation")}
                  />
                </Field>
                <Field>
                  <Label>Categorieën</Label>
                  {parentCategories.map((parentCategory) => {
                    const subcategories = allCategories.filter(
                      (category) => category.parent?.id === parentCategory.id,
                    );

                    return (
                      <div key={parentCategory.id} className="mb-4">
                        <Text className="mb-2 font-medium text-sm">
                          {parentCategory.title}
                        </Text>
                        <ListSelect
                          options={subcategories}
                          by="id"
                          displayValue={(category) =>
                            category.title ?? category.handle
                          }
                          defaultValue={getInputValueAsArray(
                            "categories",
                          )?.filter(
                            (category) =>
                              allCategories.find((c) => c.id === category)
                                ?.parent?.id === parentCategory.id,
                          )}
                          placeholder={`Selecteer ${parentCategory.title?.toLowerCase()}`}
                          name="categories"
                        />
                      </div>
                    );
                  })}
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
      Bijwerken
    </Button>
  );
}
