import { Badge } from "~/app/(dashboard)/_components/badge";
import dayjs from "~/lib/dayjs";

export function CertificateVisibility({
  visibleFrom,
}: {
  visibleFrom?: string | null;
}) {
  if (!visibleFrom) {
    return <span className="text-zinc-500">Niet ingesteld</span>;
  }

  const visibleFromDate = dayjs(visibleFrom).tz();
  const isHidden = visibleFromDate.isAfter(dayjs());

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="whitespace-nowrap tabular-nums">
        {visibleFromDate.format("DD-MM-YYYY HH:mm")}
      </span>
      <Badge color={isHidden ? "amber" : "green"}>
        {isHidden ? "Nog verborgen" : "Zichtbaar"} - {visibleFromDate.fromNow()}
      </Badge>
    </div>
  );
}
