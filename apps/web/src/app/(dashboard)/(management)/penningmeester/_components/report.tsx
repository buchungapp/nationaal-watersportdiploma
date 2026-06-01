import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import { ExportButtons } from "./export-buttons";
import { listCertificateCountsByLocation } from "./queries";

async function ReportContent({ from, to }: { from: string; to: string }) {
  const counts = await listCertificateCountsByLocation(from, to);

  if (counts.length === 0) {
    // Still offer export: a treasurer may want a zero-result evidence file
    // documenting that a period had no billable diploma's.
    return (
      <div className="mt-4 space-y-6">
        <div className="flex justify-end">
          <ExportButtons from={from} to={to} />
        </div>
        <Text>Geen geregistreerde diploma's in deze periode.</Text>
      </div>
    );
  }

  const totals = counts.reduce(
    (acc, row) => ({
      consument: acc.consument + row.consument,
      instructeur: acc.instructeur + row.instructeur,
      totaal: acc.totaal + row.totaal,
    }),
    { consument: 0, instructeur: 0, totaal: 0 },
  );

  return (
    <div className="mt-4 space-y-6">
      <div className="flex justify-end">
        <ExportButtons from={from} to={to} />
      </div>

      <Table dense>
        <TableHead>
          <TableRow>
            <TableHeader>Locatie</TableHeader>
            <TableHeader className="text-right">Consument</TableHeader>
            <TableHeader className="text-right">Instructeur</TableHeader>
            <TableHeader className="text-right">Totaal</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {counts.map((row) => (
            <TableRow key={row.locationId}>
              <TableCell>
                <Strong>{row.locationName}</Strong>{" "}
                <span className="text-zinc-500">{row.locationHandle}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.consument}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.instructeur}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {row.totaal}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>
              <Strong>Totaal</Strong>
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {totals.consument}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {totals.instructeur}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {totals.totaal}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export function Report({ from, to }: { from: string; to: string }) {
  return <ReportContent from={from} to={to} />;
}
