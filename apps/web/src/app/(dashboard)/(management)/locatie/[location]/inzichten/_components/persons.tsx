import { Suspense } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { listPersonsForLocation, retrieveLocationByHandle } from "~/lib/nwd";

type PersonsProps = {
  params: Promise<{
    location: string;
  }>;
};

async function PersonsContent(props: PersonsProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);

  const persons = await listPersonsForLocation(location.id);

  return (
    <div className="gap-8 grid lg:grid-cols-3 mt-4">
      {[
        {
          id: "students",
          title: "Cursisten",
          count: persons.filter((person) =>
            person.actors.some((actor) => actor.type === "student"),
          ).length,
        },
        {
          id: "instructors",
          title: "Instructeurs",
          count: persons.filter((person) =>
            person.actors.some((actor) => actor.type === "instructor"),
          ).length,
        },
        {
          id: "admins",
          title: "Locatiebeheerders",
          count: persons.filter((person) =>
            person.actors.some((actor) => actor.type === "location_admin"),
          ).length,
        },
      ].map((stat) => {
        return (
          <div key={stat.id}>
            <Divider />
            <div className="mt-6 font-medium sm:text-sm/6 text-lg/6">
              {stat.title}
            </div>
            <div className="mt-3 font-semibold tabular-nums sm:text-2xl/8 text-3xl/8">
              {stat.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PersonsFallback() {
  return (
    <div className="gap-8 grid lg:grid-cols-3 mt-4">
      {[
        {
          id: "students",
          title: "Cursisten",
        },
        {
          id: "instructors",
          title: "Instructeurs",
        },
        {
          id: "admins",
          title: "Locatiebeheerders",
        },
      ].map((stat) => {
        return (
          <div key={stat.id}>
            <Divider />
            <div className="mt-6 font-medium sm:text-sm/6 text-lg/6">
              {stat.title}
            </div>
            <div className="mt-3 font-semibold tabular-nums sm:text-2xl/8 text-3xl/8">
              <span className="inline-block bg-gray-200 rounded w-15.5 h-6 animate-pulse" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Persons(props: PersonsProps) {
  return (
    <Suspense fallback={<PersonsFallback />}>
      <PersonsContent params={props.params} />
    </Suspense>
  );
}
