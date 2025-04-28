import {
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import { TableSelectionButton } from "~/app/(dashboard)/_components/table-action";
import type { listCertificates } from "~/lib/nwd";

type Certificate = Awaited<ReturnType<typeof listCertificates>>[number];
export function Download({ rows }: { rows: Certificate[] }) {
  const params = new URLSearchParams();

  for (const row of rows) {
    params.append("certificate", row.handle);
  }

  return (
    <DropdownItem
      href={`/api/export/certificate/pdf?${params.toString()}`}
      target="_blank"
    >
      <DropdownLabel>Download PDF</DropdownLabel>
    </DropdownItem>
  );
}

export function ActionButtons({ rows }: { rows: Certificate[] }) {
  return (
    <TableSelectionButton>
      <Download rows={rows} />
    </TableSelectionButton>
  );
}
