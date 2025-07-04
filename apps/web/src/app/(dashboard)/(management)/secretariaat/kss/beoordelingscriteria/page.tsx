import { PlusIcon } from "@heroicons/react/16/solid";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import Search from "../../../_components/search";

export default function Page() {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Beoordelingscriteria</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek beoordelingscriteria..." />
          </div>
        </div>
        <Button color="branding-orange" disabled>
          <PlusIcon />
          Nieuw beoordelingscriterium
        </Button>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Text className="text-lg">
          Beoordelingscriteria beheer wordt binnenkort beschikbaar.
        </Text>
        <Text className="mt-2">
          Deze functionaliteit is momenteel in ontwikkeling.
        </Text>
      </div>
    </>
  );
}
