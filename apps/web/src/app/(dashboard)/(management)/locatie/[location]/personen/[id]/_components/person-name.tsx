import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { getPersonById } from "~/lib/nwd";
import { retrieveLocationByHandle } from "~/lib/nwd";

type PersonNameProps = {
  params: Promise<{
    location: string;
    id: string;
  }>;
};

async function PersonNameContent(props: PersonNameProps) {
  const params = await props.params;
  const retrieveLocationPromise = retrieveLocationByHandle(params.location);
  const person = await retrieveLocationPromise.then(async (location) => {
    const person = await getPersonById(params.id, location.id);

    if (!person) {
      notFound();
    }

    return person;
  });

  return (
    <Heading>
      {[person.firstName, person.lastNamePrefix, person.lastName]
        .filter(Boolean)
        .join(" ")}
    </Heading>
  );
}

export function PersonNameFallback() {
  return (
    <Heading>
      <span className="inline-block bg-gray-200 mt-1 -mb-1 rounded w-32 h-6 animate-pulse" />
    </Heading>
  );
}

export function PersonName(props: PersonNameProps) {
  return (
    <Suspense fallback={<PersonNameFallback />}>
      <PersonNameContent {...props} />
    </Suspense>
  );
}
