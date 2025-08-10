"use client";

import { AcademicCapIcon } from "@heroicons/react/16/solid";
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
import { Field, Fieldset, Label } from "~/app/(dashboard)/_components/fieldset";
import { ListSelect } from "~/app/(dashboard)/_components/list-select";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateGearTypeCurriculaAction } from "~/app/_actions/secretariat/gear-type/update-curriculum-gear-types-action";
import Spinner from "~/app/_components/spinner";
import type {
  listCurricula,
  listCurriculaByGearType,
  listPrograms,
} from "~/lib/nwd";

export function EditCurriculaDialog({
  gearTypeId,
  allCurricula,
  currentCurricula,
  allPrograms,
}: {
  gearTypeId: string;
  allCurricula: Awaited<ReturnType<typeof listCurricula>>;
  currentCurricula: Awaited<ReturnType<typeof listCurriculaByGearType>>;
  allPrograms: Awaited<ReturnType<typeof listPrograms>>;
}) {
  const [isOpen, setisOpen] = useState(false);

  const { execute, input } = useAction(
    updateGearTypeCurriculaAction.bind(null, gearTypeId),
    {
      onSuccess: () => {
        setisOpen(false);
        toast.success("Boottypen bijgewerkt");
      },
      onError: () => {
        toast.error("Er is iets misgegaan");
      },
    },
  );

  const { getInputValueAsArray } = useFormInput(input, {
    curricula: currentCurricula.map((curriculum) => curriculum.id),
  });

  const defaultCurricula = getInputValueAsArray("curricula");

  return (
    <>
      <Button outline className="-my-1.5" onClick={() => setisOpen(true)}>
        <AcademicCapIcon />
        Curricula
      </Button>

      <Dialog open={isOpen} onClose={() => setisOpen(false)}>
        <DialogTitle>Wijzig curricula voor dit materiaal</DialogTitle>
        <DialogBody>
          <form action={execute}>
            <Fieldset>
              <Field>
                <Label>Boottypen</Label>
                <ListSelect
                  options={allCurricula.sort((a, b) =>
                    b.revision.localeCompare(a.revision),
                  )}
                  by="id"
                  name="curricula"
                  placeholder="Zoek curricula..."
                  displayValue={(curriculum) => {
                    const program = allPrograms.find(
                      (program) => program.id === curriculum.programId,
                    );

                    if (!program) {
                      return curriculum.revision;
                    }

                    return `${program.title ?? `${program.course.title} ${program.degree.title}`} - ${curriculum.revision}`;
                  }}
                  defaultValue={defaultCurricula}
                />
              </Field>
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
