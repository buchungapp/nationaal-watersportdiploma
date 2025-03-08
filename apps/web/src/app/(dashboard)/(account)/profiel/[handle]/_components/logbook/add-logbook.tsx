"use client";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import { CheckboxField } from "~/app/(dashboard)/_components/checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Listbox, ListboxOption } from "~/app/(dashboard)/_components/listbox";
import {
  SmartDatePicker,
  SmartDatetimePicker,
} from "~/app/(dashboard)/_components/natural-language-input";
import { Text } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import Spinner from "~/app/_components/spinner";
import { createLogbookAction } from "../../_actions/logbook";

export function AddLogbook({
  personId,
  className,
}: {
  personId: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [useDateTime, setUseDateTime] = useState(false);

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      setShowEndDate(false);
      setUseDateTime(false);
    }, 100);
  };

  const submit = async (prevState: unknown, formData: FormData) => {
    const result = await createLogbookAction({ personId }, prevState, formData);

    if (result.message === "Success") {
      close();
      toast.success("Logboekregel toegevoegd.");
    }

    return result;
  };

  const [state, action] = useActionState(submit, undefined);

  console.log(state);

  return (
    <>
      <Button outline onClick={() => setIsOpen(true)} className={className}>
        <PlusIcon className="size-8" />
        <span className="hidden sm:inline">Voeg regel toe</span>
      </Button>

      <Dialog open={isOpen} onClose={close}>
        <DialogTitle>Voeg een nieuw regel toe</DialogTitle>
        <Text>Vul de details in van je vaaractiviteit.</Text>
        <form action={action}>
          <DialogBody>
            <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-4">
              <Field className="relative col-span-2">
                <Label>Startdatum</Label>
                {useDateTime ? (
                  <SmartDatetimePicker
                    name="startedAt"
                    required
                    invalid={!!state?.errors?.startedAt}
                  />
                ) : (
                  <SmartDatePicker
                    name="startedAt"
                    required
                    invalid={!!state?.errors?.startedAt}
                  />
                )}
              </Field>
              {showEndDate ? (
                <Field className="relative col-span-2">
                  <Label>Einddatum</Label>
                  {useDateTime ? (
                    <SmartDatetimePicker
                      name="endedAt"
                      invalid={!!state?.errors?.endedAt}
                    />
                  ) : (
                    <SmartDatePicker
                      name="endedAt"
                      invalid={!!state?.errors?.endedAt}
                    />
                  )}
                </Field>
              ) : null}
              <div className="col-span-4">
                <CheckboxField>
                  <Checkbox
                    name="isMultipleDays"
                    onChange={(checked) => setShowEndDate(checked)}
                  />
                  <Label>Meerdere dagen</Label>
                </CheckboxField>
                <CheckboxField>
                  <Checkbox
                    name="hasTime"
                    onChange={(checked) => setUseDateTime(checked)}
                  />
                  <Label>Inclusief tijd</Label>
                </CheckboxField>
              </div>

              <Field className="col-span-2">
                <Label>Vertrekhaven</Label>
                <Input
                  name="departurePort"
                  placeholder="bv. Den Helder (NL)"
                  invalid={!!state?.errors?.departurePort}
                />
              </Field>

              <Field className="col-span-2">
                <Label>Aankomsthaven</Label>
                <Input
                  name="arrivalPort"
                  invalid={!!state?.errors?.arrivalPort}
                />
              </Field>

              <Field className="col-span-3">
                <Label>Organisatie</Label>
                <Input
                  name="location"
                  placeholder="bv. zeilschool, verhuurder"
                  invalid={!!state?.errors?.location}
                />
              </Field>

              <Field className="col-span-2">
                <Label>Windrichting</Label>
                <Input
                  name="windDirection"
                  placeholder="bv. NW"
                  invalid={!!state?.errors?.windDirection}
                />
              </Field>

              <Field className="col-span-2">
                <Label>Windkracht (knopen)</Label>
                <Input
                  type="number"
                  name="windPower"
                  placeholder="bv. 4"
                  invalid={!!state?.errors?.windPower}
                />
              </Field>

              <Field className="col-span-2">
                <Label>Type boot</Label>
                <Input
                  name="boatType"
                  placeholder="bv. Dehler 36"
                  invalid={!!state?.errors?.boatType}
                />
              </Field>

              <Field className="col-span-2">
                <Label>Bootlengte (meters)</Label>
                <Input
                  type="number"
                  name="boatLength"
                  invalid={!!state?.errors?.boatLength}
                />
              </Field>

              <Field className="col-span-2">
                <Label>Gevaren nautische mijlen</Label>
                <Input
                  type="number"
                  name="sailedNauticalMiles"
                  invalid={!!state?.errors?.sailedNauticalMiles}
                />
              </Field>

              <Field className="col-span-2">
                <Label>Uren in donker</Label>
                <Input
                  type="number"
                  name="sailedHoursInDark"
                  invalid={!!state?.errors?.sailedHoursInDark}
                />
              </Field>

              <Field className="col-span-3">
                <Label>Primaire rol</Label>
                <Listbox
                  name="primaryRole"
                  defaultValue="schipper"
                  className="w-full"
                >
                  <ListboxOption value="schipper">Schipper</ListboxOption>
                  <ListboxOption value="navigator">Navigator</ListboxOption>
                  <ListboxOption value="stuurman">Stuurman</ListboxOption>
                  <ListboxOption value="dekknecht">
                    Dekknecht/Maat
                  </ListboxOption>
                  <ListboxOption value="overig">Overig</ListboxOption>
                </Listbox>
              </Field>

              <Field className="col-span-4">
                <Label>Bemanningsnamen</Label>
                <Textarea
                  name="crewNames"
                  placeholder="bv. Jan Jansen, Piet Pietersen"
                  invalid={!!state?.errors?.crewNames}
                />
              </Field>

              <Field className="col-span-4">
                <Label>Omstandigheden</Label>
                <Textarea
                  name="conditions"
                  placeholder="bv. rustig weer, lichte golfslag"
                  invalid={!!state?.errors?.conditions}
                />
              </Field>

              <Field className="col-span-4">
                <Label>Bijzonderheden / Opmerkingen</Label>
                <Textarea
                  name="additionalComments"
                  placeholder="bv. wedstrijd, storingen, vastgelopen, examen"
                  invalid={!!state?.errors?.additionalComments}
                />
              </Field>
            </div>
          </DialogBody>
          <DialogActions>
            <Button plain onClick={close}>
              Sluiten
            </Button>
            <SubmitButton invalid={false} />
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

function SubmitButton({ invalid }: { invalid?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending || invalid} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}
