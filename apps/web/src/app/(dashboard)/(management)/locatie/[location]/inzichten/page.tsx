import weekOfYear from "dayjs/plugin/weekOfYear";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import dayjs from "~/lib/dayjs";

import { Certificates } from "./_components/certificates";
import { Persons } from "./_components/persons";

dayjs.extend(weekOfYear);

export default async function Page(props: {
  params: Promise<{
    location: string;
  }>;
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
    </>
  );
}
