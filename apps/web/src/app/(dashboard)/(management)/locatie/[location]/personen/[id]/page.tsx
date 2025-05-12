import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { RouterPreviousButton } from "~/app/(dashboard)/_components/navigation";
import { EditPerson } from "./_components/edit-person";
import { PersonCertificates } from "./_components/person-certificates";
import { PersonName } from "./_components/person-name";
import { PersonSummary } from "./_components/person-summary";
import { Roles } from "./_components/roles";

export default function Page(props: {
  params: Promise<{
    location: string;
    id: string;
  }>;
}) {
  return (
    <>
      <div className="max-lg:hidden">
        <RouterPreviousButton>Terug</RouterPreviousButton>
      </div>

      <div className="flex flex-wrap justify-between gap-x-6 mt-4 lg:mt-8">
        <PersonName params={props.params} />
        <EditPerson params={props.params} />
      </div>

      <div className="items-start gap-x-8 gap-y-8 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 mt-8 lg:max-w-none max-w-2xl">
        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
          <div>
            <Subheading>Samenvatting</Subheading>
            <Divider className="mt-2 mb-4" />
            <PersonSummary params={props.params} />
          </div>
          <PersonCertificates params={props.params} />
        </div>

        <Roles params={props.params} />
      </div>
    </>
  );
}
