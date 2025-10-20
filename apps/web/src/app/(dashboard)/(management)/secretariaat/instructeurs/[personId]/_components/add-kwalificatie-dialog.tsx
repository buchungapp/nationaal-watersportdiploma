"use client";

import { parseAsString, useQueryState } from "nuqs";
import { use, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
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
import { Select } from "~/app/(dashboard)/_components/select";
import { Code, Text } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { useInstructiegroepByCourse } from "~/app/(dashboard)/_hooks/swr/use-instructiegroep-by-course";
import {
  addBulkKwalificatiesAction,
  type getAvailableKerntaakonderdelen,
} from "~/app/_actions/kss/manage-kwalificaties";
import Spinner from "~/app/_components/spinner";
import type { listCourses } from "~/lib/nwd";

type KerntaakOnderdeel = Awaited<
  ReturnType<typeof getAvailableKerntaakonderdelen>
>[number];
type Course = Awaited<ReturnType<typeof listCourses>>[number];

function SubmitButton({ selectedCount }: { selectedCount: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || selectedCount === 0}>
      {pending
        ? "Toevoegen..."
        : selectedCount === 0
          ? "Selecteer kerntaken"
          : `${selectedCount} kwalificatie${selectedCount > 1 ? "s" : ""} toevoegen`}
    </Button>
  );
}

