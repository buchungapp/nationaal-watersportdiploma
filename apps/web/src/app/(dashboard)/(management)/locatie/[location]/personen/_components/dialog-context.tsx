import { PlusIcon } from "@heroicons/react/16/solid";
import { Suspense } from "react";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { listCountries } from "~/lib/nwd";
import { retrieveLocationByHandle } from "~/lib/nwd";
import { DialogButtons, DialogsClient } from "./dialog-context-client";

type DialogsProps = { params: Promise<{ location: string }> };

async function DialogsContent(props: DialogsProps) {
  const [location, countries] = await Promise.all([
    props.params.then(({ location }) => retrieveLocationByHandle(location)),
    listCountries(),
  ]);

  return (
    <>
      <Dropdown>
        <DropdownButton color="branding-orange">
          <PlusIcon />
          Persoon aanmaken
        </DropdownButton>
        <DropdownMenu>
          <DialogButtons />
        </DropdownMenu>
      </Dropdown>
      <DialogsClient locationId={location.id} countries={countries} />
    </>
  );
}

export function DialogsFallback() {
  return <div className="bg-gray-200 rounded-lg w-43.25 h-9 animate-pulse" />;
}

export function Dialogs(props: DialogsProps) {
  return (
    <Suspense fallback={<DialogsFallback />}>
      <DialogsContent {...props} />
    </Suspense>
  );
}
