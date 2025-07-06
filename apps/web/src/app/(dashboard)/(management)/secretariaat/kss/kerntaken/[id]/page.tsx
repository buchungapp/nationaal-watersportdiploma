import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { notFound } from "next/navigation";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { getKssKerntaakDetails } from "~/lib/nwd";
import KerntaakDetailClient from "./_components/kerntaak-detail-client";

export default async function KerntaakDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kerntaak = await getKssKerntaakDetails(id);

  if (!kerntaak) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <Button href="/secretariaat/kss/kerntaken" plain>
          <ArrowLeftIcon />
          Terug naar kerntaken
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Heading level={1}>{kerntaak.titel}</Heading>
          <Badge color={kerntaak.type === "verplicht" ? "blue" : "zinc"}>
            {kerntaak.type === "verplicht" ? "Verplicht" : "Facultatief"}
          </Badge>
        </div>
        <div className="flex flex-col gap-1">
          <Text className="text-sm">
            <strong>Kwalificatieprofiel:</strong>{" "}
            {kerntaak.kwalificatieprofiel.titel}
          </Text>
          <Text className="text-sm">
            <strong>Rang:</strong> {kerntaak.rang || "Geen"}
          </Text>
          {kerntaak.onderdelen.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Text className="text-sm">
                <strong>Onderdelen:</strong>
              </Text>
              {kerntaak.onderdelen.map((onderdeel) => (
                <Badge key={onderdeel.id} color="zinc" className="text-xs">
                  {onderdeel.type === "portfolio" ? "Portfolio" : "Praktijk"}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Divider />

      <KerntaakDetailClient
        kerntaakId={kerntaak.id}
        onderdelen={kerntaak.onderdelen}
        werkprocessen={kerntaak.werkprocessen}
      />
    </div>
  );
}
