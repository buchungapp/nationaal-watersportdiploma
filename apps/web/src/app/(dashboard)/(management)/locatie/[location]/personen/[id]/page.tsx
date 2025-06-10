import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  LayoutCardDisclosure,
  LayoutCardDisclosureChevron,
  LayoutMobilePadding,
  LayoutMultiCard,
} from "~/app/(dashboard)/_components/layout-card";
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
    <LayoutMultiCard>
      <div className="max-lg:hidden mt-1.5">
        <RouterPreviousButton>Terug</RouterPreviousButton>
      </div>

      <LayoutMobilePadding className="flex items-center gap-4 lg:-mt-1.5">
        <PersonName params={props.params} />
      </LayoutMobilePadding>

      <div className="items-start gap-2 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 mt-1 lg:max-w-none max-w-2xl">
        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
          <LayoutCardDisclosure
            defaultOpen
            header={
              <div className="flex justify-between items-center">
                <Subheading>Samenvatting</Subheading>
                <LayoutCardDisclosureChevron />
              </div>
            }
          >
            <PersonSummary params={props.params} />

            <Divider className="my-4" />

            <div className="flex justify-end">
              <EditPerson params={props.params} />
            </div>
          </LayoutCardDisclosure>
          <PersonCertificates params={props.params} />
        </div>

        <Roles params={props.params} />
      </div>
    </LayoutMultiCard>
  );
}
