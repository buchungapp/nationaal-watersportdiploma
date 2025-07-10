"use client";

import { parseAsString, useQueryState } from "nuqs";
import { use, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
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
import {
  addBulkKwalificatiesAction,
  type getAvailableKerntaakonderdelen,
} from "~/app/_actions/kss/manage-kwalificaties";
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
  existingKerntaakOnderdeelIdsPromise,
}: {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  courses: Course[];
  kerntaakonderdelenPromise: Promise<KerntaakOnderdeel[]>;
  existingKerntaakOnderdeelIdsPromise: Promise<string[]>;
}) {
  // Use React.use() to unwrap the promises
  const kerntaakonderdelen = use(kerntaakonderdelenPromise);
  const existingKerntaakOnderdeelIds = use(existingKerntaakOnderdeelIdsPromise);

  // Use nuqs for course selection
  const [selectedCourseId, setSelectedCourseId] = useQueryState(
    "course",
    parseAsString.withOptions({ shallow: false }),
  );
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;

  const [selectedOnderdelen, setSelectedOnderdelen] = useState<Set<string>>(
    new Set(),
  );
  const [verkregenReden, setVerkregenReden] = useState<
    "onbekend" | "pvb_instructiegroep_basis"
  >("onbekend");
  const [opmerkingen, setOpmerkingen] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [onderdeelQuery, setOnderdeelQuery] = useState("");

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
    if (selectedCourse && existingKerntaakOnderdeelIds.includes(onderdeelId)) {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourse || selectedOnderdelen.size === 0) return;

    const result = await addBulkKwalificatiesAction({
      personId,
      courseId: selectedCourse.id,
      kerntaakOnderdeelIds: Array.from(selectedOnderdelen),
      verkregenReden,
      opmerkingen: opmerkingen || undefined,
    });

    if (result?.data?.success) {
      const { added, skipped, total } = result.data;

      if (added > 0) {
        toast.success(
          `${added} kwalificatie${added > 1 ? "s" : ""} toegevoegd${
            skipped > 0
              ? ` (${skipped} bestond${skipped > 1 ? "en" : ""} al)`
              : ""
          }`,
        );
      } else if (skipped > 0) {
        toast.info(`Alle ${skipped} kwalificaties bestonden al`);
      }

      onClose();
      // Reset form
      setSelectedCourseId(null);
      setSelectedOnderdelen(new Set());
      setVerkregenReden("onbekend");
      setOpmerkingen("");
      setCourseQuery("");
      setOnderdeelQuery("");
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setSelectedCourseId(null);
    setSelectedOnderdelen(new Set());
    setVerkregenReden("onbekend");
    setOpmerkingen("");
    setCourseQuery("");
    setOnderdeelQuery("");
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} size="4xl">
      <DialogTitle>Kwalificaties toevoegen</DialogTitle>
      <DialogDescription>
        Selecteer een cursus en de kerntaken waarvoor je kwalificaties wilt
        toevoegen.
      </DialogDescription>

      <form onSubmit={handleSubmit}>
        <DialogBody>
          <Fieldset>
            {/* Course selector */}
            <Field>
              <Label htmlFor="course">Cursus</Label>
              <Combobox
                value={selectedCourse}
                onChange={(course) => setSelectedCourseId(course?.id || null)}
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
                          const isExisting =
                            selectedCourse &&
                            existingKerntaakOnderdeelIds.includes(onderdeel.id);
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
                                        (reeds behaald)
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
