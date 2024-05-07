"use client";

import type { Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import Spinner from "~/app/_components/spinner";
import type { listCertificates } from "~/lib/nwd";

type Certificate = Awaited<ReturnType<typeof listCertificates>>[number];
export function Download({ rows }: { rows: Row<Certificate>[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      plain
      onClick={() =>
        startTransition(() => {
          // TODO: Make the download action more efficient, either by bulk api or pre zipping the files
          for (const row of rows) {
            router.prefetch(`/diploma/${row.original.id}/pdf`);
          }

          for (const row of rows) {
            window.open(`/diploma/${row.original.id}/pdf`, "_blank");
          }
        })
      }
    >
      {isPending ? <Spinner className="text-gray-700" size="sm" /> : null}{" "}
      Download PDF
    </Button>
  );
}
