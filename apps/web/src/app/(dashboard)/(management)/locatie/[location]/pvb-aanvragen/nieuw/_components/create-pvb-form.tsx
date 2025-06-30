"use client";

import { TrashIcon } from "@heroicons/react/16/solid";
import { DocumentDuplicateIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useStateAction } from "next-safe-action/stateful-hooks";
import { useParams, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Breakout from "~/app/(dashboard)/_components/breakout";
import { Button } from "~/app/(dashboard)/_components/button";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import { ErrorMessage } from "~/app/(dashboard)/_components/fieldset";
import {
  Field,
  FieldGroup,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Select } from "~/app/(dashboard)/_components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { Text } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { usePersonsForLocation } from "~/app/(dashboard)/_hooks/swr/use-persons-for-location";
import { createBulkPvbsAction } from "~/app/_actions/pvb/create-bulk-pvbs-action";
import Spinner from "~/app/_components/spinner";

interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  lastNamePrefix: string | null;
  email: string | null;
  actors: { type: string; id: string }[];
}

interface Country {
  code: string;
  name: string;
}

interface Niveau {
  id: string;
  rang: number;
}

interface Course {
  id: string;
  title: string;
}

interface Kwalificatieprofiel {
  id: string;
  titel: string;
  richting: string;
  niveau: { id: string; rang: number };
  kerntaken: Array<{
    id: string;
    titel: string;
    type: string;
    rang: number | null;
    onderdelen: Array<{ id: string; type: string }>;
  }>;
}

interface Props {
  locationId: string;
  countries: Country[];
  niveaus: Niveau[];
  courses: Course[];
  kwalificatieprofielen: Kwalificatieprofiel[];
  selectedNiveauId: string;
}

interface SelectedKandidaat {
  id: string;
  label: string;
  leercoach?: string;
  beoordelaar?: string;
  startDatumTijd?: string;
}

interface CourseSelection {
  id: string;
  title: string;
  isMain: boolean;
}

interface OnderdeelSelection {
  id: string;
  title: string;
  type: string;
  selected: boolean;
  kwalificatieprofielTitel: string;
}

function BeoordelaarCombobox({
  locationId,
  value,
  onChange,
}: {
  locationId: string;
  value: string;
  onChange: (personId: string) => void;
}) {
  const [query, setQuery] = useState("");

  const { data: beoordelaars, isLoading } = usePersonsForLocation(locationId, {
    filter: {
      query,
      actorType: "pvb_beoordelaar",
    },
  });

  const selectedBeoordelaar =
    beoordelaars.items.find((p) => p.id === value) || null;
  const hasNoBeoordelaars =
    !isLoading && beoordelaars.items.length === 0 && !query;

  const formatPersonName = (person: Person) => {
    const parts = [person.firstName];
    if (person.lastNamePrefix) parts.push(person.lastNamePrefix);
    if (person.lastName) parts.push(person.lastName);
    return parts.join(" ");
  };

  // Show empty state message when no beoordelaars exist
  if (hasNoBeoordelaars) {
    return (
      <div className="relative">
        <div className="w-full p-2 text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg">
          Geen beoordelaars beschikbaar. Voeg de rol 'PvB Beoordelaar' toe via
          personen-pagina.
        </div>
      </div>
    );
  }

  return (
    <Combobox
      options={beoordelaars.items}
      value={selectedBeoordelaar}
      onChange={(person) => onChange(person?.id || "")}
      displayValue={(person) => (person ? formatPersonName(person) : "")}
      setQuery={setQuery}
      filter={() => true}
      placeholder="Selecteer beoordelaar..."
    >
      {(person) => (
        <ComboboxOption key={person.id} value={person}>
          <ComboboxLabel>
            <div className="flex">
              <span className="truncate">{formatPersonName(person)}</span>
              {person.email && (
                <span className="ml-2 text-slate-500 group-data-active/option:text-white truncate">
                  ({person.email})
                </span>
              )}
            </div>
          </ComboboxLabel>
        </ComboboxOption>
      )}
    </Combobox>
  );
}

