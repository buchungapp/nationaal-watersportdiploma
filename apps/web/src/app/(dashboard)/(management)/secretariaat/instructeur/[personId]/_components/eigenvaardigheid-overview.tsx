import {
  getExistingNwdCCertificateKeys,
  getNwdCPrograms,
  listLocationsForNwdCRegistration,
} from "~/app/_actions/eigenvaardigheid/manage-nwd-c";
import { listCertificatesForPersonAsAdmin } from "~/lib/nwd";
import { EigenvaardigheidOverviewClient } from "./eigenvaardigheid-overview-client";

export async function EigenvaardigheidOverview({
  personId,
}: {
  personId: string;
}) {
  const [allCertificates, programs, locations, existingNwdCKeys] =
    await Promise.all([
      listCertificatesForPersonAsAdmin(personId),
      getNwdCPrograms(),
      listLocationsForNwdCRegistration(),
      getExistingNwdCCertificateKeys(personId),
    ]);

  const certificates = allCertificates.filter(
    (cert) => cert.program.degree.rang >= 5,
  );

  return (
    <EigenvaardigheidOverviewClient
      personId={personId}
      certificates={certificates}
      programs={programs}
      locations={locations}
      existingNwdCKeys={existingNwdCKeys}
    />
  );
}
