"use client";

import { Combobox, Dialog, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Fragment, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "~/app/(dashboard)/_components/button";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Select } from "~/app/(dashboard)/_components/select";
import { Code } from "~/app/(dashboard)/_components/text";
import {
  addKwalificatieAction,
  getAvailableKerntaakonderdelen,
} from "~/app/_actions/kss/manage-kwalificaties";
import type { listCourses } from "~/lib/nwd";

type KerntaakOnderdeel = Awaited<
  ReturnType<typeof getAvailableKerntaakonderdelen>
>[number];
type Course = Awaited<ReturnType<typeof listCourses>>[number];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Toevoegen..." : "Toevoegen"}
    </Button>
  );
}

export default function AddKwalificatieDialog({
  isOpen,
  onClose,
  personId,
  courses,
}: {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  courses: Course[];
}) {
  const [kerntaakonderdelen, setKerntaakonderdelen] = useState<
    KerntaakOnderdeel[]
  >([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedOnderdeel, setSelectedOnderdeel] =
    useState<KerntaakOnderdeel | null>(null);
  const [verkregenReden, setVerkregenReden] = useState<
    "onbekend" | "pvb_instructiegroep_basis"
  >("onbekend");
  const [opmerkingen, setOpmerkingen] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [onderdeelQuery, setOnderdeelQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      startTransition(async () => {
        try {
          const onderdelenData = await getAvailableKerntaakonderdelen();
          setKerntaakonderdelen(onderdelenData);
        } finally {
          setIsLoading(false);
        }
      });
    }
  }, [isOpen]);

  const filteredCourses =
    courseQuery === ""
      ? courses
      : courses.filter(
          (course) =>
            (course.title?.toLowerCase().includes(courseQuery.toLowerCase()) ??
              false) ||
            course.handle.toLowerCase().includes(courseQuery.toLowerCase()),
        );

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourse || !selectedOnderdeel) return;

    const formData = new FormData(e.currentTarget);

    const result = await addKwalificatieAction({
      personId,
      courseId: selectedCourse.id,
      kerntaakOnderdeelId: selectedOnderdeel.id,
      verkregenReden,
      opmerkingen: opmerkingen || undefined,
    });

    if (result?.data?.success) {
      onClose();
      // Reset form
      setSelectedCourse(null);
      setSelectedOnderdeel(null);
      setVerkregenReden("onbekend");
      setOpmerkingen("");
      setCourseQuery("");
      setOnderdeelQuery("");
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <form onSubmit={handleSubmit}>
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                  >
                    Kwalificatie toevoegen
                  </Dialog.Title>

                  {isLoading ? (
                    <div className="text-center py-4">Laden...</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Course selector */}
                      <div>
                        <Label htmlFor="course">Cursus</Label>
                        <Combobox
                          value={selectedCourse}
                          onChange={setSelectedCourse}
                        >
                          <div className="relative mt-1">
                            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-700 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                              <Combobox.Input
                                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 bg-transparent focus:ring-0"
                                displayValue={(course: Course | null) =>
                                  course?.title || ""
                                }
                                onChange={(event) =>
                                  setCourseQuery(event.target.value)
                                }
                                placeholder="Zoek een cursus..."
                              />
                              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon
                                  className="h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
                              </Combobox.Button>
                            </div>
                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                              afterLeave={() => setCourseQuery("")}
                            >
                              <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                {filteredCourses.length === 0 &&
                                courseQuery !== "" ? (
                                  <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                    Geen cursussen gevonden.
                                  </div>
                                ) : (
                                  filteredCourses.map((course) => (
                                    <Combobox.Option
                                      key={course.id}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                          active
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-900 dark:text-gray-100"
                                        }`
                                      }
                                      value={course}
                                    >
                                      {({ selected, active }) => (
                                        <>
                                          <span
                                            className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                          >
                                            {course.title || course.handle}
                                          </span>
                                          <span
                                            className={`block text-sm ${active ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}
                                          >
                                            <Code>{course.handle}</Code>
                                          </span>
                                          {selected ? (
                                            <span
                                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                active
                                                  ? "text-white"
                                                  : "text-blue-600"
                                              }`}
                                            >
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Combobox.Option>
                                  ))
                                )}
                              </Combobox.Options>
                            </Transition>
                          </div>
                        </Combobox>
                      </div>

                      {/* Kerntaak onderdeel selector */}
                      <div>
                        <Label htmlFor="onderdeel">Kerntaak onderdeel</Label>
                        <Combobox
                          value={selectedOnderdeel}
                          onChange={setSelectedOnderdeel}
                        >
                          <div className="relative mt-1">
                            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-700 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
                              <Combobox.Input
                                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 bg-transparent focus:ring-0"
                                displayValue={(
                                  onderdeel: KerntaakOnderdeel | null,
                                ) =>
                                  onderdeel
                                    ? `${onderdeel.kwalificatieprofielTitel} - ${onderdeel.kerntaakTitel}`
                                    : ""
                                }
                                onChange={(event) =>
                                  setOnderdeelQuery(event.target.value)
                                }
                                placeholder="Zoek een kerntaak onderdeel..."
                              />
                              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon
                                  className="h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
                              </Combobox.Button>
                            </div>
                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                              afterLeave={() => setOnderdeelQuery("")}
                            >
                              <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                                {filteredOnderdelen.length === 0 &&
                                onderdeelQuery !== "" ? (
                                  <div className="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-gray-300">
                                    Geen onderdelen gevonden.
                                  </div>
                                ) : (
                                  filteredOnderdelen.map((onderdeel) => (
                                    <Combobox.Option
                                      key={onderdeel.id}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                          active
                                            ? "bg-blue-600 text-white"
                                            : "text-gray-900 dark:text-gray-100"
                                        }`
                                      }
                                      value={onderdeel}
                                    >
                                      {({ selected, active }) => (
                                        <>
                                          <div>
                                            <span
                                              className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                                            >
                                              {
                                                onderdeel.kwalificatieprofielTitel
                                              }
                                            </span>
                                            <span
                                              className={`block text-sm ${active ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}
                                            >
                                              {onderdeel.kerntaakTitel} •{" "}
                                              {onderdeel.type} • Niveau{" "}
                                              {onderdeel.niveau}
                                            </span>
                                          </div>
                                          {selected ? (
                                            <span
                                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                active
                                                  ? "text-white"
                                                  : "text-blue-600"
                                              }`}
                                            >
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Combobox.Option>
                                  ))
                                )}
                              </Combobox.Options>
                            </Transition>
                          </div>
                        </Combobox>
                      </div>

                      {/* Verkregen reden */}
                      <div>
                        <Label htmlFor="verkregenReden">Verkregen reden</Label>
                        <Select
                          id="verkregenReden"
                          name="verkregenReden"
                          value={verkregenReden}
                          onChange={(e) =>
                            setVerkregenReden(
                              e.target.value as
                                | "onbekend"
                                | "pvb_instructiegroep_basis",
                            )
                          }
                          className="mt-1"
                        >
                          <option value="onbekend">Onbekend</option>
                          <option value="pvb_instructiegroep_basis">
                            PVB instructiegroep basis
                          </option>
                        </Select>
                      </div>

                      {/* Opmerkingen */}
                      <div>
                        <Label htmlFor="opmerkingen">
                          Opmerkingen (optioneel)
                        </Label>
                        <textarea
                          id="opmerkingen"
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                          value={opmerkingen}
                          onChange={(e) => setOpmerkingen(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <SubmitButton />
                    <Button type="button" outline onClick={onClose}>
                      Annuleren
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
