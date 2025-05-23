import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { FilesTable } from "./_components/files-table";

export default function Page(props: {
  params: Promise<{
    location: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <div className="flex justify-between items-end gap-4">
        <Heading>Kennisbank</Heading>
      </div>

      <Text>
        Hier vind je als instructeur zowel de NWD cursushandboeken als de
        PvB-protocollen in PDF formaat. De handboeken zijn ook digitaal
        beschikbaar voor ingelogde NWD-instructeurs via{" "}
        <TextLink href="/diplomalijn/consument" target="_blank">
          www.nwd.nl/diplomalijn/consument
        </TextLink>
        .
      </Text>

      <FilesTable searchParams={props.searchParams} />
    </>
  );
}
