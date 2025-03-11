"use client";
import { useState } from "react";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import { CheckboxField } from "~/app/(dashboard)/_components/checkbox";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Listbox, ListboxOption } from "~/app/(dashboard)/_components/listbox";
import {
  SmartDatePicker,
  SmartDatetimePicker,
} from "~/app/(dashboard)/_components/natural-language-input";
import { Textarea } from "~/app/(dashboard)/_components/textarea";

export function LogbookFields({
  errors,
  defaultValues,
}: {
  errors?: Record<string, string>;
  defaultValues?: Record<string, string | number | null | undefined>;
}) {
  const hasEndDate =
    defaultValues?.endedAt !== null && defaultValues?.endedAt !== undefined;
  const hasTime =
    typeof defaultValues?.startedAt === "string" &&
    !defaultValues?.startedAt?.includes("T00:00:00");

  const [showEndDate, setShowEndDate] = useState(hasEndDate);
  const [useDateTime, setUseDateTime] = useState(hasTime);

  return (
    <div className="gap-8 sm:gap-4 grid grid-cols-1 sm:grid-cols-4">
      <Field className="relative col-span-2">
        <Label>Startdatum</Label>
        {useDateTime ? (
          <SmartDatetimePicker
            name="startedAt"
            required
            invalid={!!errors?.startedAt}
            defaultValue={
              defaultValues?.startedAt
                ? new Date(defaultValues.startedAt)
                : undefined
            }
          />
        ) : (
          <SmartDatePicker
            name="startedAt"
            required
            invalid={!!errors?.startedAt}
            defaultValue={
              defaultValues?.startedAt
                ? new Date(defaultValues.startedAt)
                : undefined
            }
          />
        )}
      </Field>
      {showEndDate ? (
        <Field className="relative col-span-2">
          <Label>Einddatum</Label>
          {useDateTime ? (
            <SmartDatetimePicker
              name="endedAt"
              invalid={!!errors?.endedAt}
              defaultValue={
                defaultValues?.endedAt
                  ? new Date(defaultValues.endedAt)
                  : undefined
              }
            />
          ) : (
            <SmartDatePicker
              name="endedAt"
              invalid={!!errors?.endedAt}
              defaultValue={
                defaultValues?.endedAt
                  ? new Date(defaultValues.endedAt)
                  : undefined
              }
            />
          )}
        </Field>
      ) : null}
      <div className="col-span-4">
        <CheckboxField>
          <Checkbox
            name="isMultipleDays"
            onChange={(checked) => setShowEndDate(checked)}
            checked={showEndDate}
          />
          <Label>Meerdere dagen</Label>
        </CheckboxField>
        <CheckboxField>
          <Checkbox
            name="hasTime"
            onChange={(checked) => setUseDateTime(checked)}
            checked={useDateTime}
          />
          <Label>Inclusief tijd</Label>
        </CheckboxField>
      </div>

      <Field className="col-span-2">
        <Label>Vertrekhaven</Label>
        <Input
          name="departurePort"
          placeholder="bv. Den Helder (NL)"
          invalid={!!errors?.departurePort}
          defaultValue={defaultValues?.departurePort ?? undefined}
        />
      </Field>

      <Field className="col-span-2">
        <Label>Aankomsthaven</Label>
        <Input
          name="arrivalPort"
          placeholder="bv. Den Helder (NL)"
          invalid={!!errors?.arrivalPort}
          defaultValue={defaultValues?.arrivalPort ?? undefined}
        />
      </Field>

      <Field className="col-span-3">
        <Label>Organisatie</Label>
        <Input
          name="location"
          placeholder="bv. zeilschool, verhuurder"
          invalid={!!errors?.location}
          defaultValue={defaultValues?.location ?? undefined}
        />
      </Field>

      <Field className="col-span-2">
        <Label>Windrichting</Label>
        <Input
          name="windDirection"
          placeholder="bv. NW"
          invalid={!!errors?.windDirection}
          defaultValue={defaultValues?.windDirection ?? undefined}
        />
      </Field>

      <Field className="col-span-2">
        <Label>Windkracht (knopen)</Label>
        <Input
          type="number"
          name="windPower"
          placeholder="bv. 4"
          step=".01"
          invalid={!!errors?.windPower}
          defaultValue={defaultValues?.windPower ?? undefined}
        />
      </Field>

      <Field className="col-span-2">
        <Label>Type boot</Label>
        <Input
          name="boatType"
          placeholder="bv. Dehler 36"
          invalid={!!errors?.boatType}
          defaultValue={defaultValues?.boatType ?? undefined}
        />
      </Field>

      <Field className="col-span-2">
        <Label>Bootlengte (meters)</Label>
        <Input
          type="number"
          name="boatLength"
          step=".01"
          invalid={!!errors?.boatLength}
          defaultValue={defaultValues?.boatLength ?? undefined}
        />
      </Field>

      <Field className="col-span-2">
        <Label>Gevaren nautische mijlen</Label>
        <Input
          type="number"
          name="sailedNauticalMiles"
          step=".01"
          invalid={!!errors?.sailedNauticalMiles}
          defaultValue={defaultValues?.sailedNauticalMiles ?? undefined}
        />
      </Field>

      <Field className="col-span-2">
        <Label>Uren in donker</Label>
        <Input
          type="number"
          name="sailedHoursInDark"
          step=".01"
          invalid={!!errors?.sailedHoursInDark}
          defaultValue={defaultValues?.sailedHoursInDark ?? undefined}
        />
      </Field>

      <Field className="col-span-3">
        <Label>Primaire rol</Label>
        <Listbox
          name="primaryRole"
          defaultValue={defaultValues?.primaryRole}
          className="w-full"
        >
          <ListboxOption value="schipper">Schipper</ListboxOption>
          <ListboxOption value="navigator">Navigator</ListboxOption>
          <ListboxOption value="stuurman">Stuurman</ListboxOption>
          <ListboxOption value="dekknecht">Dekknecht/Maat</ListboxOption>
          <ListboxOption value="overig">Overig</ListboxOption>
        </Listbox>
      </Field>

      <Field className="col-span-4">
        <Label>Bemanningsnamen</Label>
        <Textarea
          name="crewNames"
          placeholder="bv. Jan Jansen, Piet Pietersen"
          invalid={!!errors?.crewNames}
          defaultValue={defaultValues?.crewNames ?? undefined}
        />
      </Field>

      <Field className="col-span-4">
        <Label>Omstandigheden</Label>
        <Textarea
          name="conditions"
          placeholder="bv. rustig weer, lichte golfslag"
          invalid={!!errors?.conditions}
          defaultValue={defaultValues?.conditions ?? undefined}
        />
      </Field>

      <Field className="col-span-4">
        <Label>Bijzonderheden / Opmerkingen</Label>
        <Textarea
          name="additionalComments"
          placeholder="bv. wedstrijd, storingen, vastgelopen, examen"
          invalid={!!errors?.additionalComments}
          defaultValue={defaultValues?.additionalComments ?? undefined}
        />
      </Field>
    </div>
  );
}
