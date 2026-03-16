import dayjs from "~/lib/dayjs";
import { listCertificatesForPersonAsAdmin } from "~/lib/nwd";

type Certificate = Awaited<
  ReturnType<typeof listCertificatesForPersonAsAdmin>
>[number];

interface GroupedByDiscipline {
  courseTitle: string;
  certificates: Certificate[];
}

export async function EigenvaardigheidOverview({
  personId,
}: {
  personId: string;
}) {
  const certificates = await listCertificatesForPersonAsAdmin(personId);

  if (certificates.length === 0) {
    return (
      <div className="mt-8">
        <div className="mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Eigenvaardigheid
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Behaalde NWD-diploma&apos;s van deze persoon
          </p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          Geen NWD-diploma&apos;s gevonden.
        </p>
      </div>
    );
  }

  const grouped: GroupedByDiscipline[] = certificates.reduce((acc, cert) => {
    const courseTitle = cert.program.course.title;
    let group = acc.find((g) => g.courseTitle === courseTitle);
    if (!group) {
      group = { courseTitle, certificates: [] };
      acc.push(group);
    }
    group.certificates.push(cert);
    return acc;
  }, [] as GroupedByDiscipline[]);

  return (
    <div className="mt-8">
      <div className="mb-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Eigenvaardigheid
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Behaalde NWD-diploma&apos;s van deze persoon
        </p>
      </div>

      <div className="space-y-4">
        {grouped.map((group) => (
          <div
            key={group.courseTitle}
            className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:px-6">
              <h4 className="text-base font-medium text-gray-900 dark:text-white capitalize">
                {group.courseTitle}
              </h4>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
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
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {group.certificates.map((cert) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
