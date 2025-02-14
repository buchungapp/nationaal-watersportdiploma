import type { Row } from "@tanstack/react-table";
import { Button } from "~/app/(dashboard)/_components/button";
import type { listCertificates } from "~/lib/nwd";

type Certificate = Awaited<ReturnType<typeof listCertificates>>[number];
export function Download({ rows }: { rows: Row<Certificate>[] }) {
  const params = new URLSearchParams();

  for (const row of rows) {
    if (row.getIsSelected()) {
      params.append("certificate[]", row.original.handle);
    }
  }

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
