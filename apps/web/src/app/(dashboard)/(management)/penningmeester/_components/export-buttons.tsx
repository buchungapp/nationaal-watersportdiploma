"use client";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Button } from "~/app/(dashboard)/_components/button";
import { downloadBlob } from "~/lib/export";
import { exportPenningmeesterReportAction } from "../_actions/export";

export function ExportButtons({ from, to }: { from: string; to: string }) {
  const { execute, isExecuting } = useAction(exportPenningmeesterReportAction, {
    onSuccess: ({ data }) => {
      if (data) {
        downloadBlob(data.data, data.filename);
        toast.success("Rapportage geëxporteerd.");
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Exporteren is mislukt.");
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        outline
        disabled={isExecuting}
        onClick={() =>
          execute({ from, to, kind: "samenvatting", format: "xlsx" })
        }
      >
        <ArrowDownTrayIcon />
        Samenvatting (XLSX)
      </Button>
      <Button
        outline
        disabled={isExecuting}
        onClick={() => execute({ from, to, kind: "detail", format: "xlsx" })}
      >
        <ArrowDownTrayIcon />
        Detail / bewijs (XLSX)
      </Button>
      <Button
        plain
        disabled={isExecuting}
        onClick={() =>
          execute({ from, to, kind: "samenvatting", format: "csv" })
        }
      >
        CSV
      </Button>
    </div>
  );
}
