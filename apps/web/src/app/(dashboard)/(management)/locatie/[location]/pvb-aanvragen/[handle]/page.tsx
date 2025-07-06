import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { RouterPreviousButton } from "~/app/(dashboard)/_components/navigation";
import { retrievePvbAanvraagByHandle } from "~/lib/nwd";
import { AanvraagActions } from "./_components/aanvraag-actions";
import { AanvraagCard } from "./_components/aanvraag-card";
import PvbTimeline from "./_components/pvb-timeline";
import { ToetsdocumentenCard } from "./_components/toetsdocumenten-card";

export default async function Page(props: {
  params: Promise<{
    location: string;
    handle: string;
  }>;
}) {
  const params = await props.params;

  // Fetch the PVB aanvraag details
  const aanvraag = await retrievePvbAanvraagByHandle(params.handle);

  return (
    <>
      <div className="max-lg:hidden">
        <RouterPreviousButton>Overzicht</RouterPreviousButton>
      </div>

      <div className="items-start gap-x-8 gap-y-8 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 mt-8 lg:max-w-none max-w-2xl">
        <div className="lg:col-start-3 lg:row-end-1">
          <div className="flex justify-between items-center">
            <Subheading>PvB Aanvraag</Subheading>
            <AanvraagActions
              params={props.params}
              aanvraag={aanvraag}
              locatieId={aanvraag.locatie.id}
            />
          </div>
          <Divider className="mt-4" />
          <AanvraagCard params={props.params} />
        </div>

        <PvbTimeline params={props.params} />

        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
          <div className="flex justify-between items-center">
            <Subheading>Toetsdocumenten</Subheading>
          </div>
          <Divider className="mt-4" />
          <ToetsdocumentenCard params={props.params} aanvraag={aanvraag} />
        </div>
      </div>
    </>
  );
}
