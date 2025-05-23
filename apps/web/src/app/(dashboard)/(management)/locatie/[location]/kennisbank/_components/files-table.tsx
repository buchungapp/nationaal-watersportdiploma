import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { DocumentTextIcon } from "@heroicons/react/20/solid";
import { createLoader, parseAsString } from "nuqs/server";
import prettyBytes from "pretty-bytes";
import { type PropsWithChildren, Suspense } from "react";
import Search from "~/app/(dashboard)/(management)/_components/search";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { PlaceholderTableRows } from "~/app/(dashboard)/_components/table-content";
import { TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { listKnowledgeCenterDocuments } from "~/lib/nwd";

type FilesTableProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function FilesTableInner({ children }: PropsWithChildren) {
  return (
    <>
      <Search className="mt-4 max-w-lg" />
      <Table
        className="mt-4 [--gutter:--spacing(6)] sm:[--gutter:--spacing(8)]"
        dense
      >
        <TableHead>
          <TableRow>
            <TableHeader>Naam</TableHeader>
            <TableHeader>Laatste update</TableHeader>
            <TableHeader />
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </>
  );
}

const searchParamsParser = createLoader({
  query: parseAsString.withDefault(""),
});

async function FilesTableContent({ searchParams }: FilesTableProps) {
  const { query } = await searchParamsParser(searchParams);

  const documents = await listKnowledgeCenterDocuments({
    q: query,
  });

  return (
    <FilesTableInner>
      {documents.map((document) => (
        <TableRow key={document.id}>
          <TableCell>
            <div className="flex items-center gap-4">
              <DocumentTextIcon className="size-6 text-zinc-500" />
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
            <div className="-mx-3 sm:-mx-2.5 -my-1.5">
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
    </FilesTableInner>
  );
}

export function FilesTableFallback() {
  return (
    <FilesTableInner>
      <PlaceholderTableRows rows={10} colSpan={3} />
    </FilesTableInner>
  );
}

export function FilesTable(props: FilesTableProps) {
  return (
    <Suspense fallback={<FilesTableFallback />}>
      <FilesTableContent searchParams={props.searchParams} />
    </Suspense>
  );
}
