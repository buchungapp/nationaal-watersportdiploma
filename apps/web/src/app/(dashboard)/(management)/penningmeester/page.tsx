import * as Headless from "@headlessui/react";
import { Suspense } from "react";
import { Label } from "~/app/(dashboard)/_components/fieldset";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { canViewFinancialReport } from "~/lib/authorization";
import type { Dayjs } from "~/lib/dayjs";
import dayjs from "~/lib/dayjs";
import { getUserOrThrow } from "~/lib/nwd";
// Reuse the existing period-picker (URL/nuqs-backed). Shared, generic UI.
import {
  DateSelector,
  FixedDateSelector,
} from "../locatie/[location]/inzichten/_components/date-selector";
import { Report } from "./_components/report";

const fmt = (d: Dayjs) => d.format("YYYY-MM-DD");
// Quarter start without the dayjs quarterOfYear plugin: snap to the quarter's
// first month (0,3,6,9).
const startOfQuarter = (d: Dayjs) =>
  d.month(Math.floor(d.month() / 3) * 3).startOf("month");

export default async function PenningmeesterPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUserOrThrow();

  if (!canViewFinancialReport(user.email)) {
    return (
      <div className="mx-auto max-w-7xl">
        <Heading level={1}>Geen toegang</Heading>
        <Text className="mt-2">Je hebt geen toegang tot deze pagina.</Text>
      </div>
    );
  }

  const searchParams = await props.searchParams;
  // Anchor "now" to Amsterdam, not the server runtime tz: a UTC-hosted server
  // would otherwise default to the wrong month/quarter around the boundary,
  // since the query math is Amsterdam-based.
  const today = dayjs().tz("Europe/Amsterdam");
  const defaultFrom = fmt(today.startOf("month"));
  const defaultTo = fmt(today.endOf("month"));

  const from =
    typeof searchParams.from === "string" ? searchParams.from : defaultFrom;
  const to = typeof searchParams.to === "string" ? searchParams.to : defaultTo;

  const quarter = startOfQuarter(today);
  const lastQuarter = quarter.subtract(3, "month");
  const periodPresets = [
    {
      label: "Deze maand",
      value: {
        from: fmt(today.startOf("month")),
        to: fmt(today.endOf("month")),
      },
    },
    {
      label: "Vorige maand",
      value: {
        from: fmt(today.subtract(1, "month").startOf("month")),
        to: fmt(today.subtract(1, "month").endOf("month")),
      },
    },
    {
      label: "Dit kwartaal",
      value: {
        from: fmt(quarter),
        to: fmt(quarter.add(2, "month").endOf("month")),
      },
    },
    {
      label: "Vorig kwartaal",
      value: {
        from: fmt(lastQuarter),
        to: fmt(lastQuarter.add(2, "month").endOf("month")),
      },
    },
    {
      label: "Dit jaar",
      value: { from: fmt(today.startOf("year")), to: fmt(today.endOf("year")) },
    },
    {
      label: "Vorig jaar",
      value: {
        from: fmt(today.subtract(1, "year").startOf("year")),
        to: fmt(today.subtract(1, "year").endOf("year")),
      },
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <Heading level={1}>Penningmeester</Heading>
      <Text className="mt-2">
        Aantal geregistreerde diploma's per vaarlocatie in de gekozen periode,
        gesplitst in consument (eigenvaardigheid) en instructeur
        (kaderopleiding). Exporteer voor de facturatie.
      </Text>

      <div className="flex flex-wrap items-end justify-between gap-3 mt-8">
        <Subheading>Diploma's per locatie</Subheading>
        <div className="flex items-center gap-2 -mt-2.5">
          <FixedDateSelector
            defaultValueFrom={defaultFrom}
            defaultValueTo={defaultTo}
            dateOptions={periodPresets}
          />
          <Headless.Field className="relative flex items-center gap-2">
            <Label className="font-medium">Vanaf</Label>
            <DateSelector name="from" defaultValue={defaultFrom} />
          </Headless.Field>
          <Headless.Field className="relative flex items-center gap-2">
            <Label className="font-medium">tot</Label>
            <DateSelector name="to" defaultValue={defaultTo} />
          </Headless.Field>
        </div>
      </div>

      <Suspense
        key={`${from}-${to}`}
        fallback={<Text className="mt-4">Bezig met laden…</Text>}
      >
        <Report from={from} to={to} />
      </Suspense>
    </div>
  );
}
