"use client";

import { TrashIcon } from "@heroicons/react/16/solid";
import { DocumentDuplicateIcon, PlusIcon } from "@heroicons/react/24/outline";
import { formatters } from "@nawadi/lib";
import { useStateAction } from "next-safe-action/stateful-hooks";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { useBeoordelaarsForLocation } from "~/app/(dashboard)/_hooks/swr/use-beoordelaars-for-location";
import { useInstructiegroepByCourse } from "~/app/(dashboard)/_hooks/swr/use-instructiegroep-by-course";
import { useKwalificatieprofielenByNiveau } from "~/app/(dashboard)/_hooks/swr/use-kwalificatieprofielen-by-niveau";
import { usePersonsForLocation } from "~/app/(dashboard)/_hooks/swr/use-persons-for-location";
import { createBulkPvbsAction } from "~/app/_actions/pvb/create-bulk-pvbs-action";
import Spinner from "~/app/_components/spinner";

const formatPersonName = formatters.formatPersonName;

interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  lastNamePrefix: string | null;
  email: string | null;
  actors: { type: string; id: string }[];
}

interface Niveau {
  id: string;
  rang: number;
}

interface Course {
  id: string;
  title: string;
}

interface Props {
  locationId: string;
  niveaus: Niveau[];
  courses: Course[];
  selectedNiveauId: string;
}

