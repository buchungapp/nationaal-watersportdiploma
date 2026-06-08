"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  getGearTypesForNwdCCurriculum,
  registerNwdCAction,
} from "~/app/_actions/eigenvaardigheid/manage-nwd-c";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Combobox,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Field, Fieldset, Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import dayjs from "~/lib/dayjs";

type NwdCProgram = Awaited<
  ReturnType<
    typeof import("~/app/_actions/eigenvaardigheid/manage-nwd-c").getNwdCPrograms
  >
>[number];

type LocationOption = Awaited<
  ReturnType<
    typeof import("~/app/_actions/eigenvaardigheid/manage-nwd-c").listLocationsForNwdCRegistration
  >
>[number];

type ExistingNwdCKey = Awaited<
  ReturnType<
    typeof import("~/app/_actions/eigenvaardigheid/manage-nwd-c").getExistingNwdCCertificateKeys
  >
>[number];

type GearType = Awaited<
  ReturnType<typeof getGearTypesForNwdCCurriculum>
>[number];

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Registreren..." : "NWD-C registreren"}
    </Button>
  );
}

export default function AddNwdCDialog({
  isOpen,
  onClose,
  personId,
  programs,
  locations,
  existingNwdCKeys,
}: {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  programs: NwdCProgram[];
  locations: LocationOption[];
  existingNwdCKeys: ExistingNwdCKey[];
}) {
  const [selectedProgram, setSelectedProgram] = useState<NwdCProgram | null>(
    null,
  );
  const [selectedGearType, setSelectedGearType] = useState<GearType | null>(
    null,
  );
  const [selectedLocation, setSelectedLocation] =
    useState<LocationOption | null>(null);
  const [gearTypes, setGearTypes] = useState<GearType[]>([]);
  const [isLoadingGearTypes, setIsLoadingGearTypes] = useState(false);
  const [issuedDate, setIssuedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const [opmerkingen, setOpmerkingen] = useState("");
  const [programQuery, setProgramQuery] = useState("");
  const [gearQuery, setGearQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  useEffect(() => {
    if (!selectedProgram?.curriculum?.id) {
      setGearTypes([]);
      setSelectedGearType(null);
      return;
    }

    setIsLoadingGearTypes(true);
    getGearTypesForNwdCCurriculum(selectedProgram.curriculum.id)
      .then((types) => {
        setGearTypes(types);
        setSelectedGearType(null);
      })
      .catch(() => {
        toast.error("Vaartuigen laden mislukt");
        setGearTypes([]);
      })
      .finally(() => {
        setIsLoadingGearTypes(false);
      });
  }, [selectedProgram?.curriculum?.id]);

  const isCombinationExisting = (
    curriculumId: string | undefined,
    gearTypeId: string | undefined,
  ) => {
    if (!curriculumId || !gearTypeId) return false;
    return existingNwdCKeys.some(
      (key) =>
        key.curriculumId === curriculumId && key.gearTypeId === gearTypeId,
    );
  };

  const availableGearTypes = gearTypes.filter(
    (gearType) =>
      !isCombinationExisting(selectedProgram?.curriculum?.id, gearType.id),
  );

  const resetForm = () => {
    setSelectedProgram(null);
    setSelectedGearType(null);
    setSelectedLocation(null);
    setGearTypes([]);
    setIssuedDate(dayjs().format("YYYY-MM-DD"));
    setOpmerkingen("");
    setProgramQuery("");
    setGearQuery("");
    setLocationQuery("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !selectedProgram?.curriculum?.id ||
      !selectedGearType ||
      !selectedLocation
    ) {
      return;
    }

    if (
      isCombinationExisting(
        selectedProgram.curriculum.id,
        selectedGearType.id,
      )
    ) {
      toast.error("Deze NWD-C combinatie bestaat al voor deze persoon");
      return;
    }

    try {
      const result = await registerNwdCAction({
        personId,
        curriculumId: selectedProgram.curriculum.id,
        gearTypeId: selectedGearType.id,
        locationId: selectedLocation.id,
        issuedAt: dayjs(issuedDate).startOf("day").toISOString(),
        opmerkingen: opmerkingen || undefined,
      });

      if (result?.data?.success) {
        toast.success("NWD-C geregistreerd");
        handleClose();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        toast.error("Registratie mislukt");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registratie mislukt",
      );
    }
  };

  const canSubmit =
    !!selectedProgram?.curriculum?.id &&
    !!selectedGearType &&
    !!selectedLocation &&
    !!issuedDate;

  return (
    <Dialog open={isOpen} onClose={handleClose} size="2xl">
      <DialogTitle>NWD-C registreren</DialogTitle>
      <DialogDescription>
        Registreer een NWD-C eigenvaardigheid voor deze instructeur. Per
        discipline is maximaal één C per vaartuig toegestaan.
      </DialogDescription>

      <form onSubmit={handleSubmit}>
        <DialogBody>
          <Fieldset>
            <Field>
              <Label htmlFor="program">Discipline / programma</Label>
              <Combobox
                value={selectedProgram}
                onChange={(program) => {
                  setSelectedProgram(program);
                  setSelectedGearType(null);
                }}
                options={programs}
                displayValue={(program) =>
                  program
                    ? `${program.course.discipline.title ?? program.course.handle} — ${program.title ?? program.handle}`
                    : ""
                }
                filter={(program, query) =>
                  program
                    ? (program.course.discipline.title
                        ?.toLowerCase()
                        .includes(query.toLowerCase()) ??
                        false) ||
                      program.title
                        ?.toLowerCase()
                        .includes(query.toLowerCase()) ||
                      program.handle.toLowerCase().includes(query.toLowerCase())
                    : false
                }
                placeholder="Zoek een discipline..."
                setQuery={setProgramQuery}
              >
                {(program) => (
                  <ComboboxOption value={program}>
                    <div>
                      <div className="font-medium">
                        {program.course.discipline.title ??
                          program.course.handle}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {program.title ?? program.handle}
                      </div>
                    </div>
                  </ComboboxOption>
                )}
              </Combobox>
            </Field>

            {selectedProgram && (
              <Field>
                <Label htmlFor="gearType">Vaartuig</Label>
                {isLoadingGearTypes ? (
                  <p className="text-sm text-zinc-500">Vaartuigen laden...</p>
                ) : availableGearTypes.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Geen beschikbare vaartuigen (alle combinaties zijn al
                    geregistreerd).
                  </p>
                ) : (
                  <Combobox
                    value={selectedGearType}
                    onChange={setSelectedGearType}
                    options={availableGearTypes}
                    displayValue={(gearType) => gearType?.title ?? ""}
                    filter={(gearType, query) =>
                      gearType
                        ? (gearType.title ?? gearType.handle)
                            .toLowerCase()
                            .includes(query.toLowerCase())
                        : false
                    }
                    placeholder="Selecteer vaartuig..."
                    setQuery={setGearQuery}
                  >
                    {(gearType) => (
                      <ComboboxOption value={gearType}>
                        {gearType.title ?? gearType.handle}
                      </ComboboxOption>
                    )}
                  </Combobox>
                )}
              </Field>
            )}

            <Field>
              <Label htmlFor="location">Locatie van registratie</Label>
              <Combobox
                value={selectedLocation}
                onChange={setSelectedLocation}
                options={locations}
                displayValue={(location) => location?.name ?? ""}
                filter={(location, query) =>
                  location
                    ? (location.name ?? location.handle)
                        .toLowerCase()
                        .includes(query.toLowerCase())
                    : false
                }
                placeholder="Zoek een locatie..."
                setQuery={setLocationQuery}
              >
                {(location) => (
                  <ComboboxOption value={location}>
                    {location.name ?? location.handle}
                  </ComboboxOption>
                )}
              </Combobox>
            </Field>

            <Field>
              <Label htmlFor="issuedDate">Datum van registratie</Label>
              <Input
                id="issuedDate"
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                required
              />
            </Field>

            <Field>
              <Label htmlFor="opmerkingen">Opmerkingen (optioneel)</Label>
              <Textarea
                id="opmerkingen"
                rows={3}
                value={opmerkingen}
                onChange={(e) => setOpmerkingen(e.target.value)}
                placeholder="Bijv. naam beoordelaar of context van de registratie"
              />
            </Field>
          </Fieldset>
        </DialogBody>

        <DialogActions>
          <Button plain onClick={handleClose} type="button">
            Annuleren
          </Button>
          <SubmitButton disabled={!canSubmit} />
        </DialogActions>
      </form>
    </Dialog>
  );
}
