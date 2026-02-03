"use client";
import { PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import {
  addCourseToInstructiegroep,
  removeCourseFromInstructiegroep,
  updateInstructiegroep,
} from "~/app/_actions/kss/instructiegroep";
import { Badge } from "~/app/(dashboard)/_components/badge";
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
  DialogTitle,
} from "~/app/(dashboard)/_components/dialog";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Input } from "~/app/(dashboard)/_components/input";
import { Text } from "~/app/(dashboard)/_components/text";

type Instructiegroep = {
  id: string;
  title: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  courses: Array<{
    id: string;
    handle: string;
    title: string | null;
    code: string | null;
  }>;
};

type Course = {
  id: string;
  title: string;
  handle: string;
};

const formatRichting = (richting: string) => {
  switch (richting) {
    case "instructeur":
      return "Instructeur";
    case "leercoach":
      return "Leercoach";
    case "pvb_beoordelaar":
      return "PvB Beoordelaar";
    default:
      return richting;
  }
};

interface InstructiegroepDialogProps {
  instructiegroep: Instructiegroep;
  isOpen: boolean;
  onClose: () => void;
  availableCourses: Course[];
}

export default function InstructiegroepDialog({
  instructiegroep,
  isOpen,
  onClose,
  availableCourses,
}: InstructiegroepDialogProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState(instructiegroep.title);
  const [isAddCourseMode, setIsAddCourseMode] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(
    new Set(),
  );

  const updateAction = useAction(updateInstructiegroep, {
    onSuccess: () => {
      toast.success("Instructiegroep bijgewerkt");
      setIsEditMode(false);
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Er is iets misgegaan");
    },
  });

  const addCourseAction = useAction(addCourseToInstructiegroep, {
    onSuccess: () => {
      toast.success("Cursus toegevoegd");
      setIsAddCourseMode(false);
      setSelectedCourseIds(new Set());
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Er is iets misgegaan");
    },
  });

  const removeCourseAction = useAction(removeCourseFromInstructiegroep, {
    onSuccess: () => {
      toast.success("Cursus verwijderd");
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Er is iets misgegaan");
    },
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedTitle.trim()) return;

    await updateAction.executeAsync({
      id: instructiegroep.id,
      title: editedTitle,
    });
  };

  const handleAddCourses = async () => {
    if (selectedCourseIds.size === 0) return;

    for (const courseId of selectedCourseIds) {
      await addCourseAction.executeAsync({
        instructieGroepId: instructiegroep.id,
        courseId,
      });
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    if (!confirm("Weet je zeker dat je deze cursus wilt verwijderen?")) {
      return;
    }

    await removeCourseAction.executeAsync({
      instructieGroepId: instructiegroep.id,
      courseId,
    });
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

  const handleClose = () => {
    setIsEditMode(false);
    setIsAddCourseMode(false);
    setEditedTitle(instructiegroep.title);
    setSelectedCourseIds(new Set());
    onClose();
  };

  // Filter out courses that are already in the instructiegroep
  const existingCourseIds = new Set(instructiegroep.courses.map((c) => c.id));
  const filteredAvailableCourses = availableCourses.filter(
    (course) => !existingCourseIds.has(course.id),
  );

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>
        {isEditMode ? (
          <form onSubmit={handleUpdate} className="flex items-center gap-2">
            <Input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="flex-1"
              required
            />
            <Button
              type="submit"
              color="branding-orange"
              disabled={updateAction.status === "executing"}
            >
              Opslaan
            </Button>
            <Button
              type="button"
              plain
              onClick={() => {
                setIsEditMode(false);
                setEditedTitle(instructiegroep.title);
              }}
            >
              Annuleren
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <span>{instructiegroep.title}</span>
            <Button plain onClick={() => setIsEditMode(true)}>
              Bewerken
            </Button>
          </div>
        )}
      </DialogTitle>

      <DialogBody>
        <div className="mb-4">
          <Badge color="blue">{formatRichting(instructiegroep.richting)}</Badge>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cursussen ({instructiegroep.courses.length})
            </h4>
            {!isAddCourseMode && (
              <Button
                plain
                onClick={() => setIsAddCourseMode(true)}
                className="text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                Cursus toevoegen
              </Button>
            )}
          </div>

          {isAddCourseMode ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h5 className="text-sm font-medium mb-3">
                Selecteer cursussen om toe te voegen
              </h5>
              {filteredAvailableCourses.length > 0 ? (
                <>
                  <CheckboxGroup className="space-y-1 max-h-64 overflow-y-auto border border-zinc-200 rounded-md p-2">
                    {filteredAvailableCourses.map((course) => (
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
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      plain
                      onClick={() => {
                        setIsAddCourseMode(false);
                        setSelectedCourseIds(new Set());
                      }}
                    >
                      Annuleren
                    </Button>
                    <Button
                      color="branding-orange"
                      onClick={handleAddCourses}
                      disabled={
                        selectedCourseIds.size === 0 ||
                        addCourseAction.status === "executing"
                      }
                    >
                      Toevoegen ({selectedCourseIds.size})
                    </Button>
                  </div>
                </>
              ) : (
                <Text className="text-sm text-gray-500">
                  Geen cursussen beschikbaar om toe te voegen.
                </Text>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {instructiegroep.courses.length > 0 ? (
                instructiegroep.courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {course.title || "Geen titel"}
                      </div>
                      {course.code && (
                        <div className="text-sm text-gray-500">
                          Code: {course.code}
                        </div>
                      )}
                    </div>
                    <Button
                      plain
                      onClick={() => handleRemoveCourse(course.id)}
                      disabled={removeCourseAction.status === "executing"}
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))
              ) : (
                <Text className="text-sm text-gray-500 text-center py-4">
                  Geen cursussen toegevoegd aan deze instructiegroep.
                </Text>
              )}
            </div>
          )}
        </div>
      </DialogBody>

      <DialogActions>
        <Button plain onClick={handleClose}>
          Sluiten
        </Button>
      </DialogActions>
    </Dialog>
  );
}