export default function AddKwalificatieDialog({
  isOpen,
  onClose,
  personId,
  courses,
  kerntaakonderdelenPromise,
  existingKerntaakOnderdeelIdsByCoursePromise,
}: {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  courses: Course[];
  kerntaakonderdelenPromise: Promise<KerntaakOnderdeel[]>;
  existingKerntaakOnderdeelIdsByCoursePromise: Promise<
    Record<string, string[]>
  >;
}) {
  // Use React.use() to unwrap the promises
  const kerntaakonderdelen = use(kerntaakonderdelenPromise);
  const existingKerntaakOnderdeelIdsByCourse = use(
    existingKerntaakOnderdeelIdsByCoursePromise,
  );

  // Use nuqs for course selection
  const [selectedCourseId, setSelectedCourseId] = useQueryState(
    "course",
    parseAsString.withOptions({ shallow: false }),
  );
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;

  const [selectedOnderdelen, setSelectedOnderdelen] = useState<Set<string>>(
    new Set(),
  );
  const [selectedAanvullendeCursussenIds, setSelectedAanvullendeCursussenIds] =
    useState<Set<string>>(new Set());
  const [verkregenReden, setVerkregenReden] = useState<
    "onbekend" | "pvb_instructiegroep_basis"
  >("onbekend");
  const [opmerkingen, setOpmerkingen] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [onderdeelQuery, setOnderdeelQuery] = useState("");

  // Fetch instructiegroep data when hoofdcursus is selected
  const { instructiegroep, isLoading: isLoadingInstructiegroep } =
    useInstructiegroepByCourse(
      selectedCourseId || null,
      "instructeur", // Using "instructeur" as the richting for instructor qualifications
    );

  // Get aanvullende cursussen from instructiegroep
  const aanvullendeCursussen =
    instructiegroep?.courses?.filter(
      (c) => c.id !== selectedCourseId && c.title,
    ) || [];

  const filteredOnderdelen =
    onderdeelQuery === ""
      ? kerntaakonderdelen
      : kerntaakonderdelen.filter(
          (onderdeel) =>
            onderdeel.kerntaakTitel
              .toLowerCase()
              .includes(onderdeelQuery.toLowerCase()) ||
            onderdeel.kwalificatieprofielTitel
              .toLowerCase()
              .includes(onderdeelQuery.toLowerCase()),
        );

  const toggleOnderdeel = (onderdeelId: string) => {
    // Don't allow selection of existing onderdelen
    if (
      selectedCourse &&
      existingKerntaakOnderdeelIdsByCourse[selectedCourse.id]?.includes(
        onderdeelId,
      )
    ) {
      return;
    }

    setSelectedOnderdelen((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(onderdeelId)) {
        newSet.delete(onderdeelId);
      } else {
        newSet.add(onderdeelId);
      }
      return newSet;
    });
  };

  const toggleAanvullendeCursus = (cursusId: string) => {
    setSelectedAanvullendeCursussenIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cursusId)) {
        newSet.delete(cursusId);
      } else {
        newSet.add(cursusId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourse || selectedOnderdelen.size === 0) return;

    // Prepare list of all courses to add kwalificaties to
    const allCourseIds = [
      selectedCourse.id,
      ...Array.from(selectedAanvullendeCursussenIds),
    ];

    let totalAdded = 0;
    let totalSkipped = 0;
    let failedCourses = 0;

    // Call the action for each course
    for (const courseId of allCourseIds) {
      try {
        const result = await addBulkKwalificatiesAction({
          personId,
          courseId,
          kerntaakOnderdeelIds: Array.from(selectedOnderdelen),
          verkregenReden,
          opmerkingen: opmerkingen || undefined,
        });

        if (result?.data?.success) {
          totalAdded += result.data.added || 0;
          totalSkipped += result.data.skipped || 0;
        } else {
          failedCourses++;
        }
      } catch (error) {
        failedCourses++;
        console.error(
          `Failed to add kwalificaties for course ${courseId}:`,
          error,
        );
      }
    }

    // Show appropriate success/error message
    if (failedCourses === 0) {
      if (totalAdded > 0) {
        toast.success(
          `${totalAdded} kwalificatie${totalAdded > 1 ? "s" : ""} toegevoegd${
            totalSkipped > 0
              ? ` (${totalSkipped} bestond${totalSkipped > 1 ? "en" : ""} al)`
              : ""
          } voor ${allCourseIds.length} cursus${allCourseIds.length > 1 ? "sen" : ""}`,
        );
      } else if (totalSkipped > 0) {
        toast.info(`Alle ${totalSkipped} kwalificaties bestonden al`);
      }
    } else {
      toast.error(
        `Er zijn fouten opgetreden bij ${failedCourses} van de ${allCourseIds.length} cursussen`,
      );
    }

    onClose();
    // Reset form
    setSelectedCourseId(null);
    setSelectedOnderdelen(new Set());
    setSelectedAanvullendeCursussenIds(new Set());
    setVerkregenReden("onbekend");
    setOpmerkingen("");
    setCourseQuery("");
    setOnderdeelQuery("");
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setSelectedCourseId(null);
    setSelectedOnderdelen(new Set());
    setSelectedAanvullendeCursussenIds(new Set());
    setVerkregenReden("onbekend");
    setOpmerkingen("");
    setCourseQuery("");
    setOnderdeelQuery("");
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} size="4xl">
      <DialogTitle>Kwalificaties toevoegen</DialogTitle>
      <DialogDescription>
        Selecteer een hoofdcursus en de kerntaken waarvoor je kwalificaties wilt
        toevoegen. Je kunt ook aanvullende cursussen selecteren waar dezelfde
        kwalificaties toegepast worden.
      </DialogDescription>

      <form onSubmit={handleSubmit}>
        <DialogBody>
          <Fieldset>
            {/* Course selector */}
            <Field>
              <Label htmlFor="course">Hoofdcursus</Label>
              <Combobox
                value={selectedCourse}
                onChange={(course) => {
                  setSelectedCourseId(course?.id || null);
                  // Reset aanvullende cursussen selection when hoofdcursus changes
                  setSelectedAanvullendeCursussenIds(new Set());
                }}
                options={courses}
                displayValue={(course) => course?.title || course?.handle || ""}
                filter={(course, query) =>
                  course
                    ? (course.title
                        ?.toLowerCase()
                        .includes(query.toLowerCase()) ??
                        false) ||
                      course.handle.toLowerCase().includes(query.toLowerCase())
                    : false
                }
                placeholder="Zoek een cursus..."
                setQuery={setCourseQuery}
              >
                {(course) => (
                  <ComboboxOption value={course}>
                    <div>
                      <div className="font-medium">
                        {course.title || course.handle}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        <Code>{course.handle}</Code>
                      </div>
                    </div>
                  </ComboboxOption>
                )}
              </Combobox>
            </Field>

            {/* Aanvullende Cursussen - only show when hoofdcursus is selected */}
            {selectedCourse && (
              <Field>
                <Label htmlFor="aanvullendeCursussen">
                  Aanvullende cursussen
                  <span className="text-sm font-normal text-zinc-500 ml-1">
                    (optioneel)
                  </span>
                </Label>
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
                        kwalificaties ook meteen toegepast op deze cursussen.
                      </Text>
                    </div>
                    <CheckboxGroup className="max-h-40 overflow-y-auto border border-zinc-950/10 rounded-lg bg-white dark:border-white/10 dark:bg-white/5 p-2">
                      {aanvullendeCursussen.map((course) => {
                        const existingCount =
                          existingKerntaakOnderdeelIdsByCourse[course.id]
                            ?.length || 0;
                        return (
                          <CheckboxField
                            key={course.id}
                            className="py-1 px-2 rounded hover:bg-zinc-50"
                          >
                            <Checkbox
                              checked={selectedAanvullendeCursussenIds.has(
                                course.id,
                              )}
                              onChange={() =>
                                toggleAanvullendeCursus(course.id)
                              }
                            />
                            <Label className="text-sm text-zinc-700 truncate cursor-pointer flex-1">
                              <div>
                                <div>{course.title}</div>
                                {existingCount > 0 && (
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {existingCount} bestaande kwalificatie
                                    {existingCount > 1 ? "s" : ""}
                                  </div>
                                )}
                              </div>
                            </Label>
                          </CheckboxField>
                        );
                      })}
                    </CheckboxGroup>
                    {selectedAanvullendeCursussenIds.size > 0 && (
                      <Text className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        {selectedAanvullendeCursussenIds.size} aanvullende
                        cursus
                        {selectedAanvullendeCursussenIds.size > 1 ? "sen" : ""}{" "}
                        geselecteerd
                      </Text>
                    )}
                  </>
                ) : (
                  <div className="p-3 bg-zinc-50/50 rounded border border-zinc-100">
                    <Text className="text-sm text-zinc-500">
                      Geen aanvullende cursussen beschikbaar voor deze
                      instructiegroep.
                    </Text>
                  </div>
                )}
              </Field>
            )}

            {/* Kerntaak onderdelen selector */}
            {selectedCourse && (
              <Field>
                <Label htmlFor="onderdelen">Kerntaken</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-zinc-950/10 bg-white px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] text-sm/6 text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-950/20 focus:outline-none focus:ring-4 focus:ring-zinc-950/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-400 dark:focus:border-white/20 dark:focus:ring-white/10"
                      placeholder="Zoek kerntaken..."
                      value={onderdeelQuery}
                      onChange={(e) => setOnderdeelQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-zinc-950/10 rounded-lg bg-white dark:border-white/10 dark:bg-white/5">
                    {filteredOnderdelen.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-zinc-500">
                        {onderdeelQuery
                          ? "Geen kerntaken gevonden."
                          : "Geen kerntaken beschikbaar."}
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-950/5 dark:divide-white/5">
                        {filteredOnderdelen.map((onderdeel) => {
                          // Check if this kerntaakonderdeel exists in any of the selected courses
                          const coursesWithThisOnderdeel: string[] = [];

                          // Check hoofdcursus
                          if (
                            selectedCourse &&
                            existingKerntaakOnderdeelIdsByCourse[
                              selectedCourse.id
                            ]?.includes(onderdeel.id)
                          ) {
                            coursesWithThisOnderdeel.push(
                              selectedCourse.title || selectedCourse.handle,
                            );
                          }

                          // Check aanvullende cursussen
                          for (const cursusId of selectedAanvullendeCursussenIds) {
                            if (
                              existingKerntaakOnderdeelIdsByCourse[
                                cursusId
                              ]?.includes(onderdeel.id)
                            ) {
                              const course = aanvullendeCursussen.find(
                                (c) => c.id === cursusId,
                              );
                              if (course) {
                                coursesWithThisOnderdeel.push(
                                  course.title || course.handle,
                                );
                              }
                            }
                          }

                          const isExisting =
                            coursesWithThisOnderdeel.length > 0;

                          return (
                            <CheckboxField
                              key={onderdeel.id}
                              className={`px-4 py-3 ${
                                isExisting
                                  ? "opacity-50 bg-zinc-50 dark:bg-zinc-800/50"
                                  : ""
                              }`}
                            >
                              <Checkbox
                                checked={selectedOnderdelen.has(onderdeel.id)}
                                onChange={() => toggleOnderdeel(onderdeel.id)}
                                disabled={isExisting}
                              />
                              <Label className="flex-1">
                                <div>
                                  <div className="font-medium">
                                    {onderdeel.kwalificatieprofielTitel}
                                    {isExisting && (
                                      <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                                        (reeds behaald in:{" "}
                                        {coursesWithThisOnderdeel.join(", ")})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {onderdeel.kerntaakTitel} • {onderdeel.type}{" "}
                                    • Niveau {onderdeel.niveau}
                                  </div>
                                </div>
                              </Label>
                            </CheckboxField>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {selectedOnderdelen.size > 0 && (
                    <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                      {/*  cSpell:ignore kerntaa */}
                      {selectedOnderdelen.size} kerntaa
                      {selectedOnderdelen.size > 1 ? "ken" : "k"} geselecteerd
                    </Text>
                  )}
                </div>
              </Field>
            )}

            {/* Verkregen reden */}
            <Field>
              <Label htmlFor="verkregenReden">Verkregen reden</Label>
              <Select
                id="verkregenReden"
                name="verkregenReden"
                value={verkregenReden}
                onChange={(e) =>
                  setVerkregenReden(
                    e.target.value as "onbekend" | "pvb_instructiegroep_basis",
                  )
                }
              >
                <option value="onbekend">Onbekend</option>
                <option value="pvb_instructiegroep_basis">
                  PVB instructiegroep basis
                </option>
              </Select>
            </Field>

            {/* Opmerkingen */}
            <Field>
              <Label htmlFor="opmerkingen">Opmerkingen (optioneel)</Label>
              <Textarea
                id="opmerkingen"
                rows={3}
                value={opmerkingen}
                onChange={(e) => setOpmerkingen(e.target.value)}
              />
            </Field>
          </Fieldset>
        </DialogBody>

        <DialogActions>
          <Button plain onClick={handleClose}>
            Annuleren
          </Button>
          <SubmitButton selectedCount={selectedOnderdelen.size} />
        </DialogActions>
      </form>
    </Dialog>
  );
}
