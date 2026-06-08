"use client";

import { TrashIcon } from "@heroicons/react/16/solid";
import { useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import dayjs from "~/lib/dayjs";
import type { listCertificatesForPersonAsAdmin } from "~/lib/nwd";
import AddNwdCDialog from "./add-nwd-c-dialog";
import RemoveNwdCDialog from "./remove-nwd-c-dialog";

type Certificate = Awaited<
  ReturnType<typeof listCertificatesForPersonAsAdmin>
>[number];

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

interface GroupedByDiscipline {
  disciplineTitle: string;
  certificates: Certificate[];
}

export function EigenvaardigheidOverviewClient({
  personId,
  certificates,
  programs,
  locations,
  existingNwdCKeys,
}: {
  personId: string;
  certificates: Certificate[];
  programs: NwdCProgram[];
  locations: LocationOption[];
  existingNwdCKeys: ExistingNwdCKey[];
}) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [certificateToRemove, setCertificateToRemove] =
    useState<Certificate | null>(null);

  const grouped: GroupedByDiscipline[] = certificates.reduce((acc, cert) => {
    const disciplineTitle = cert.program.course.discipline.title ?? "Onbekend";
    let group = acc.find((g) => g.disciplineTitle === disciplineTitle);
    if (!group) {
      group = { disciplineTitle, certificates: [] };
      acc.push(group);
    }
    group.certificates.push(cert);
    return acc;
  }, [] as GroupedByDiscipline[]);

  return (
    <div className="mt-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Eigenvaardigheid
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Behaalde NWD-diploma&apos;s van deze persoon
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          NWD-C registreren
        </Button>
      </div>

      {certificates.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Geen NWD-diploma&apos;s gevonden.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div
              key={group.disciplineTitle}
              className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"
            >
              <div className="px-4 py-5 sm:px-6">
                <h4 className="text-base font-medium text-gray-900 dark:text-white capitalize">
                  {group.disciplineTitle}
                </h4>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Niveau
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Vaartuig
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Behaald op
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Locatie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Opmerkingen
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {group.certificates.map((cert) => {
                      const isNwdC =
                        cert.program.degree.handle === "niveau-c";

                      return (
                        <tr key={cert.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {cert.program.degree.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {cert.gearType.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {dayjs(cert.issuedAt).format("DD-MM-YYYY")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {cert.location.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                            {cert.opmerkingen ? (
                              <span className="line-clamp-2">
                                {cert.opmerkingen}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {isNwdC ? (
                              <button
                                type="button"
                                onClick={() => setCertificateToRemove(cert)}
                                className="inline-flex items-center text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="NWD-C intrekken"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddNwdCDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        personId={personId}
        programs={programs}
        locations={locations}
        existingNwdCKeys={existingNwdCKeys}
      />

      <RemoveNwdCDialog
        isOpen={certificateToRemove !== null}
        onClose={() => setCertificateToRemove(null)}
        personId={personId}
        certificate={certificateToRemove}
      />
    </div>
  );
}
