import { Heading } from "~/app/(dashboard)/_components/heading";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { getPersonById, listPersonsWithPagination } from "~/lib/nwd";
import {
  BackButton,
  ContinueButton,
  MergeButton,
} from "./_components/action-buttons";
import { SwapButton } from "./_components/action-buttons";
import { PersonAttributes } from "./_components/person-attributes";
import { PersonHeader } from "./_components/person-header";
import SearchPerson from "./_components/search-person";
import { searchParamsParser } from "./_search-params";

export default async function SamenvoegenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const {
    query,
    primaryPerson: primaryPersonId,
    secondaryPerson: secondaryPersonId,
    confirm,
  } = await searchParamsParser(searchParams);

  const persons = await listPersonsWithPagination({
    filter: {
      q: query,
    },
  });

  const primaryPerson = primaryPersonId
    ? await getPersonById(primaryPersonId)
    : null;
  const secondaryPerson = secondaryPersonId
    ? await getPersonById(secondaryPersonId)
    : null;

  return (
    <>
      <div className="flex justify-between items-end">
        <div>
          <Heading level={1}>Samenvoegen</Heading>
          <Text>Samenvoegen van gebruikers.</Text>
        </div>
        <div className="flex gap-2">
          {!confirm ? (
            <>
              <SwapButton />
              <ContinueButton />
            </>
          ) : (
            <BackButton />
          )}
        </div>
      </div>

      <div className="bg-zinc-100 -mx-2 mt-2 p-2 rounded-xl">
        <div className="items-start gap-2 grid grid-cols-1 lg:grid-cols-2 mx-auto lg:mx-0 lg:max-w-none max-w-2xl">
          <StackedLayoutCard>
            {!confirm ? (
              <>
                <Text>Selecteer de persoon die behouden blijft</Text>
                <SearchPerson persons={persons} personParam="primaryPerson" />
              </>
            ) : null}

            {primaryPerson ? (
              <div className={confirm ? "" : "mt-4"}>
                <PersonHeader person={primaryPerson} />

                <PersonAttributes
                  showSummary={!confirm}
                  attributes={[
                    {
                      label: "ID",
                      value: primaryPerson.id,
                    },
                    {
                      label: "Handle",
                      value: primaryPerson.handle,
                    },
                    {
                      label: "Email",
                      value: primaryPerson.email,
                    },
                    {
                      label: "Voornaam",
                      value: primaryPerson.firstName,
                    },
                    {
                      label: "Tussenvoegsel",
                      value: primaryPerson.lastNamePrefix,
                    },
                    {
                      label: "Achternaam",
                      value: primaryPerson.lastName,
                    },
                    {
                      label: "Geboorteland",
                      value: primaryPerson.birthCountry?.name,
                    },
                    {
                      label: "Geboorteplaats",
                      value: primaryPerson.birthCity,
                    },
                    {
                      label: "Geboortedatum",
                      value: primaryPerson.dateOfBirth,
                    },
                    {
                      label: "Aangemaakt op",
                      value: dayjs(primaryPerson.createdAt).format(
                        "DD-MM-YYYY HH:mm",
                      ),
                    },
                    {
                      label: "Laatst bijgewerkt op",
                      value: dayjs(primaryPerson.updatedAt).format(
                        "DD-MM-YYYY HH:mm",
                      ),
                    },
                  ]}
                />
              </div>
            ) : null}
          </StackedLayoutCard>
          {!confirm ? (
            <StackedLayoutCard>
              <Text>Selecteer wie hiermee wordt samengevoegd</Text>
              <SearchPerson persons={persons} personParam="secondaryPerson" />

              {secondaryPerson ? (
                <div className="mt-4">
                  <PersonHeader person={secondaryPerson} />

                  <PersonAttributes
                    attributes={[
                      {
                        label: "ID",
                        value: secondaryPerson.id,
                        remove: true,
                      },
                      {
                        label: "Handle",
                        value: secondaryPerson.handle,
                        remove: true,
                      },
                      {
                        label: "Email",
                        value: secondaryPerson.email,
                        remove: true,
                      },
                      {
                        label: "Voornaam",
                        value: secondaryPerson.firstName,
                        remove: true,
                      },
                      {
                        label: "Tussenvoegsel",
                        value: secondaryPerson.lastNamePrefix,
                        remove: true,
                      },
                      {
                        label: "Achternaam",
                        value: secondaryPerson.lastName,
                        remove: true,
                      },
                      {
                        label: "Geboorteland",
                        value: secondaryPerson.birthCountry?.name,
                        remove: true,
                      },
                      {
                        label: "Geboorteplaats",
                        value: secondaryPerson.birthCity,
                        remove: true,
                      },
                      {
                        label: "Geboortedatum",
                        value: secondaryPerson.dateOfBirth,
                        remove: true,
                      },
                      {
                        label: "Aangemaakt op",
                        value: dayjs(secondaryPerson.createdAt).format(
                          "DD-MM-YYYY HH:mm",
                        ),
                        remove: true,
                      },
                      {
                        label: "Laatst bijgewerkt op",
                        value: dayjs(secondaryPerson.updatedAt).format(
                          "DD-MM-YYYY HH:mm",
                        ),
                        remove: true,
                      },
                    ]}
                  />
                </div>
              ) : null}
            </StackedLayoutCard>
          ) : (
            <StackedLayoutCard>
              <h2 className="font-semibold text-zinc-950 text-lg/7">
                Weet je zeker dat je deze gebruikers wilt samenvoegen?
              </h2>

              <Text className="mt-2 text-zinc-950">
                Bij het samenvoegen worden de volgende gegevens overgedragen:
              </Text>
              <ul className="text-zinc-950 sm:text-sm/6 text-base/6">
                <li>• Alle diploma's</li>
                <li>• Alle kwalificaties binnen de KSS</li>
                <li>• Alle programma's en voortgangen</li>
                <li>• Alle logboeken</li>
                <li>• Alle externe certificaten</li>
              </ul>

              <Text className="my-2 text-zinc-950 text-sm">
                <strong>
                  Deze wijzigingen worden doorgevoerd op alle locaties binnen
                  het NWD waar deze gebruiker actief is.
                </strong>
              </Text>

              <MergeButton
                primaryPersonId={primaryPersonId}
                secondaryPersonId={secondaryPersonId}
              />
            </StackedLayoutCard>
          )}
        </div>
      </div>
    </>
  );
}
