import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { DocumentTextIcon } from "@heroicons/react/20/solid";
import prettyBytes from "pretty-bytes";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { listKnowledgeCenterDocuments } from "~/lib/nwd";

export default async function Page(_props: {
  params: Promise<{
    location: string;
  }>;
}) {
  const documents = await listKnowledgeCenterDocuments();

  return (
    <>
      <div className="flex items-end justify-between gap-4">
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

      <Table
        className="mt-8 [--gutter:theme(spacing.6)] sm:[--gutter:theme(spacing.8)]"
        dense
      >
        <TableHead>
          <TableRow>
            <TableHeader>Naam</TableHeader>
            <TableHeader>Laatste update</TableHeader>
            <TableHeader></TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell>
                <div className="flex items-center gap-4">
                  <DocumentTextIcon className="w-6 h-6 text-zinc-500" />
                  <div>
                    <TextLink
                      href={`/kennisbank/${document.id}`}
                      target="_blank"
                      prefetch={false}
                    >
                      {document.name}
                    </TextLink>
                    <div className="text-zinc-500">
                      <Badge className="mr-2">
                        {document.mimeType?.split("/")[1]?.toUpperCase()}
                      </Badge>
                      {prettyBytes(document.size, { locale: "nl" })}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-zinc-500">
                {dayjs(document.updatedAt).fromNow()}
              </TableCell>
              <TableCell>
                <div className="-mx-3 -my-1.5 sm:-mx-2.5">
                  <Button
                    plain
                    href={`/kennisbank/${document.id}?download=1`}
                    prefetch={false}
                  >
                    <ArrowDownTrayIcon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
