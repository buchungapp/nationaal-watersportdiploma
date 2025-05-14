"use client";
import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { BadgeCheckbox } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Divider } from "~/app/(dashboard)/_components/divider";
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
      <input name="gearTypes1" type="hidden" value="test2" />
      <input name="gearTypes1" type="hidden" value="test3" />
      <FieldSection
        label="Vaartuigen"
        description="De vaartuigen die deze locatie aanbiedt."
        className="flex flex-wrap gap-2 h-fit"
      >
        {allGearTypes.map((gearType) => (
          <BadgeCheckbox
            name={`gearTypes[${gearType.id}]`}
            defaultChecked={getInputValue("gearTypes")?.[gearType.id] === "on"}
            key={`gearType-${gearType.id}-${getInputValue("gearTypes")?.[gearType.id]}`}
          >
            {gearType.title}
          </BadgeCheckbox>
        ))}
      </FieldSection>
      <Divider soft className="my-10" />
      <FieldSection
        label="Disciplines"
        description="De disciplines die deze locatie aanbiedt."
        className="flex flex-wrap gap-2 h-fit"
      >
        {allDisciplines.map((discipline) => (
          <BadgeCheckbox
            name={`disciplines[${discipline.id}]`}
            defaultChecked={
              getInputValue("disciplines")?.[discipline.id] === "on"
            }
            key={`discipline-${discipline.id}-${getInputValue("disciplines")?.[discipline.id]}`}
          >
            {discipline.title}
          </BadgeCheckbox>
        ))}
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
