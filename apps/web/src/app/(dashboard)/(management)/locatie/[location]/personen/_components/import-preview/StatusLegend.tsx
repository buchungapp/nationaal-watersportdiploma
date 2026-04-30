// Static legend explaining the status badges in the preview list. Module-
// level constant component (no state, no hooks) so React.memo isn't needed
// and the JSX is hoisted by React's tree caching.

import { Badge } from "~/app/(dashboard)/_components/badge";
import { Text } from "~/app/(dashboard)/_components/text";

const ITEMS: Array<{
  color: Parameters<typeof Badge>[0]["color"];
  label: string;
  copy: string;
}> = [
  {
    color: "zinc",
    label: "Nieuw",
    copy: "Geen bestaand profiel gevonden — er wordt een nieuw profiel aangemaakt.",
  },
  {
    color: "amber",
    label: "Mogelijk dezelfde",
    copy: "Lijkt op een bestaand profiel — bevestig of kies een ander profiel.",
  },
  {
    color: "blue",
    label: "Vrijwel zeker dezelfde",
    copy: "Naam én geboortedatum komen overeen met een bestaand profiel — bevestig om het bestaande profiel te gebruiken.",
  },
  {
    color: "branding-light",
    label: "Meerdere rijen, dezelfde persoon",
    copy: "Meerdere rijen lijken dezelfde persoon — open de groep om te bevestigen.",
  },
  {
    color: "red",
    label: "Fout in rij",
    copy: "Deze rij konden we niet lezen — wordt overgeslagen, blokkeert de import niet.",
  },
];

export function StatusLegend() {
  return (
    <details className="rounded-md border border-zinc-950/10 bg-zinc-50 px-4 py-3 text-sm dark:border-white/5 dark:bg-zinc-900/50">
      <summary className="cursor-pointer text-zinc-700 dark:text-zinc-300">
        Wat betekenen deze labels?
      </summary>
      <ul className="mt-3 space-y-2">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            <Badge color={item.color}>{item.label}</Badge>
            <Text className="!text-xs">{item.copy}</Text>
          </li>
        ))}
      </ul>
    </details>
  );
}
