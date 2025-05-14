"use client";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { BadgeCheckbox } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Input } from "~/app/(dashboard)/_components/input";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateLocationResourcesAction } from "~/app/_actions/location/update-location-resources-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
import Spinner from "~/app/_components/spinner";
import type {
  listDisciplines,
  listGearTypes,
  listResourcesForLocation,
} from "~/lib/nwd";
import { FieldSection } from "./field-selection";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}

export default function ResourcesForm({
  className,
  locationId,
  gearTypes,
  disciplines,
  allGearTypes,
  allDisciplines,
}: {
  className?: string;
  locationId: string;
  gearTypes: Awaited<ReturnType<typeof listResourcesForLocation>>["gearTypes"];
  disciplines: Awaited<
    ReturnType<typeof listResourcesForLocation>
  >["disciplines"];
  allGearTypes: Awaited<ReturnType<typeof listGearTypes>>;
  allDisciplines: Awaited<ReturnType<typeof listDisciplines>>;
}) {
  const [disciplineFilter, setDisciplineFilter] = useState<string>("");
  const [gearTypeFilter, setGearTypeFilter] = useState<string>("");

  const { execute, input } = useAction(
    updateLocationResourcesAction.bind(null, locationId),
    {
      onSuccess: () => {
        toast.success("Instellingen zijn geüpdatet.");
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    gearTypes: gearTypes.reduce(
      (acc, { gearType }) => {
        acc[gearType.id] = "on";
        return acc;
      },
      {} as Record<string, string | undefined>,
    ),
    disciplines: disciplines.reduce(
      (acc, { discipline }) => {
        acc[discipline.id] = "on";
        return acc;
      },
      {} as Record<string, string | undefined>,
    ),
  });

  return (
    <form className={className} action={execute}>
      <FieldSection
        label="Vaartuigen"
        description="De vaartuigen die deze locatie aanbiedt."
      >
        <Input
          value={gearTypeFilter}
          onChange={(e) => setGearTypeFilter(e.target.value)}
          placeholder="Zoek naar een vaartuig"
        />
        <div className="flex flex-wrap gap-2 mt-2 h-fit">
          {allGearTypes
            .sort((a, b) =>
              (a.title ?? a.handle).localeCompare(b.title ?? b.handle),
            )
            .map((gearType) => (
              <BadgeCheckbox
                name={`gearTypes[${gearType.id}]`}
                defaultChecked={
                  getInputValue("gearTypes")?.[gearType.id] === "on"
                }
                key={`gearType-${gearType.id}-${getInputValue("gearTypes")?.[gearType.id]}`}
                hidden={
                  !gearType.title
                    ?.toLowerCase()
                    .includes(gearTypeFilter.toLowerCase())
                }
              >
                {gearType.title}
              </BadgeCheckbox>
            ))}
        </div>
      </FieldSection>
      <Divider soft className="my-10" />
      <FieldSection
        label="Disciplines"
        description="De disciplines die deze locatie aanbiedt."
      >
        <Input
          value={disciplineFilter}
          onChange={(e) => setDisciplineFilter(e.target.value)}
          placeholder="Zoek naar een discipline"
        />
        <div className="flex flex-wrap gap-2 mt-2 h-fit">
          {allDisciplines
            .sort((a, b) =>
              (a.title ?? a.handle).localeCompare(b.title ?? b.handle),
            )
            .map((discipline) => (
              <BadgeCheckbox
                name={`disciplines[${discipline.id}]`}
                defaultChecked={
                  getInputValue("disciplines")?.[discipline.id] === "on"
                }
                key={`discipline-${discipline.id}-${getInputValue("disciplines")?.[discipline.id]}`}
                hidden={
                  !discipline.title
                    ?.toLowerCase()
                    .includes(disciplineFilter.toLowerCase())
                }
              >
                {discipline.title}
              </BadgeCheckbox>
            ))}
        </div>
      </FieldSection>
      <Divider soft className="my-10" />
      <div className="flex justify-end gap-4">
        <Button plain type="reset">
          Reset
        </Button>

        <SubmitButton />
      </div>
    </form>
  );
}
