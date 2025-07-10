"use client";

import { Disclosure } from "@headlessui/react";
import {
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Code } from "~/app/(dashboard)/_components/text";
import type { getPersonKwalificaties } from "~/app/_actions/kss/manage-kwalificaties";
import type { listCourses } from "~/lib/nwd";
import AddKwalificatieDialog from "./add-kwalificatie-dialog";
import RemoveKwalificatieDialog from "./remove-kwalificatie-dialog";

type Kwalificatie = Awaited<ReturnType<typeof getPersonKwalificaties>>[number];
type Course = Awaited<ReturnType<typeof listCourses>>[number];

interface GroupedKwalificaties {
  richting: string;
  courses: {
    courseId: string;
    courseTitle: string | null;
    courseHandle: string;
    kwalificaties: Kwalificatie[];
  }[];
}

export default function KwalificatiesTable({
  personId,
  detailedKwalificaties: kwalificaties,
  courses,
}: {
  personId: string;
  detailedKwalificaties: Kwalificatie[];
  courses: Course[];
}) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedKwalificatie, setSelectedKwalificatie] =
    useState<Kwalificatie | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  // Group kwalificaties by richting and course
  const groupedKwalificaties: GroupedKwalificaties[] = kwalificaties.reduce(
    (acc, kwal) => {
      let richtingGroup = acc.find((g) => g.richting === kwal.richting);
      if (!richtingGroup) {
        richtingGroup = { richting: kwal.richting, courses: [] };
        acc.push(richtingGroup);
      }

      let courseGroup = richtingGroup.courses.find(
        (c) => c.courseId === kwal.courseId,
      );
      if (!courseGroup) {
        courseGroup = {
          courseId: kwal.courseId,
          courseTitle: kwal.courseTitle,
          courseHandle: kwal.courseHandle,
          kwalificaties: [],
        };
        richtingGroup.courses.push(courseGroup);
      }

      courseGroup.kwalificaties.push(kwal);
      return acc;
    },
    [] as GroupedKwalificaties[],
  );

  const handleRemove = (kwalificatie: Kwalificatie) => {
    setSelectedKwalificatie(kwalificatie);
    setIsRemoveDialogOpen(true);
  };

  const getVerkregenRedenLabel = (reden: string) => {
    switch (reden) {
      case "pvb_behaald":
        return "PVB behaald";
      case "pvb_instructiegroep_basis":
        return "PVB instructiegroep basis";
      case "onbekend":
        return "Onbekend";
      default:
        return reden;
    }
  };

  return (
    <div className="mt-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Kwalificaties
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Beheer de behaalde kwalificaties van deze persoon
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="mt-3 sm:mt-0"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Kwalificatie toevoegen
        </Button>
      </div>

      <div className="space-y-4">
        {groupedKwalificaties.map((richtingGroup) => (
          <div
            key={richtingGroup.richting}
            className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:px-6">
              <h4 className="text-base font-medium text-gray-900 dark:text-white capitalize">
                {richtingGroup.richting}
              </h4>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              {richtingGroup.courses.map((courseGroup) => (
                <Disclosure key={courseGroup.courseId}>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="w-full px-4 py-4 sm:px-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ChevronRightIcon
                              className={`${
                                open ? "rotate-90 transform" : ""
                              } h-5 w-5 text-gray-400 mr-2 transition-transform`}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {courseGroup.courseTitle ||
                                  courseGroup.courseHandle}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                <Code>{courseGroup.courseHandle}</Code> •{" "}
                                {courseGroup.kwalificaties.length} kwalificatie
                                {courseGroup.kwalificaties.length !== 1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Disclosure.Button>
                      <Disclosure.Panel className="border-t border-gray-200 dark:border-gray-700">
                        <table className="min-w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Kwalificatieprofiel
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Kerntaak
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Verkregen reden
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Niveau
                              </th>
                              <th className="relative px-6 py-3">
                                <span className="sr-only">Acties</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {courseGroup.kwalificaties.map((kwal) => (
                              <tr key={kwal.kerntaakOnderdeelId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                  {kwal.kwalificatieprofielTitel}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                  {kwal.kerntaakTitel}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      kwal.kerntaakOnderdeelType === "portfolio"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                                        : "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                    }`}
                                  >
                                    {kwal.kerntaakOnderdeelType}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                  {getVerkregenRedenLabel(kwal.verkregenReden)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                  {kwal.niveau}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    type="button"
                                    onClick={() => handleRemove(kwal)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AddKwalificatieDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        personId={personId}
        courses={courses}
      />
      <RemoveKwalificatieDialog
        isOpen={isRemoveDialogOpen}
        onClose={() => setIsRemoveDialogOpen(false)}
        kwalificatie={selectedKwalificatie}
        personId={personId}
      />
    </div>
  );
}
