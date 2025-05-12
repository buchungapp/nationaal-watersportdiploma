import * as Headless from "@headlessui/react";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import dayjs from "~/lib/dayjs";
import { Certificates } from "./_components/certificates";
import { CertificatesPerDiscipline } from "./_components/certificates-per-discipline";
import { DateSelector } from "./_components/date-selector";
import { Persons } from "./_components/persons";

dayjs.extend(weekOfYear);

export default function Page(props: {
  params: Promise<{
    location: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <Heading>Inzichten</Heading>

      <div className="mt-8">
        <Subheading>Personen</Subheading>
      </div>

      <Persons params={props.params} />

      <div className="mt-16">
        <Subheading>Diploma's</Subheading>
      </div>

      <Certificates params={props.params} />

      <div className="flex justify-between mt-16">
        <Subheading level={3}>Diploma's per discipline</Subheading>
        <div className="flex items-center gap-2 -mt-2.5">
          <Headless.Field className="relative flex items-center gap-2">
            <Label className="font-medium">Vanaf</Label>
            <DateSelector
              name="from"
              defaultValue={dayjs().startOf("year").toDate()}
            />
          </Headless.Field>
          <Headless.Field className="relative flex items-center gap-2">
            <Label className="font-medium">tot</Label>
            <DateSelector
              name="to"
              defaultValue={dayjs().endOf("year").toDate()}
            />
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