function LeercoachCombobox({
  locationId,
  value,
  onChange,
}: {
  locationId: string;
  value: string;
  onChange: (personId: string) => void;
}) {
  const [query, setQuery] = useState("");

  const { data: instructors, isLoading } = usePersonsForLocation(locationId, {
    filter: {
      query,
      actorType: "instructor",
    },
  });

  const selectedLeercoach =
    instructors.items.find((p) => p.id === value) || null;

  const formatPersonName = (person: Person) => {
    const parts = [person.firstName];
    if (person.lastNamePrefix) parts.push(person.lastNamePrefix);
    if (person.lastName) parts.push(person.lastName);
    return parts.join(" ");
  };

  return (
    <Combobox
      options={instructors.items}
      value={selectedLeercoach}
      onChange={(person) => onChange(person?.id || "")}
      displayValue={(person) => (person ? formatPersonName(person) : "")}
      setQuery={setQuery}
      filter={() => true}
      placeholder="Selecteer leercoach..."
    >
      {(person) => (
        <ComboboxOption key={person.id} value={person}>
          <ComboboxLabel>
            <div className="flex">
              <span className="truncate">{formatPersonName(person)}</span>
              {person.email && (
                <span className="ml-2 text-slate-500 group-data-active/option:text-white truncate">
                  ({person.email})
                </span>
              )}
            </div>
          </ComboboxLabel>
        </ComboboxOption>
      )}
    </Combobox>
  );
}

