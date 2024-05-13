import {
  AcademicCapIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/16/solid";
import clsx from "clsx";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Code } from "~/app/(dashboard)/_components/text";
import {
  getPersonById,
  listCertificatesByLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { BackButton } from "../_components/back-button";

export default async function Page({
  params,
}: {
  params: {
    location: string;
    id: string;
  };
}) {
  const location = await retrieveLocationByHandle(params.location);
  const [certificates, person] = await Promise.all([
    listCertificatesByLocation(location.id), // @TODO replace with persons certificates
    getPersonById(params.id),
  ]);

  if (!person) {
    notFound();
  }

  const activity: (
    | {
        type: "certificate";
        certificate: (typeof certificates)[number];
        date: string;
      }
    | {
        type: "linked";
        date: string;
      }
  )[] = [
    {
      type: "linked",
      date: "2021-07-12",
    },
    ...certificates.slice(0, 3).map((certificate) => ({
      type: "certificate" as "certificate",
      certificate,
      date: certificate.issuedAt!,
    })),
  ];

  return (
    <div className="py-16">
      <div className="md:flex md:items-center md:justify-between md:space-x-8 pb-4 border-b border-gray-200">
        <div>
          <div className="flex gap-1 items-center">
            <BackButton />

            <h1 className="font-semibold text-zinc-950 dark:text-white text-lg/6 sm:text-base/6">
              {[person.firstName, person.lastNamePrefix, person.lastName]
                .filter(Boolean)
                .join(" ")}
            </h1>
          </div>
          <p className="mt-1 leading-6 text-zinc-600 dark:text-zinc-300 text-sm">
            Een overzicht van een persoon, bekijk informatie en behaalde
            diploma’s.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 ">
        <dl className={"col-span-2"}>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4">
            <div className="grid mt-6">
              <dt className="font-medium select-none text-base/6 text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white">
                Voornaam
              </dt>
              <dd className="text-base/6 mt-1 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white">
                {person.firstName}
              </dd>
            </div>

            <div className="grid mt-6">
              <dt className="font-medium select-none text-base/6 text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white">
                Tussenvoegsel
              </dt>
              <dd className="text-base/6 mt-1 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white">
                {person.lastNamePrefix ?? "-"}
              </dd>
            </div>

            <div className="grid mt-6">
              <dt className="font-medium select-none text-base/6 text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white">
                Achternaam
              </dt>
              <dd className="text-base/6 mt-1 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white">
                {person.lastName ?? "-"}
              </dd>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4">
            <div className="grid mt-6">
              <dt className="font-medium select-none text-base/6 text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white">
                Geboortedatum
              </dt>
              <dd className="text-base/6 mt-1 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white">
                {person.dateOfBirth ?? "-"}
              </dd>
            </div>
            <div className="grid mt-6">
              <dt className="font-medium select-none text-base/6 text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white">
                Geboorteplaats
              </dt>
              <dd className="text-base/6 mt-1 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white">
                {person.birthCity ?? "-"}
              </dd>
            </div>
            <div className="grid mt-6">
              <dt className="font-medium select-none text-base/6 text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white">
                Geboorteland
              </dt>
              <dd className="text-base/6 mt-1 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white">
                {person.birthCountry?.name ?? "-"}
              </dd>
            </div>
          </div>

          <div className="grid mt-6">
            <dt className="font-medium select-none text-base/6 text-zinc-950 data-[disabled]:opacity-50 sm:text-sm/6 dark:text-white">
              E-mail
            </dt>
            <dd className="text-base/6 mt-1 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white">
              {person.user?.email ?? "-"}{" "}
            </dd>
          </div>
        </dl>
        <div
          className={
            "pt-4 border-t border-gray-200 lg:border-l lg:border-t-0 lg:pt-0 lg:pl-4 "
          }
        >
          <ul role="list" className="space-y-6">
            {activity
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
              .map((activityItem, activityItemIdx) => (
                <li
                  key={activityItem.type + activityItemIdx}
                  className="relative flex gap-x-4"
                >
                  <div
                    className={clsx(
                      activityItemIdx === activity.length - 1
                        ? "h-6"
                        : "-bottom-6",
                      "absolute left-0 top-0 flex w-6 justify-center",
                    )}
                  >
                    <div className="w-px bg-gray-200" />
                  </div>
                  {activityItem.type === "certificate" ? (
                    <>
                      <div className="relative flex h-9 w-6 flex-none items-center justify-center bg-white">
                        <AcademicCapIcon
                          className="h-6 w-6 text-branding-dark"
                          aria-hidden="true"
                        />
                      </div>
                      <Link
                        href={`/${location.handle}/diplomas/${activityItem.certificate.id}`}
                        target="_blank"
                        className="flex-auto rounded-md p-3 ring-1 ring-inset ring-gray-200"
                      >
                        <div className="flex justify-between gap-x-4">
                          <Code>{activityItem.certificate.handle}</Code>
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex justify-between gap-x-4">
                          <div className="py-0.5 text-xs leading-5 text-gray-500">
                            <span className="font-medium text-gray-900">
                              {activityItem.certificate.program.title}
                            </span>
                          </div>
                          <time
                            dateTime={activityItem.date}
                            className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                          >
                            {new Date(activityItem.date).toLocaleDateString(
                              undefined,
                              {
                                dateStyle: "medium",
                              },
                            )}
                          </time>
                        </div>
                        <p className="text-xs leading-6 text-gray-500">
                          behaald in een{" "}
                          <span className="font-medium">
                            {activityItem.certificate.gearType.title}
                          </span>{" "}
                          bij{" "}
                          <span className="font-medium">
                            {activityItem.certificate.location.name}
                          </span>
                          <br />
                        </p>
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
                      </div>
                      <p className="flex-auto py-0.5 text-xs leading-5 text-gray-500">
                        Op{" "}
                        <span className="font-medium text-gray-900">
                          {new Date(activityItem.date).toLocaleDateString(
                            undefined,
                            {
                              dateStyle: "long",
                            },
                          )}
                        </span>{" "}
                        is er een koppeling gemaakt.
                      </p>
                      <time
                        dateTime={activityItem.date}
                        className="flex-none py-0.5 text-xs leading-5 text-gray-500"
                      >
                        {new Date(activityItem.date).toLocaleDateString(
                          undefined,
                          {
                            dateStyle: "medium",
                          },
                        )}
                      </time>
                    </>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
