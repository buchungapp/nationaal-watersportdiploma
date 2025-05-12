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
  const defaultFrom = dayjs().startOf("year").format("YYYY-MM-DD");
  const defaultTo = dayjs().endOf("year").format("YYYY-MM-DD");

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
            defaultValueFrom={defaultFrom}
            defaultValueTo={defaultTo}
            dateOptions={[
              {
                label: "Huidige week",
                value: {
                  from: dayjs().startOf("week").format("YYYY-MM-DD"),
                  to: dayjs().endOf("week").format("YYYY-MM-DD"),
                },
              },
              {
                label: "Afgelopen week",
                value: {
                  from: dayjs()
                    .startOf("week")
                    .subtract(1, "week")
                    .format("YYYY-MM-DD"),
                  to: dayjs()
                    .endOf("week")
                    .subtract(1, "week")
                    .format("YYYY-MM-DD"),
                },
              },
              {
                label: "Huidig seizoen",
                value: { from: defaultFrom, to: defaultTo },
              },
              {
                label: "Afgelopen seizoen",
                value: {
                  from: dayjs()
                    .startOf("year")
                    .subtract(1, "year")
                    .format("YYYY-MM-DD"),
                  to: dayjs()
                    .endOf("year")
                    .subtract(1, "year")
                    .format("YYYY-MM-DD"),
                },
              },
              {
                label: "Alle tijden",
                value: {
                  from: "1900-01-01",
                  to: "2100-01-01",
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