// Component for a single kwalificatieprofiel configuration
function KwalificatieprofielCard({
  kp,
  kpIndex,
  courses,
  isEnabled,
  onToggle,
  canDisable,
}: {
  kp: {
    id: string;
    titel: string;
    richting: string;
    kerntaken: Array<{
      id: string;
      titel: string;
      onderdelen: Array<{ id: string; type: string }>;
    }>;
  };
  kpIndex: number;
  courses: Course[];
  isEnabled: boolean;
  onToggle: () => void;
  canDisable: boolean;
}) {
  const [selectedHoofdcursus, setSelectedHoofdcursus] = useState("");

  // Fetch instructiegroep data when hoofdcursus is selected
  const { instructiegroep, isLoading: isLoadingInstructiegroep } =
    useInstructiegroepByCourse(
      selectedHoofdcursus || null,
      kp.richting as "instructeur" | "leercoach" | "pvb_beoordelaar",
    );

  // Get aanvullende cursussen from instructiegroep
  const aanvullendeCursussen =
    instructiegroep?.courses?.filter(
      (c) => c.id !== selectedHoofdcursus && c.title,
    ) || [];

  return (
    <div
      className={`border border-zinc-200 rounded-lg overflow-hidden shadow-sm transition-all ${
        isEnabled
          ? "bg-zinc-50/30 hover:shadow-md"
          : "bg-zinc-100/50 opacity-60"
      }`}
    >
      {/* Hidden fields for kwalificatieprofiel data - only render if enabled */}
      {isEnabled && (
        <>
          <input
            type="hidden"
            name={`courseConfig.kwalificatieprofielen[${kpIndex}].id`}
            value={kp.id}
          />
          <input
            type="hidden"
            name={`courseConfig.kwalificatieprofielen[${kpIndex}].titel`}
            value={kp.titel}
          />
          <input
            type="hidden"
            name={`courseConfig.kwalificatieprofielen[${kpIndex}].richting`}
            value={kp.richting}
          />
          {/* Hidden field for instructiegroepId when hoofdcursus is selected */}
          {instructiegroep && (
            <input
              type="hidden"
              name={`courseConfig.kwalificatieprofielen[${kpIndex}].instructieGroepId`}
              value={instructiegroep.id}
            />
          )}
        </>
      )}

      {/* Header */}
      <div
        className={`px-3 py-2 border-b border-zinc-200 ${
          isEnabled ? "bg-zinc-100" : "bg-zinc-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3
            className={`font-medium text-sm ${
              isEnabled ? "text-zinc-900" : "text-zinc-600"
            }`}
          >
            {kp.titel}
          </h3>
          <CheckboxField>
            <Checkbox
              checked={isEnabled}
              onChange={onToggle}
              disabled={!canDisable && isEnabled}
              className="h-4 w-4"
            />
            <Label
              className={`text-sm ${
                isEnabled ? "text-zinc-700" : "text-zinc-500"
              }`}
            >
              Actief
            </Label>
          </CheckboxField>
        </div>
      </div>

      {isEnabled && (
        <div className="p-3 space-y-3">
          {/* Hoofdcursus Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-3 bg-blue-500 rounded-full" />
              <div className="text-sm font-medium">Hoofdcursus</div>
            </div>
            <Select
              name={`courseConfig.kwalificatieprofielen[${kpIndex}].hoofdcursus.courseId`}
              className="w-full"
              value={selectedHoofdcursus}
              onChange={(e) => setSelectedHoofdcursus(e.target.value)}
            >
              <option value="">Selecteer hoofdcursus...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
          </div>

          {/* Aanvullende Cursussen - only show when hoofdcursus is selected */}
          {selectedHoofdcursus && (
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

              {isLoadingInstructiegroep ? (
                <div className="flex items-center gap-2 p-3 bg-zinc-50/50 rounded">
                  <Spinner className="h-4 w-4 text-zinc-600" />
                  <Text className="text-sm text-zinc-600">
                    Instructiegroep laden...
                  </Text>
                </div>
              ) : aanvullendeCursussen.length > 0 ? (
                <>
                  <div className="bg-zinc-50/50 p-2.5 rounded border border-zinc-100">
                    <Text className="text-sm text-zinc-600 leading-relaxed">
                      Door aanvullende cursussen aan te vinken worden de
                      kwalificaties van deze PvB ook meteen toegepast op deze
                      cursussen (voorheen disciplines) bij succesvol behalen. De
                      aanvrager is er voor verantwoordelijk enkel cursussen aan
                      te klikken waarin hij de kandidaat bekwaam acht, en waar
                      de kandidaat ook voor aan de gestelde ingangseisen
                      voldoet.
                    </Text>
                  </div>
                  <CheckboxGroup className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
                    {aanvullendeCursussen.map((course, courseIndex) => (
                      <CheckboxField
                        key={course.id}
                        className="py-1 px-2 rounded hover:bg-zinc-50"
                      >
                        <Checkbox
                          name={`courseConfig.kwalificatieprofielen[${kpIndex}].aanvullendeCursussen[${courseIndex}].courseId`}
                          value={course.id}
                          className="h-4 w-4 flex-shrink-0"
                        />
                        <Label className="text-sm text-zinc-700 truncate cursor-pointer">
                          {course.title}
                        </Label>
                      </CheckboxField>
                    ))}
                  </CheckboxGroup>
                </>
              ) : (
                <div className="p-3 bg-zinc-50/50 rounded border border-zinc-100">
                  <Text className="text-sm text-zinc-500">
                    Geen aanvullende cursussen beschikbaar voor deze
                    instructiegroep.
                  </Text>
                </div>
              )}
            </div>
          )}

          {/* Onderdelen */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-3 bg-purple-500 rounded-full" />
              <div className="text-sm font-medium">Onderdelen</div>
            </div>
            <Text className="text-sm text-zinc-600">
              Selecteer de onderdelen die getoetst moeten worden.
            </Text>
            <CheckboxGroup className="grid grid-cols-1 md:grid-cols-2 gap-0.5">
              {kp.kerntaken.flatMap((kerntaak) =>
                kerntaak.onderdelen.map((onderdeel) => (
                  <CheckboxField
                    key={onderdeel.id}
                    className="py-1 px-2 rounded hover:bg-zinc-50"
                  >
                    <Checkbox
                      name="courseConfig.selectedOnderdelen"
                      value={onderdeel.id}
                      defaultChecked
                      className="h-4 w-4 mt-0.5"
                    />
                    <Label className="text-sm text-zinc-700 break-words leading-snug cursor-pointer">
                      {kerntaak.titel} - {onderdeel.type}
                    </Label>
                  </CheckboxField>
                )),
              )}
            </CheckboxGroup>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for person selection that manages its own search state
function PersonCombobox({
  locationId,
  actorType,
  placeholder,
  name,
  value: parentValue,
  onSelect,
}: {
  locationId: string;
  actorType: "student" | "instructor" | "location_admin";
  placeholder: string;
  name: string;
  value?: string;
  onSelect?: (personId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(parentValue || "");

  // Sync with parent value changes
  useEffect(() => {
    setValue(parentValue || "");
  }, [parentValue]);

  const { data: persons } = usePersonsForLocation(locationId, {
    filter: { query, actorType },
  });

  // Handle undefined data during loading
  const personsItems = persons ? persons.items : [];
  const selectedPerson = personsItems.find((p) => p.id === value) || null;

  // Determine if we should show the empty state message
  const showEmptyMessage = persons && personsItems.length === 0;

  // Get appropriate empty message based on actor type
  const getEmptyMessage = () => {
    if (actorType === "instructor") {
      return (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 w-64 text-wrap">
          <div className="text-sm text-zinc-600">
            Geen instructeurs gevonden
          </div>
        </div>
      );
    }
    if (actorType === "student") {
      return (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 w-64 text-wrap">
          <div className="text-sm text-zinc-600">Geen studenten gevonden</div>
        </div>
      );
    }
    return (
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 w-64 text-wrap">
        <div className="text-sm text-zinc-600">Geen personen gevonden</div>
      </div>
    );
  };

  if (showEmptyMessage && !value && !query) {
    return (
      <>
        <input type="hidden" name={name} value={value} />
        <div className="w-full">{getEmptyMessage()}</div>
      </>
    );
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Combobox
        options={personsItems}
        value={selectedPerson}
        onChange={(person) => {
          const newValue = person?.id || "";
          setValue(newValue);
          onSelect?.(newValue);
        }}
        displayValue={(person) => (person ? formatPersonName(person) : "")}
        setQuery={setQuery}
        filter={() => true}
        placeholder={placeholder}
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
    </>
  );
}

// Separate component for beoordelaar selection
function BeoordelaarCombobox({
  locationId,
  placeholder,
  name,
  value: parentValue,
  onSelect,
}: {
  locationId: string;
  placeholder: string;
  name: string;
  value?: string;
  onSelect?: (personId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(parentValue || "");

  // Sync with parent value changes
  useEffect(() => {
    setValue(parentValue || "");
  }, [parentValue]);

  const { beoordelaars, isLoading } = useBeoordelaarsForLocation(locationId);

  // Filter beoordelaars based on query
  const filteredBeoordelaars = beoordelaars.filter((b) => {
    if (!query) return true;
    const fullName = formatPersonName(b);
    return (
      fullName.toLowerCase().includes(query.toLowerCase()) ||
      b.email?.toLowerCase().includes(query.toLowerCase()) ||
      false
    );
  });

  const selectedBeoordelaar =
    filteredBeoordelaars.find((b) => b.id === value) || null;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Spinner className="h-4 w-4 text-zinc-600" />
        <Text className="text-sm text-zinc-600">Beoordelaars laden...</Text>
      </div>
    );
  }

  // Show empty state
  if (beoordelaars.length === 0 && !query) {
    return (
      <>
        <input type="hidden" name={name} value={value} />
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 w-64 text-wrap">
          <div className="text-sm font-medium text-amber-900">
            Er zijn geen beoordelaars gevonden op deze locatie
          </div>
          <div className="text-xs text-amber-700 mt-1">
            Beoordelaars zijn personen die een kwalificatieprofiel met richting
            'pvb_beoordelaar' hebben afgerond.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Combobox
        options={filteredBeoordelaars}
        value={selectedBeoordelaar}
        onChange={(beoordelaar) => {
          const newValue = beoordelaar?.id || "";
          setValue(newValue);
          onSelect?.(newValue);
        }}
        displayValue={(beoordelaar) =>
          beoordelaar ? formatPersonName(beoordelaar) : ""
        }
        setQuery={setQuery}
        filter={() => true}
        placeholder={placeholder}
      >
        {(beoordelaar) => (
          <ComboboxOption key={beoordelaar.id} value={beoordelaar}>
            <ComboboxLabel>
              <div className="flex">
                <span className="truncate">
                  {formatPersonName(beoordelaar)}
                </span>
                {beoordelaar.email && (
                  <span className="ml-2 text-slate-500 group-data-active/option:text-white truncate">
                    ({beoordelaar.email})
                  </span>
                )}
              </div>
            </ComboboxLabel>
          </ComboboxOption>
        )}
      </Combobox>
    </>
  );
}

// Component for a single kandidaat row
function KandidaatRow({
  index,
  personId,
  personName,
  locationId,
  onRemove,
  onCopyField,
  globalLeercoach,
  globalBeoordelaar,
}: {
  index: number;
  personId: string;
  personName: string;
  locationId: string;
  onRemove: () => void;
  onCopyField: (field: string, value: string) => void;
  globalLeercoach?: string;
  globalBeoordelaar?: string;
}) {
  const [leercoach, setLeercoach] = useState("");
  const [beoordelaar, setBeoordelaar] = useState("");

  // Update local state when global values change
  useEffect(() => {
    if (globalLeercoach !== undefined) {
      setLeercoach(globalLeercoach);
    }
  }, [globalLeercoach]);

  useEffect(() => {
    if (globalBeoordelaar !== undefined) {
      setBeoordelaar(globalBeoordelaar);
    }
  }, [globalBeoordelaar]);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {personName}
        <input
          type="hidden"
          name={`kandidaten[${index}].id`}
          value={personId}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <PersonCombobox
              locationId={locationId}
              actorType="instructor"
              placeholder="Selecteer leercoach..."
              name={`kandidaten[${index}].leercoach`}
              value={leercoach}
              onSelect={(value) => {
                setLeercoach(value);
              }}
            />
          </div>
          {leercoach && (
            <Button
              type="button"
              plain
              onClick={() => {
                onCopyField("leercoach", leercoach);
              }}
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
              placeholder="Selecteer beoordelaar..."
              name={`kandidaten[${index}].beoordelaar`}
              value={beoordelaar}
              onSelect={(value) => {
                setBeoordelaar(value);
              }}
            />
          </div>
          {beoordelaar && (
            <Button
              type="button"
              plain
              onClick={() => {
                onCopyField("beoordelaar", beoordelaar);
              }}
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
            name={`kandidaten[${index}].startDatumTijd`}
            className="flex-1"
          />
          <Button
            type="button"
            plain
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              const parent = e.currentTarget.parentElement;
              const input = parent?.querySelector(
                'input[type="datetime-local"]',
              ) as HTMLInputElement;

              if (input?.value) {
                onCopyField("startDatumTijd", input.value);
              } else {
                toast.error("Selecteer eerst een datum/tijd om te kopiëren");
              }
            }}
            title="Kopieer naar alle rijen"
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Button
          type="button"
          plain
          onClick={onRemove}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
          title="Verwijder kandidaat"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function CreatePvbForm({
  locationId,
  niveaus,
  courses,
  selectedNiveauId: initialNiveauId,
}: Props) {
  const params = useParams();
  const router = useRouter();

  // Minimal state - only for UI interactions
  const [selectedNiveauId, setSelectedNiveauId] = useState(initialNiveauId);
  const [kandidaten, setKandidaten] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [kandidaatSearchQuery, setKandidaatSearchQuery] = useState("");

  // State for tracking enabled kwalificatieprofielen
  const [enabledKwalificatieprofielen, setEnabledKwalificatieprofielen] =
    useState<Set<string>>(new Set());

  // Global copy states for "copy to all rows" functionality
  const [globalLeercoach, setGlobalLeercoach] = useState<string | undefined>();
  const [globalBeoordelaar, setGlobalBeoordelaar] = useState<
    string | undefined
  >();

  // Fetch kwalificatieprofielen based on selected niveau
  const { kwalificatieprofielen, isLoading: isLoadingKwalificatieprofielen } =
    useKwalificatieprofielenByNiveau(selectedNiveauId || null);

  // Initialize all kwalificatieprofielen as enabled when they load
  useEffect(() => {
    if (kwalificatieprofielen.length > 0) {
      setEnabledKwalificatieprofielen(
        new Set(kwalificatieprofielen.map((kp) => kp.id)),
      );
    }
  }, [kwalificatieprofielen]);

  // Toggle kwalificatieprofiel enabled state
  const toggleKwalificatieprofiel = (kpId: string) => {
    setEnabledKwalificatieprofielen((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(kpId)) {
        newSet.delete(kpId);
      } else {
        newSet.add(kpId);
      }
      return newSet;
    });
  };

  const { data: searchedInstructors } = usePersonsForLocation(locationId, {
    filter: {
      query: kandidaatSearchQuery,
      actorType: "instructor",
    },
  });

  // Handle undefined data during loading
  const searchedInstructorsItems = searchedInstructors?.items ?? [];

  const { execute, result, status } = useStateAction(createBulkPvbsAction, {
    onSuccess: ({ data }) => {
      if (data) {
        toast.success(data.message);
        router.push(`/locatie/${params.location}/pvb-aanvragen`);
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Er is een fout opgetreden");
    },
  });

  // Add kandidaat
  const addKandidaat = (person: Person) => {
    if (!kandidaten.some((k) => k.id === person.id)) {
      setKandidaten((prev) => [
        ...prev,
        { id: person.id, name: formatPersonName(person) },
      ]);
    }
    setKandidaatSearchQuery("");
  };

  // Remove kandidaat
  const removeKandidaat = (index: number) => {
    setKandidaten((prev) => prev.filter((_, i) => i !== index));
  };

  // Copy field value to all kandidaten
  const copyToAllRows = (field: string, value: string) => {
    if (field === "leercoach") {
      setGlobalLeercoach(value);
    } else if (field === "beoordelaar") {
      setGlobalBeoordelaar(value);
    } else if (field === "startDatumTijd") {
      // For datetime inputs, we still need to update DOM directly
      const form = document.querySelector("form");
      if (!form) {
        return;
      }

      let successCount = 0;
      kandidaten.forEach((_, index) => {
        const selector = `[name="kandidaten[${index}].${field}"]`;
        const input = form.querySelector(selector) as HTMLInputElement;

        if (input) {
          // For inputs, set value and trigger React's onChange
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;

          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, value);
            // Trigger React's synthetic event
            const event = new Event("input", { bubbles: true });
            input.dispatchEvent(event);
            // Also trigger change event for datetime inputs
            const changeEvent = new Event("change", { bubbles: true });
            input.dispatchEvent(changeEvent);
            successCount++;
          }
        }
      });

      if (successCount > 0) {
        toast.success(
          `Aanvangsdatum/tijd gekopieerd naar ${successCount} rij(en)`,
        );
      } else {
        toast.error("Kon aanvangsdatum/tijd niet kopiëren");
      }
    }

    const fieldLabel =
      field === "leercoach"
        ? "Leercoach"
        : field === "beoordelaar"
          ? "Beoordelaar"
          : field === "startDatumTijd"
            ? "Aanvangsdatum/tijd"
            : field;

    if (field !== "startDatumTijd") {
      toast.success(`${fieldLabel} gekopieerd naar alle rijen`);
    }

    // Reset global state after a short delay to allow all rows to update
    if (field === "leercoach" || field === "beoordelaar") {
      setTimeout(() => {
        if (field === "leercoach") {
          setGlobalLeercoach(undefined);
        } else {
          setGlobalBeoordelaar(undefined);
        }
      }, 100);
    }
  };

  const isLoading = status === "executing";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        execute({ locationHandle: params.location as string, formData });
      }}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="locationHandle"
        value={params.location as string}
      />

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
              name="courseConfig.niveauId"
              value={selectedNiveauId}
              onChange={(e) => setSelectedNiveauId(e.target.value)}
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
      {selectedNiveauId && (
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
            {isLoadingKwalificatieprofielen ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="text-zinc-600" />
                <Text className="ml-2 text-sm text-zinc-600">
                  Kwalificatieprofielen laden...
                </Text>
              </div>
            ) : kwalificatieprofielen.length === 0 ? (
              <div className="text-center py-8 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                <Text className="text-zinc-600 text-sm">
                  Geen kwalificatieprofielen gevonden voor dit niveau.
                </Text>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <Text className="text-sm text-zinc-600">
                    Voor elk kwalificatieprofiel moet een hoofdcursus
                    geselecteerd worden. De hoofdcursus bepaalt waar de PvB
                    plaatsvindt en welke beoordelaar bevoegd is.
                  </Text>
                  <div className="text-sm text-zinc-500 font-medium">
                    {enabledKwalificatieprofielen.size} van{" "}
                    {kwalificatieprofielen.length} actief
                  </div>
                </div>

                {enabledKwalificatieprofielen.size === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <Text className="text-red-700 text-sm font-medium">
                      Minimaal 1 kwalificatieprofiel moet actief zijn
                    </Text>
                  </div>
                )}

                <div className="space-y-4">
                  {kwalificatieprofielen.map((kp, originalIndex) => {
                    const isEnabled = enabledKwalificatieprofielen.has(kp.id);
                    const canDisable = enabledKwalificatieprofielen.size > 1;

                    // Calculate the form index based on enabled kwalificatieprofielen only
                    const enabledKpsBefore = kwalificatieprofielen
                      .slice(0, originalIndex)
                      .filter((otherKp) =>
                        enabledKwalificatieprofielen.has(otherKp.id),
                      );
                    const formIndex = enabledKpsBefore.length;

                    return (
                      <KwalificatieprofielCard
                        key={kp.id}
                        kp={kp}
                        kpIndex={formIndex}
                        courses={courses}
                        isEnabled={isEnabled}
                        onToggle={() => toggleKwalificatieprofiel(kp.id)}
                        canDisable={canDisable}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Algemene Opmerkingen */}
      {selectedNiveauId && kwalificatieprofielen.length > 0 && (
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
                name="courseConfig.opmerkingen"
                rows={3}
                placeholder="Optionele opmerkingen die gelden voor alle aanvragen..."
                className="mt-1"
              />
            </Field>
          </div>
        </div>
      )}

      {/* Step 4: Kandidaten beheren */}
      {selectedNiveauId && kwalificatieprofielen.length > 0 && (
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
                    options={searchedInstructorsItems}
                    value={null}
                    onChange={(person) => person && addKandidaat(person)}
                    displayValue={() => ""}
                    setQuery={setKandidaatSearchQuery}
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
                </div>
              </div>
            </Field>

            {/* Configuration Table */}
            {kandidaten.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Text className="font-medium text-sm">
                    Kandidaten configuratie ({kandidaten.length})
                  </Text>
                </div>

                <div className="overflow-x-auto">
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
                      {kandidaten.map((kandidaat, index) => (
                        <KandidaatRow
                          key={kandidaat.id}
                          index={index}
                          personId={kandidaat.id}
                          personName={kandidaat.name}
                          locationId={locationId}
                          onRemove={() => removeKandidaat(index)}
                          onCopyField={copyToAllRows}
                          globalLeercoach={globalLeercoach}
                          globalBeoordelaar={globalBeoordelaar}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Empty state */}
            {kandidaten.length === 0 && (
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
            kandidaten.length === 0 ||
            enabledKwalificatieprofielen.size === 0
          }
        >
          {isLoading && <Spinner className="text-white" />}
          PvB aanvragen aanmaken ({kandidaten.length})
        </Button>
      </div>
    </form>
  );
}
