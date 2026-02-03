"use client";

import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { toast } from "sonner";
import {
  addPvbCourseAction,
  removePvbCourseAction,
} from "~/app/_actions/pvb/course-management-action";
import Spinner from "~/app/_components/spinner";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Text } from "~/app/(dashboard)/_components/text";
import { useInstructiegroepByCourse } from "~/app/(dashboard)/_hooks/swr/use-instructiegroep-by-course";

interface Course {
  id: string;
  title: string | null;
  code: string | null;
  isMainCourse: boolean;
}

interface Props {
  pvbAanvraagId: string;
  locationHandle: string;
  existingCourses: Course[];
  status: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
}

export function CursussenPerKwalificatieprofiel({
  pvbAanvraagId,
  locationHandle,
  existingCourses,
  status,
  richting,
}: Props) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    new Set(),
  );

  const canEdit = [
    "concept",
    "wacht_op_voorwaarden",
    "gereed_voor_beoordeling",
  ].includes(status);
  const hoofdcursus = existingCourses.find((course) => course.isMainCourse);
  const aanvullendeCursussen = existingCourses.filter(
    (course) => !course.isMainCourse,
  );

  // Throw error if no hoofdcursus is found
  if (!hoofdcursus) {
    throw new Error("PvB aanvraag heeft geen hoofdcursus");
  }

  // Fetch instructiegroep data based on hoofdcursus
  const { instructiegroep, isLoading: isLoadingInstructiegroep } =
    useInstructiegroepByCourse(hoofdcursus.id, richting);

  // Get available courses from instructiegroep
  const availableCourses =
    instructiegroep?.courses?.filter(
      (course) =>
        course.id !== hoofdcursus.id && // Exclude the hoofdcursus
        !existingCourses.some((ec) => ec.id === course.id), // Exclude already added courses
    ) || [];

  const handleAddCourses = async () => {
    if (selectedCourseIds.size === 0 || !instructiegroep) return;

    try {
      // Add each selected course
      const promises = Array.from(selectedCourseIds).map((courseId) =>
        addPvbCourseAction({
          locationHandle,
          pvbAanvraagId,
          courseId,
          instructieGroepId: instructiegroep.id,
          isMainCourse: false,
        }),
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r?.serverError);

      if (errors.length > 0) {
        console.log("ERRORS", errors);
        toast.error(
          `${errors.length} cursus(sen) konden niet worden toegevoegd`,
        );
      } else {
        toast.success(
          `${selectedCourseIds.size} cursus(sen) succesvol toegevoegd`,
        );
        setIsAddDialogOpen(false);
        setSelectedCourseIds(new Set());
      }
    } catch (_error) {
      toast.error("Er is een fout opgetreden");
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    if (!instructiegroep) return;

    try {
      const result = await removePvbCourseAction({
        locationHandle,
        pvbAanvraagId,
        courseId,
        instructieGroepId: instructiegroep.id,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        toast.success("Cursus verwijderd");
      }
    } catch (_error) {
      toast.error("Er is een fout opgetreden");
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      {/* Hoofdcursus display (non-editable) */}
      <div>
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hoofdcursus
        </h5>
        <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {hoofdcursus.code &&
              hoofdcursus.code !== "-" &&
              `${hoofdcursus.code} - `}
            {hoofdcursus.title || "Geen titel"}
          </span>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Aanpassing vereist intrekken aanvraag
          </p>
        </div>
      </div>

      {/* Aanvullende cursussen */}
      {instructiegroep && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Aanvullende cursussen
            </h5>
            {aanvullendeCursussen.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {aanvullendeCursussen.length} cursus
                {aanvullendeCursussen.length !== 1 ? "sen" : ""}
              </span>
            )}
          </div>
          {aanvullendeCursussen.length > 0 ? (
            <ul className="space-y-1.5">
              {aanvullendeCursussen.map((course) => (
                <li
                  key={course.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {course.code && course.code !== "-" && `${course.code} - `}
                    {course.title || "Geen titel"}
                  </span>
                  {canEdit && (
                    <Button
                      plain
                      onClick={() => handleRemoveCourse(course.id)}
                      className="opacity-70 hover:opacity-100"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                      <span className="sr-only">Verwijder cursus</span>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Geen aanvullende cursussen
            </p>
          )}
        </div>
      )}

      {canEdit && instructiegroep && (
        <Button
          outline
          onClick={() => setIsAddDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <PlusIcon data-slot="icon" />
          Cursussen toevoegen
        </Button>
      )}

      <Dialog open={isAddDialogOpen} onClose={setIsAddDialogOpen}>
        <DialogBody>
          <DialogTitle>Aanvullende cursussen selecteren</DialogTitle>
          <DialogDescription>
            Geselecteerde cursussen ontvangen dezelfde kwalificaties bij
            succesvol behalen van de PvB.
          </DialogDescription>

          <div className="mt-4">
            {isLoadingInstructiegroep ? (
              <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded">
                <Spinner className="h-4 w-4 text-zinc-600" />
                <Text className="text-sm text-zinc-600">
                  Cursussen laden...
                </Text>
              </div>
            ) : availableCourses.length > 0 ? (
              <>
                <CheckboxGroup className="space-y-1 max-h-64 overflow-y-auto border border-zinc-200 rounded-md p-2">
                  {availableCourses.map((course) => (
                    <CheckboxField
                      key={course.id}
                      className="py-2 px-3 rounded hover:bg-zinc-50"
                    >
                      <Checkbox
                        checked={selectedCourseIds.has(course.id)}
                        onChange={() => toggleCourseSelection(course.id)}
                        className="h-4 w-4 flex-shrink-0"
                      />
                      <Label className="text-sm text-zinc-700 cursor-pointer">
                        {course.title}
                      </Label>
                    </CheckboxField>
                  ))}
                </CheckboxGroup>
                <Text className="text-xs text-zinc-500 mt-2">
                  Selecteer alleen cursussen waarin de kandidaat bekwaam is.
                </Text>
              </>
            ) : (
              <div className="p-3 bg-zinc-50 rounded border border-zinc-100">
                <Text className="text-sm text-zinc-500">
                  Geen cursussen beschikbaar.
                </Text>
              </div>
            )}
          </div>

          <DialogActions>
            <Button
              plain
              onClick={() => {
                setIsAddDialogOpen(false);
                setSelectedCourseIds(new Set());
              }}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleAddCourses}
              disabled={selectedCourseIds.size === 0}
            >
              Toevoegen ({selectedCourseIds.size})
            </Button>
          </DialogActions>
        </DialogBody>
      </Dialog>
    </div>
  );
}
