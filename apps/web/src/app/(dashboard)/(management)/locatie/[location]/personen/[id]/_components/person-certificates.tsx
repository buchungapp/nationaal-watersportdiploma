import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  ExternalCertificates,
  NWDCertificates,
} from "~/app/(dashboard)/_components/nwd/certificates";
import { Text } from "~/app/(dashboard)/_components/text";
import {
  getPersonById,
  listRolesForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";

type PersonCertificatesProps = {
  params: Promise<{
    location: string;
    id: string;
  }>;
};

async function PersonCertificatesContent(props: PersonCertificatesProps) {
  const params = await props.params;
  const retrieveLocationPromise = retrieveLocationByHandle(params.location);
  const retrievePersonPromise = retrieveLocationPromise.then(
    async (location) => {
      const person = await getPersonById(params.id, location.id);

      if (!person) {
        notFound();
      }

      return person;
    },
  );

  const [person, rolesInLocation, location] = await Promise.all([
    retrievePersonPromise,
    retrievePersonPromise.then(async (person) => {
      const location = await retrieveLocationPromise;

      return listRolesForLocation(location.id, person.id);
    }),
    retrieveLocationPromise,
  ]);

  const isStudentOrInstructor = rolesInLocation.some((role) =>
    ["student", "instructor"].includes(role),
  );

  if (!isStudentOrInstructor) return null;
  return (
    <>
      <div className="mt-8">
        <Subheading>NWD-diploma's</Subheading>
        <Divider className="mt-2 mb-4" />
        <Suspense>
          <NWDCertificates
            personId={person.id}
            locationId={location.id}
            noResults={
              <Text className="italic">Geen NWD-diploma's kunnen vinden.</Text>
            }
          />
        </Suspense>
      </div>

      <div className="mt-8">
        <Subheading>Overige certificaten</Subheading>
        <Divider className="mt-2 mb-4" />
        <Suspense>
          <ExternalCertificates
            personId={person.id}
            locationId={location.id}
            noResults={
              <Text className="italic">
                Geen overige certificaten kunnen vinden.
              </Text>
            }
          />
        </Suspense>
      </div>
    </>
  );
}

export function PersonCertificates(props: PersonCertificatesProps) {
  return (
    <Suspense fallback={null}>
      <PersonCertificatesContent {...props} />
    </Suspense>
  );
}
