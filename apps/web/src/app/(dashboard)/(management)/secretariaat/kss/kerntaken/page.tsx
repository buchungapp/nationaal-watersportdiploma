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
import KerntaakTableClient from "./_components/kerntaak-table";

type Kerntaak = {
  id: string;
  titel: string;
  type: "verplicht" | "facultatief";
  rang: number | null;
  kwalificatieprofiel: {
    id: string;
    titel: string;
    richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  };
  onderdelen: Array<{
    id: string;
    type: "portfolio" | "praktijk";
  }>;
};

async function KerntaakTable(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;

  // Get all niveaus and then fetch kwalificatieprofielen for each
  const niveaus = await listKssNiveaus();
  const allKerntaken: Kerntaak[] = [];

  for (const niveau of niveaus) {
    const profielen = await listKssKwalificatieprofielenWithOnderdelen(
      niveau.id,
    );
    for (const profiel of profielen) {
      allKerntaken.push(
        ...profiel.kerntaken.map((kerntaak) => ({
          ...kerntaak,
          kwalificatieprofiel: {
            id: profiel.id,
            titel: profiel.titel,
            richting: profiel.richting,
          },
        })),
      );
    }
  }

  // Sort all kerntaken by rang (nulls last)
  allKerntaken.sort((a, b) => {
    if (a.rang === null && b.rang === null) return 0;
    if (a.rang === null) return 1;
    if (b.rang === null) return -1;
    return a.rang - b.rang;
  });

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

  // Add kerntaken to the index
  for (const kerntaak of allKerntaken) {
    if (kerntaak.titel) {
      index.add(kerntaak.id, kerntaak.titel);
    }
  }

  // Search kerntaken using FlexSearch
  let filteredKerntaken = allKerntaken;
  if (searchQuery) {
    const results = index.search(decodeURIComponent(searchQuery));
    filteredKerntaken = results.map((result) => {
      const found = allKerntaken.find((kerntaak) => kerntaak.id === result);
      if (!found) throw new Error(`Kerntaak with id ${result} not found`);
      return found;
    });
  }

  // Pagination
  const paginationLimit = searchParams?.limit ? Number(searchParams.limit) : 25;
  const currentPage = searchParams?.page ? Number(searchParams.page) : 1;

  const paginatedKerntaken = filteredKerntaken.slice(
    (currentPage - 1) * paginationLimit,
    currentPage * paginationLimit,
  );

  return (
    <KerntaakTableClient
      kerntaken={paginatedKerntaken}
      totalItems={filteredKerntaken.length}
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
          <Heading>Kerntaken</Heading>
          <div className="flex gap-4 mt-4 max-w-xl">
            <Search placeholder="Doorzoek kerntaken..." />
          </div>
        </div>
        <Button color="branding-orange" disabled>
          <PlusIcon />
          Nieuwe kerntaak
        </Button>
      </div>

      <Suspense
        fallback={
          <KerntaakTableClient
            kerntaken={[]}
            totalItems={0}
            placeholderRows={4}
          />
        }
      >
        <KerntaakTable searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
