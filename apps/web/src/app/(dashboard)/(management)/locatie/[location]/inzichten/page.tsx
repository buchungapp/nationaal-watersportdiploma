import * as Headless from "@headlessui/react";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import dayjs from "~/lib/dayjs";
import { CertificatesPerDiscipline } from "./_components/certificates-per-discipline";
import { DateSelector, FixedDateSelector } from "./_components/date-selector";
import { Persons } from "./_components/persons";

dayjs.extend(weekOfYear);

export default function Page(props: {
  params: Promise<{
    location: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const defaultFrom = dayjs().startOf("year").toDate();
  const defaultTo = dayjs().endOf("year").toDate();

  return (
    <>
      <Heading>Inzichten</Heading>

      <div className="mt-8">
        <Subheading>Personen</Subheading>
      </div>

      <Persons params={props.params} />

      <div className="flex justify-between mt-16">
        <Subheading>Diploma's</Subheading>
        <div className="flex items-center gap-2 -mt-2.5">
          <FixedDateSelector
            dateOptions={[
              {
                label: "Deze week",
                value: {
                  from: dayjs().startOf("week").toDate(),
                  to: dayjs().endOf("week").toDate(),
                },
              },
              {
                label: "Vorige week",
                value: {
                  from: dayjs().startOf("week").subtract(1, "week").toDate(),
                  to: dayjs().endOf("week").subtract(1, "week").toDate(),
                },
              },
              {
                label: "Deze maand",
                value: {
                  from: dayjs().startOf("month").toDate(),
                  to: dayjs().endOf("month").toDate(),
                },
              },
              {
                label: "Dit jaar",
                value: { from: defaultFrom, to: defaultTo },
              },
              {
                label: "Vorig jaar",
                value: {
                  from: dayjs().startOf("year").subtract(1, "year").toDate(),
                  to: dayjs().endOf("year").subtract(1, "year").toDate(),
                },
              },
              {
                label: "Alle tijd",
                value: {
                  from: dayjs("1900-01-01").toDate(),
                  to: dayjs("2100-01-01").toDate(),
                },
              },
            ]}
          />
          <Headless.Field className="relative flex items-center gap-2">
            <Label className="font-medium">Vanaf</Label>
            <DateSelector name="from" defaultValue={defaultFrom} />
          </Headless.Field>
          <Headless.Field className="relative flex items-center gap-2">
            <Label className="font-medium">tot</Label>
            <DateSelector name="to" defaultValue={defaultTo} />
          </Headless.Field>
        </div>
      </div>

      <CertificatesPerDiscipline
        params={props.params}
        searchParams={props.searchParams}
      />
    </>
  );
}