export default function CreatePvbForm({
  locationId,
  countries,
  niveaus,
  courses,
  kwalificatieprofielen,
  selectedNiveauId,
}: Props) {
  const params = useParams();
  const router = useRouter();
  const [niveau, setNiveau] = useQueryState("niveau");

  const [selectedKandidaten, setSelectedKandidaten] = useState<
    SelectedKandidaat[]
  >([]);
  const [courseConfig, setCourseConfig] = useState({
    niveauId: selectedNiveauId,
    selectedOnderdelen: [] as string[],
    courses: [] as CourseSelection[],
    opmerkingen: "",
  });
  const [personQuery, setPersonQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [onderdelenSelections, setOnderdelenSelections] = useState<
    OnderdeelSelection[]
  >([]);

  // Initialize onderdelen selections when kwalificatieprofielen data is available
  useEffect(() => {
    if (kwalificatieprofielen.length > 0) {
      const onderdelen: OnderdeelSelection[] = [];
      for (const kp of kwalificatieprofielen) {
        for (const kerntaak of kp.kerntaken) {
          for (const onderdeel of kerntaak.onderdelen) {
            onderdelen.push({
              id: onderdeel.id,
              title: `${kerntaak.titel} - ${onderdeel.type}`,
              type: onderdeel.type,
              selected: true,
              kwalificatieprofielTitel: kp.titel,
            });
          }
        }
      }
      setOnderdelenSelections(onderdelen);
      setCourseConfig((prev) => ({
        ...prev,
        selectedOnderdelen: onderdelen.map((o) => o.id),
      }));
    } else {
      setOnderdelenSelections([]);
      setCourseConfig((prev) => ({
        ...prev,
        selectedOnderdelen: [],
      }));
    }
  }, [kwalificatieprofielen]);

  // Sync courseConfig.niveauId with selectedNiveauId prop
  useEffect(() => {
    setCourseConfig((prev) => ({
      ...prev,
      niveauId: selectedNiveauId,
    }));
  }, [selectedNiveauId]);

  const { data: searchedInstructors, isLoading: isInstructorsLoading } =
    usePersonsForLocation(locationId, {
      filter: {
        query: personQuery,
        actorType: "instructor",
      },
    });

  const { execute, result, status } = useStateAction(createBulkPvbsAction, {
    onSuccess: ({ data }) => {
      if (data) {
        toast.success(data.message);
        router.push(
          `/(dashboard)/(management)/locatie/${params.location}/pvb-aanvragen`,
        );
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Er is een fout opgetreden");
    },
  });

  const formatPersonName = (person: Person) => {
    const parts = [person.firstName];
    if (person.lastNamePrefix) parts.push(person.lastNamePrefix);
    if (person.lastName) parts.push(person.lastName);
    return parts.join(" ");
  };

  const handlePersonSelect = (person: Person | null) => {
    if (person && !selectedKandidaten.some((k) => k.id === person.id)) {
      const newKandidaat: SelectedKandidaat = {
        id: person.id,
        label: formatPersonName(person),
      };
      setSelectedKandidaten((prev) => [...prev, newKandidaat]);
    }
    setSelectedPerson(null);
    setPersonQuery("");
  };

  const removeKandidaat = (kandidaatId: string) => {
    setSelectedKandidaten((prev) => prev.filter((k) => k.id !== kandidaatId));
  };

  const updateKandidaatField = (
    kandidaatId: string,
    field: keyof SelectedKandidaat,
    value: string,
  ) => {
    setSelectedKandidaten((prev) =>
      prev.map((k) => (k.id === kandidaatId ? { ...k, [field]: value } : k)),
    );
  };

  const copyToAllRows = (field: keyof SelectedKandidaat, value: string) => {
    setSelectedKandidaten((prev) =>
      prev.map((k) => ({ ...k, [field]: value })),
    );
    toast.success(`${field} gekopieerd naar alle rijen`);
  };

  const copyFromFirstRow = () => {
    if (selectedKandidaten.length === 0) return;

    const firstRow = selectedKandidaten[0];
    if (!firstRow) return;

    setSelectedKandidaten((prev) =>
      prev.map((k, index) =>
        index === 0
          ? k
          : {
              ...k,
              leercoach: firstRow?.leercoach,
              beoordelaar: firstRow?.beoordelaar,
              startDatumTijd: firstRow?.startDatumTijd,
            },
      ),
    );
    toast.success("Instellingen gekopieerd naar alle rijen");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedKandidaten.length === 0) {
      toast.error("Selecteer minimaal één kandidaat");
      return;
    }

    execute({
      locationHandle: params.location as string,
      courseConfig,
      kandidaten: selectedKandidaten.map((k) => ({
        id: k.id,
        leercoach: k.leercoach,
        beoordelaar: k.beoordelaar,
        startDatumTijd: k.startDatumTijd,
      })),
    });
  };

  const isLoading = status === "executing";

  const handleNiveauChange = (niveauId: string) => {
    setNiveau(niveauId);
    setCourseConfig((prev) => ({
      ...prev,
      niveauId,
      selectedOnderdelen: [],
      courses: [],
    }));
  };

  const handleOnderdeelToggle = (onderdeelId: string) => {
    setOnderdelenSelections((prev) =>
      prev.map((o) =>
        o.id === onderdeelId ? { ...o, selected: !o.selected } : o,
      ),
    );
    setCourseConfig((prev) => ({
      ...prev,
      selectedOnderdelen: onderdelenSelections
        .filter((o) => (o.id === onderdeelId ? !o.selected : o.selected))
        .map((o) => o.id),
    }));
  };

  const handleCourseToggle = (courseId: string, title: string) => {
    setCourseConfig((prev) => {
      const existingIndex = prev.courses.findIndex((c) => c.id === courseId);
      if (existingIndex >= 0) {
        // Remove course
        return {
          ...prev,
          courses: prev.courses.filter((c) => c.id !== courseId),
        };
      }
      // Add course (first course is main by default)
      return {
        ...prev,
        courses: [
          ...prev.courses,
          { id: courseId, title, isMain: prev.courses.length === 0 },
        ],
      };
    });
  };

  const handleCourseMainToggle = (courseId: string) => {
    setCourseConfig((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => ({
        ...c,
        isMain: c.id === courseId,
      })),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Step 1: KSS Niveau Selection */}
      <Fieldset>
        <Legend>KSS Niveau</Legend>
        <Text>Selecteer het KSS niveau voor de PvB aanvragen.</Text>

        <FieldGroup>
          <Field>
            <Label>Niveau</Label>
            <Select
              value={courseConfig.niveauId}
              onChange={(e) => handleNiveauChange(e.target.value)}
            >
              <option value="">Selecteer niveau...</option>
              {niveaus.map((niveau) => (
                <option key={niveau.id} value={niveau.id}>
                  Niveau {niveau.rang}
                </option>
              ))}
            </Select>
          </Field>
        </FieldGroup>
      </Fieldset>

      {/* Step 2: Kwalificatieprofielen en Onderdelen */}
      {courseConfig.niveauId && (
        <Fieldset>
          <Legend>Kwalificatieprofielen en Onderdelen</Legend>
          <Text>
            Selecteer de onderdelen die getoetst moeten worden. Standaard zijn
            alle onderdelen geselecteerd.
          </Text>

          <FieldGroup>
            {kwalificatieprofielen.map((kp) => (
              <div key={kp.id} className="space-y-2">
                <Text className="font-medium text-zinc-900">{kp.titel}</Text>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-4">
                  {kp.kerntaken.map((kerntaak) =>
                    kerntaak.onderdelen.map((onderdeel) => {
                      const selection = onderdelenSelections.find(
                        (o) => o.id === onderdeel.id,
                      );
                      return (
                        <div
                          key={onderdeel.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            checked={selection?.selected || false}
                            onChange={() => handleOnderdeelToggle(onderdeel.id)}
                          />
                          <Text className="text-sm">
                            {kerntaak.titel} - {onderdeel.type}
                          </Text>
                        </div>
                      );
                    }),
                  )}
                </div>
              </div>
            ))}
          </FieldGroup>
        </Fieldset>
      )}

      {/* Step 3: Cursussen */}
      {courseConfig.niveauId && (
        <Fieldset>
          <Legend>Cursussen</Legend>
          <Text>
            Selecteer één of meerdere cursussen. Markeer exact één cursus als
            'main' - deze cursus bepaalt wie gekwalificeerd is om de PvB te
            beoordelen.
          </Text>

          <FieldGroup>
            <div className="space-y-2">
              {courses.map((course) => {
                const isSelected = courseConfig.courses.some(
                  (c) => c.id === course.id,
                );
                const selectedCourse = courseConfig.courses.find(
                  (c) => c.id === course.id,
                );

                return (
                  <div
                    key={course.id}
                    className="flex items-center space-x-4 p-3 border rounded-lg"
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() =>
                        handleCourseToggle(course.id, course.title)
                      }
                    />
                    <Text className="flex-1">{course.title}</Text>
                    {isSelected && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedCourse?.isMain || false}
                          onChange={() => handleCourseMainToggle(course.id)}
                        />
                        <Text className="text-sm text-amber-600 font-medium">
                          Main
                        </Text>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </FieldGroup>
        </Fieldset>
      )}

      {/* Step 4: Algemene Opmerkingen */}
      <Fieldset>
        <Legend>Algemene opmerkingen</Legend>
        <Text>
          Deze opmerkingen gelden voor alle PvB aanvragen in deze bulk.
        </Text>

        <FieldGroup>
          <Field>
            <Label>Opmerkingen</Label>
            <Textarea
              value={courseConfig.opmerkingen}
              onChange={(e) =>
                setCourseConfig((prev) => ({
                  ...prev,
                  opmerkingen: e.target.value,
                }))
              }
              rows={3}
              placeholder="Optionele opmerkingen die gelden voor alle aanvragen..."
            />
          </Field>
        </FieldGroup>
      </Fieldset>

      {/* Step 5: Kandidaten beheren */}
      {courseConfig.niveauId &&
        courseConfig.selectedOnderdelen.length > 0 &&
        courseConfig.courses.length > 0 && (
          <Fieldset>
            <Legend>Kandidaten beheren</Legend>
            <Text>
              Voeg instructeurs toe die een PvB aanvraag moeten krijgen en
              configureer hun specifieke instellingen.
            </Text>

            <FieldGroup>
              <Field className="max-w-lg">
                <Label>Voeg kandidaat toe</Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Combobox
                      options={searchedInstructors.items}
                      value={selectedPerson}
                      onChange={handlePersonSelect}
                      displayValue={(person) =>
                        person ? formatPersonName(person) : ""
                      }
                      setQuery={setPersonQuery}
                      filter={() => true}
                      placeholder="Zoek instructeur op naam of email..."
                    >
                      {(person) => (
                        <ComboboxOption key={person.id} value={person}>
                          <ComboboxLabel>
                            <div className="flex">
                              <span className="truncate">
                                {formatPersonName(person)}
                              </span>
                              {person.email && (
                                <span className="ml-2 text-slate-500 group-data-active/option:text-white truncate">
                                  ({person.email})
                                </span>
                              )}
                            </div>
                          </ComboboxLabel>
                        </ComboboxOption>
                      )}
                    </Combobox>
                    {isInstructorsLoading && (
                      <div className="right-8 absolute inset-y-0 flex items-center">
                        <Spinner />
                      </div>
                    )}
                  </div>
                </div>
              </Field>
            </FieldGroup>

            {/* Configuration Table */}
            {selectedKandidaten.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <Text className="font-medium">
                    Kandidaten configuratie ({selectedKandidaten.length})
                  </Text>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      outline
                      onClick={copyFromFirstRow}
                      disabled={selectedKandidaten.length < 2}
                      className="text-sm"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                      Kopieer van eerste rij
                    </Button>
                  </div>
                </div>

                <Breakout className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader className="w-48">Kandidaat</TableHeader>
                        <TableHeader className="min-w-64">
                          Leercoach
                        </TableHeader>
                        <TableHeader className="min-w-64 max-w-80">
                          Beoordelaar
                        </TableHeader>
                        <TableHeader className="w-44">
                          Aanvangsdatum/tijd
                        </TableHeader>
                        <TableHeader className="w-16">Acties</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedKandidaten.map((kandidaat, index) => (
                        <TableRow key={kandidaat.id}>
                          <TableCell className="font-medium">
                            {kandidaat.label}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <div className="flex-1">
                                <LeercoachCombobox
                                  locationId={locationId}
                                  value={kandidaat.leercoach || ""}
                                  onChange={(personId) =>
                                    updateKandidaatField(
                                      kandidaat.id,
                                      "leercoach",
                                      personId,
                                    )
                                  }
                                />
                              </div>
                              {kandidaat.leercoach && (
                                <Button
                                  type="button"
                                  plain
                                  onClick={() =>
                                    copyToAllRows(
                                      "leercoach",
                                      kandidaat.leercoach ?? "",
                                    )
                                  }
                                  title="Kopieer naar alle rijen"
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <DocumentDuplicateIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <div className="flex-1">
                                <BeoordelaarCombobox
                                  locationId={locationId}
                                  value={kandidaat.beoordelaar || ""}
                                  onChange={(personId) =>
                                    updateKandidaatField(
                                      kandidaat.id,
                                      "beoordelaar",
                                      personId,
                                    )
                                  }
                                />
                              </div>
                              {kandidaat.beoordelaar && (
                                <Button
                                  type="button"
                                  plain
                                  onClick={() =>
                                    copyToAllRows(
                                      "beoordelaar",
                                      kandidaat.beoordelaar ?? "",
                                    )
                                  }
                                  title="Kopieer naar alle rijen"
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <DocumentDuplicateIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="datetime-local"
                                value={kandidaat.startDatumTijd || ""}
                                onChange={(e) =>
                                  updateKandidaatField(
                                    kandidaat.id,
                                    "startDatumTijd",
                                    e.target.value,
                                  )
                                }
                                className="flex-1"
                              />
                              {kandidaat.startDatumTijd && (
                                <Button
                                  type="button"
                                  plain
                                  onClick={() =>
                                    copyToAllRows(
                                      "startDatumTijd",
                                      kandidaat.startDatumTijd ?? "",
                                    )
                                  }
                                  title="Kopieer naar alle rijen"
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                  <DocumentDuplicateIcon className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              plain
                              onClick={() => removeKandidaat(kandidaat.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                              title="Verwijder kandidaat"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Breakout>
              </div>
            )}

            {/* Empty state */}
            {selectedKandidaten.length === 0 && (
              <div className="mt-6 text-center py-12 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
                <PlusIcon className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                <Text className="text-zinc-600 mb-2">
                  Nog geen kandidaten toegevoegd
                </Text>
                <Text className="text-sm text-zinc-500">
                  Gebruik de zoekfunctie hierboven om instructeurs toe te voegen
                </Text>
              </div>
            )}
          </Fieldset>
        )}

      {/* Error Messages */}
      {result?.validationErrors && (
        <ErrorMessage>
          Er zijn validatiefouten opgetreden. Controleer de ingevoerde gegevens.
        </ErrorMessage>
      )}

      {result?.serverError && <ErrorMessage>{result.serverError}</ErrorMessage>}

      {/* Submit Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          color="branding-dark"
          type="submit"
          disabled={
            isLoading ||
            selectedKandidaten.length === 0 ||
            !courseConfig.niveauId ||
            courseConfig.selectedOnderdelen.length === 0 ||
            courseConfig.courses.length === 0
          }
        >
          {isLoading && <Spinner className="text-white" />}
          PvB aanvragen aanmaken ({selectedKandidaten.length})
        </Button>
      </div>
    </form>
  );
}
