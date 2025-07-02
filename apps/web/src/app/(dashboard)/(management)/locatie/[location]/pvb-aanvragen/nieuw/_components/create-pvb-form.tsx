"use client";

import { TrashIcon } from "@heroicons/react/16/solid";
import { DocumentDuplicateIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useStateAction } from "next-safe-action/stateful-hooks";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Breakout from "~/app/(dashboard)/_components/breakout";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "~/app/(dashboard)/_components/combobox";
import { Field, Label } from "~/app/(dashboard)/_components/fieldset";
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

interface InstructiegroepData {
  kwalificatieprofielId: string;
  courseId: string;
  instructiegroep?: {
    id: string;
    title: string;
    richting: string;
    courses: Array<{
      id: string;
      handle: string;
      title: string | null;
    }>;
  };
  error?: string;
}

interface Props {
  locationId: string;
  countries: Country[];
  niveaus: Niveau[];
  courses: Course[];
  kwalificatieprofielen: Kwalificatieprofiel[];
  selectedNiveauId: string;
  instructiegroepData: Record<string, InstructiegroepData>;
}

interface SelectedKandidaat {
  id: string;
  label: string;
  leercoach?: string;
  beoordelaar?: string;
  startDatumTijd?: string;
}

interface KwalificatieprofielConfig {
  id: string;
  titel: string;
  richting: string;
  hoofdcursus?: {
    courseId: string;
    instructieGroepId: string;
    title: string;
  };
  aanvullendeCursussen: Array<{
    courseId: string;
    instructieGroepId: string;
    title: string;
    selected: boolean;
  }>;
  instructiegroepError?: string;
  onderdelen: Array<{
    id: string;
    title: string;
    type: string;
    selected: boolean;
  }>;
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
        <div className="w-full p-2 text-sm text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-lg">
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
  instructiegroepData,
}: Props) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [_niveau, setNiveau] = useQueryState("niveau", { shallow: false });

  // Parse course selections from URL search params
  const [courseSelections, setCourseSelections] = useState<
    Record<string, string>
  >(() => {
    const selections: Record<string, string> = {};
    for (const kp of kwalificatieprofielen) {
      const value = searchParams.get(`kp-${kp.id}`) || "";
      selections[`kp-${kp.id}`] = value;
    }
    return selections;
  });

  const [selectedKandidaten, setSelectedKandidaten] = useState<
    SelectedKandidaat[]
  >([]);
  const [kwalificatieprofielenConfig, setKwalificatieprofielenConfig] =
    useState<KwalificatieprofielConfig[]>([]);
  const [opmerkingen, setOpmerkingen] = useState("");
  const [personQuery, setPersonQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Function to update URL when course selections change
  const updateCourseSelectionInURL = (kpId: string, courseId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (courseId) {
      newSearchParams.set(`kp-${kpId}`, courseId);
    } else {
      newSearchParams.delete(`kp-${kpId}`);
    }
    router.replace(`?${newSearchParams.toString()}`, { scroll: false });

    setCourseSelections((prev) => ({
      ...prev,
      [`kp-${kpId}`]: courseId,
    }));
  };

  // Initialize kwalificatieprofielen configurations when data is available
  useEffect(() => {
    if (kwalificatieprofielen.length > 0) {
      const configs: KwalificatieprofielConfig[] = kwalificatieprofielen.map(
        (kp) => {
          const courseSelection = courseSelections[`kp-${kp.id}`];
          const instructiegroepKey = courseSelection
            ? `${kp.id}-${courseSelection}`
            : null;
          const instructiegroepInfo = instructiegroepKey
            ? instructiegroepData[instructiegroepKey]
            : null;

          let hoofdcursus = undefined;
          let aanvullendeCursussen: KwalificatieprofielConfig["aanvullendeCursussen"] =
            [];
          let instructiegroepError = undefined;

          if (courseSelection && instructiegroepInfo) {
            const course = courses.find((c) => c.id === courseSelection);
            if (course) {
              if (instructiegroepInfo.instructiegroep) {
                hoofdcursus = {
                  courseId: courseSelection,
                  instructieGroepId: instructiegroepInfo.instructiegroep.id,
                  title: course.title,
                };

                aanvullendeCursussen =
                  instructiegroepInfo.instructiegroep.courses
                    .filter(
                      (c: { id: string; title: string | null }) =>
                        c.id !== courseSelection && c.title,
                    )
                    .map((c: { id: string; title: string | null }) => ({
                      courseId: c.id,
                      instructieGroepId:
                        instructiegroepInfo.instructiegroep?.id ?? "",
                      title: c.title as string,
                      selected: false,
                    }));
              } else if (instructiegroepInfo.error) {
                instructiegroepError = instructiegroepInfo.error;
              }
            }
          }

          return {
            id: kp.id,
            titel: kp.titel,
            richting: kp.richting,
            hoofdcursus,
            aanvullendeCursussen,
            instructiegroepError,
            onderdelen: kp.kerntaken.flatMap((kerntaak) =>
              kerntaak.onderdelen.map((onderdeel) => ({
                id: onderdeel.id,
                title: `${kerntaak.titel} - ${onderdeel.type}`,
                type: onderdeel.type,
                selected: true,
              })),
            ),
          };
        },
      );
      setKwalificatieprofielenConfig(configs);
    } else {
      setKwalificatieprofielenConfig([]);
    }
  }, [kwalificatieprofielen, courseSelections, instructiegroepData, courses]);

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

  const handleNiveauChange = (niveauId: string) => {
    setNiveau(niveauId);
    // Clear all course selections when niveau changes
    const clearedSelections: Record<string, string> = {};
    for (const kp of kwalificatieprofielen) {
      clearedSelections[`kp-${kp.id}`] = "";
    }
    setCourseSelections(clearedSelections);

    // Also clear from URL
    const newSearchParams = new URLSearchParams(searchParams);
    for (const kp of kwalificatieprofielen) {
      newSearchParams.delete(`kp-${kp.id}`);
    }
    router.replace(`?${newSearchParams.toString()}`, { scroll: false });
  };

  const handleHoofdcursusSelect = (kpId: string, courseId: string) => {
    updateCourseSelectionInURL(kpId, courseId);
  };

  const handleAanvullendeCursusToggle = (kpId: string, courseId: string) => {
    setKwalificatieprofielenConfig((prev) =>
      prev.map((config) =>
        config.id === kpId
          ? {
              ...config,
              aanvullendeCursussen: config.aanvullendeCursussen.map((c) =>
                c.courseId === courseId ? { ...c, selected: !c.selected } : c,
              ),
            }
          : config,
      ),
    );
  };

  const handleOnderdeelToggle = (kpId: string, onderdeelId: string) => {
    setKwalificatieprofielenConfig((prev) =>
      prev.map((config) =>
        config.id === kpId
          ? {
              ...config,
              onderdelen: config.onderdelen.map((o) =>
                o.id === onderdeelId ? { ...o, selected: !o.selected } : o,
              ),
            }
          : config,
      ),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedKandidaten.length === 0) {
      toast.error("Selecteer minimaal één kandidaat");
      return;
    }

    if (kwalificatieprofielenConfig.length === 0) {
      toast.error("Selecteer een niveau");
      return;
    }

    if (!kwalificatieprofielenConfig.some((kp) => kp.hoofdcursus)) {
      toast.error("Selecteer minimaal één hoofdcursus");
      return;
    }

    // Get all selected onderdelen from all kwalificatieprofielen
    const selectedOnderdelen = kwalificatieprofielenConfig.flatMap((kp) =>
      kp.onderdelen.filter((o) => o.selected).map((o) => o.id),
    );

    if (selectedOnderdelen.length === 0) {
      toast.error("Selecteer minimaal één onderdeel");
      return;
    }

    execute({
      locationHandle: params.location as string,
      courseConfig: {
        niveauId: selectedNiveauId,
        selectedOnderdelen,
        kwalificatieprofielen: kwalificatieprofielenConfig.map((kp) => ({
          id: kp.id,
          titel: kp.titel,
          richting: kp.richting,
          hoofdcursus: kp.hoofdcursus,
          aanvullendeCursussen: kp.aanvullendeCursussen
            .filter((c) => c.selected)
            .map((c) => ({
              courseId: c.courseId,
              instructieGroepId: c.instructieGroepId,
            })),
        })),
        opmerkingen,
      },
      kandidaten: selectedKandidaten.map((k) => ({
        id: k.id,
        leercoach: k.leercoach,
        beoordelaar: k.beoordelaar,
        startDatumTijd: k.startDatumTijd,
      })),
    });
  };

  const isLoading = status === "executing";
  const hasValidConfiguration =
    kwalificatieprofielenConfig.some((kp) => kp.hoofdcursus) &&
    kwalificatieprofielenConfig.some((kp) =>
      kp.onderdelen.some((o) => o.selected),
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: KSS Niveau Selection */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              1
            </div>
            <h2 className="text-base font-semibold text-zinc-900">
              KSS Niveau
            </h2>
          </div>
        </div>

        <div className="p-4">
          <Text className="text-sm text-zinc-600 mb-3">
            Selecteer het KSS niveau voor de PvB aanvragen.
          </Text>

          <Field className="max-w-xs">
            <Label className="text-sm font-medium text-zinc-700">Niveau</Label>
            <Select
              value={selectedNiveauId}
              onChange={(e) => handleNiveauChange(e.target.value)}
              className="mt-1"
            >
              <option value="">Selecteer niveau...</option>
              {niveaus.map((niveau) => (
                <option key={niveau.id} value={niveau.id}>
                  Niveau {niveau.rang}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      {/* Step 2: Kwalificatieprofielen Configuration */}
      {selectedNiveauId && kwalificatieprofielen.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                2
              </div>
              <h2 className="text-base font-semibold text-zinc-900">
                Kwalificatieprofielen
              </h2>
            </div>
          </div>

          <div className="p-4">
            <Text className="text-sm text-zinc-600 mb-4">
              Voor elk kwalificatieprofiel moet een hoofdcursus geselecteerd
              worden. De hoofdcursus bepaalt waar de PvB plaatsvindt en welke
              beoordelaar bevoegd is.
            </Text>

            <div className="space-y-4">
              {kwalificatieprofielen.map((kp) => {
                const config = kwalificatieprofielenConfig.find(
                  (c) => c.id === kp.id,
                );
                if (!config) return null;

                return (
                  <div
                    key={kp.id}
                    className="border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50/30 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="bg-zinc-100 px-3 py-2 border-b border-zinc-200">
                      <h3 className="font-medium text-sm text-zinc-900">
                        {kp.titel}
                      </h3>
                    </div>

                    <div className="p-3 space-y-3">
                      {/* Hoofdcursus Selection */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1 h-3 bg-blue-500 rounded-full" />
                          <div className="text-sm font-medium">Hoofdcursus</div>
                        </div>
                        <Select
                          value={courseSelections[`kp-${kp.id}`] || ""}
                          onChange={(e) =>
                            handleHoofdcursusSelect(kp.id, e.target.value)
                          }
                          className="w-full"
                        >
                          <option value="">Selecteer hoofdcursus...</option>
                          {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                        </Select>
                        {config.instructiegroepError && (
                          <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded text-sm">
                            <span className="text-red-600 mt-0.5">⚠️</span>
                            <Text className="text-red-700">
                              {config.instructiegroepError}
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Aanvullende Cursussen */}
                      {config.hoofdcursus &&
                        config.aanvullendeCursussen.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                              <div className="text-sm font-medium">
                                Aanvullende cursussen
                                <span className="text-sm font-normal text-zinc-500 ml-1">
                                  (optioneel)
                                </span>
                              </div>
                            </div>
                            <div className="bg-zinc-50/50 p-2.5 rounded border border-zinc-100">
                              <Text className="text-sm text-zinc-600 leading-relaxed">
                                Door aanvullende cursussen aan te vinken worden
                                de kwalificaties van deze PvB ook meteen
                                toegepast op deze cursussen (voorheen
                                disciplines) bij succesvol behalen. De aanvrager
                                is er voor verantwoordelijk enkel cursussen aan
                                te klikken waarin hij de kandidaat bekwaam acht,
                                en waar de kandidaat ook voor aan de gestelde
                                ingangseisen voldoet.
                              </Text>
                            </div>
                            <CheckboxGroup className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
                              {config.aanvullendeCursussen.map((course) => (
                                <CheckboxField
                                  key={course.courseId}
                                  className="py-1 px-2 rounded hover:bg-zinc-50"
                                >
                                  <Checkbox
                                    checked={course.selected}
                                    onChange={() =>
                                      handleAanvullendeCursusToggle(
                                        kp.id,
                                        course.courseId,
                                      )
                                    }
                                    className="h-4 w-4 flex-shrink-0"
                                  />
                                  <Label className="text-sm text-zinc-700 truncate cursor-pointer">
                                    {course.title}
                                  </Label>
                                </CheckboxField>
                              ))}
                            </CheckboxGroup>
                          </div>
                        )}

                      {/* Onderdelen */}
                      {config.hoofdcursus && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 h-3 bg-purple-500 rounded-full" />
                            <div className="text-sm font-medium">
                              Onderdelen
                            </div>
                          </div>
                          <Text className="text-sm text-zinc-600">
                            Selecteer de onderdelen die getoetst moeten worden.
                          </Text>
                          <CheckboxGroup className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
                            {config.onderdelen.map((onderdeel) => (
                              <CheckboxField
                                key={onderdeel.id}
                                className="py-1 px-2 rounded hover:bg-zinc-50"
                              >
                                <Checkbox
                                  checked={onderdeel.selected}
                                  onChange={() =>
                                    handleOnderdeelToggle(kp.id, onderdeel.id)
                                  }
                                  className="h-4 w-4 mt-0.5"
                                />
                                <Label className="text-sm text-zinc-700 break-words leading-snug cursor-pointer">
                                  {onderdeel.title}
                                </Label>
                              </CheckboxField>
                            ))}
                          </CheckboxGroup>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Algemene Opmerkingen */}
      {hasValidConfiguration && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                3
              </div>
              <h2 className="text-base font-semibold text-zinc-900">
                Algemene opmerkingen
              </h2>
            </div>
          </div>

          <div className="p-4">
            <Text className="text-sm text-zinc-600 mb-3">
              Deze opmerkingen gelden voor alle PvB aanvragen in deze bulk.
            </Text>

            <Field>
              <Label className="text-sm font-medium text-zinc-700">
                Opmerkingen
              </Label>
              <Textarea
                value={opmerkingen}
                onChange={(e) => setOpmerkingen(e.target.value)}
                rows={3}
                placeholder="Optionele opmerkingen die gelden voor alle aanvragen..."
                className="mt-1"
              />
            </Field>
          </div>
        </div>
      )}

      {/* Step 4: Kandidaten beheren */}
      {hasValidConfiguration && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                4
              </div>
              <h2 className="text-base font-semibold text-zinc-900">
                Kandidaten beheren
              </h2>
            </div>
          </div>

          <div className="p-4">
            <Text className="text-sm text-zinc-600 mb-4">
              Voeg instructeurs toe die een PvB aanvraag moeten krijgen en
              configureer hun specifieke instellingen.
            </Text>

            <Field className="max-w-lg mb-4">
              <Label className="text-sm font-medium text-zinc-700">
                Voeg kandidaat toe
              </Label>
              <div className="flex gap-2 mt-1">
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

            {/* Configuration Table */}
            {selectedKandidaten.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Text className="font-medium text-sm">
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
                  <Table className="text-sm">
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
              <div className="text-center py-8 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                <PlusIcon className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
                <Text className="text-zinc-600 text-sm mb-1">
                  Nog geen kandidaten toegevoegd
                </Text>
                <Text className="text-sm text-zinc-500">
                  Gebruik de zoekfunctie hierboven om instructeurs toe te voegen
                </Text>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {result?.validationErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <Text className="text-red-700 text-sm">
            Er zijn validatiefouten opgetreden. Controleer de ingevoerde
            gegevens.
          </Text>
        </div>
      )}

      {result?.serverError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <Text className="text-red-700 text-sm">{result.serverError}</Text>
        </div>
      )}

      {/* Submit Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-zinc-200">
        <Button
          color="branding-dark"
          type="submit"
          disabled={
            isLoading ||
            selectedKandidaten.length === 0 ||
            !hasValidConfiguration
          }
        >
          {isLoading && <Spinner className="text-white" />}
          PvB aanvragen aanmaken ({selectedKandidaten.length})
        </Button>
      </div>
    </form>
  );
}
