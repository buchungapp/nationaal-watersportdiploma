import type { Row } from "@tanstack/react-table";
import { Button } from "~/app/(dashboard)/_components/button";
import type { listCertificatesByLocation } from "~/lib/nwd";

type Certificate = Awaited<
  ReturnType<typeof listCertificatesByLocation>
>[number];
export function Download({ rows }: { rows: Row<Certificate>[] }) {
  const params = new URLSearchParams();

  rows.forEach((row) => {
    if (row.getIsSelected()) {
      params.append("certificate[]", row.original.handle);
    }
  });

  return (
    <Button
      plain
      href={`/api/export/certificate/pdf?${params.toString()}`}
      target="_blank"
    >
      Download PDF
    </Button>
  );
}
