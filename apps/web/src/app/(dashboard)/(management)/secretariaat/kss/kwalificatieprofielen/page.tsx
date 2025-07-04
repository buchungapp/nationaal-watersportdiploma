import { PlusIcon } from "@heroicons/react/16/solid";
import FlexSearch from "flexsearch";
import { Suspense } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
} from "~/lib/nwd";
import Search from "../../../_components/search";
import KwalificatieprofielTableClient from "./_components/kwalificatieprofiel-table";

type Kwalificatieprofiel = {
  id: string;
  titel: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  niveau: {
    id: string;
    rang: number;
  };
  niveauRang?: number;
  kerntaken: Array<{
    id: string;
    titel: string;
    type: "verplicht" | "facultatief";
    rang: number | null;
    onderdelen: Array<{
      id: string;
      type: "portfolio" | "praktijk";
    }>;
  }>;
};

async function KwalificatieprofielTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  // Get all niveaus and then fetch kwalificatieprofielen for each
  const niveaus = await listKssNiveaus();
  const allKwalificatieprofielen: Kwalificatieprofiel[] = [];

  for (const niveau of niveaus) {
    const profielen = await listKssKwalificatieprofielenWithOnderdelen(
      niveau.id,
    );
    allKwalificatieprofielen.push(
      ...profielen.map((profiel) => ({
        ...profiel,
        niveauRang: niveau.rang,
      })),
    );
  }

  const searchQuery = searchParams?.query?.toString() ?? null;

  // Create a FlexSearch index
  const index = new FlexSearch.Index({
    tokenize: "full",
    context: {
      resolution: 9,
      depth: 2,
      bidirectional: true,
    },
  });

  // Add kwalificatieprofielen to the index
  for (const profiel of allKwalificatieprofielen) {
    if (profiel.titel) {
      index.add(profiel.id, profiel.titel);
    }
  }

  // Search kwalificatieprofielen using FlexSearch
  let filteredProfielen = allKwalificatieprofielen;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredProfielen = results.map((result) => {
      const found = allKwalificatieprofielen.find(
        (profiel) => profiel.id === result,
      );
      if (!found) throw new Error(`Profiel with id ${result} not found`);
      return found;
    });
  }

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedProfielen = filteredProfielen.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <KwalificatieprofielTableClient
      kwalificatieprofielen={paginatedProfielen}
      totalItems={filteredProfielen.length}
    />
  );
}

export default function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Kwalificatieprofielen</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek kwalificatieprofielen..." />
          </div>
        </div>
        <Button color="branding-orange" disabled>
          <PlusIcon />
          Nieuw kwalificatieprofiel
        </Button>
      </div>

      <Suspense
        fallback={
          <KwalificatieprofielTableClient
            kwalificatieprofielen={[]}
            totalItems={0}
            placeholderRows={4}
          />
        }
      >
        <KwalificatieprofielTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
