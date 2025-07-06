import { getPvbBeoordelingsCriteria, getPvbToetsdocumenten } from "~/lib/nwd";
import type { retrievePvbAanvraagByHandle } from "~/lib/nwd";
import { ToetsdocumentenClient } from "./toetsdocumenten-client";

type AanvraagType = Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;

export async function ToetsdocumentenCard({
  aanvraag,
  role,
  personId,
}: {
  aanvraag: AanvraagType;
  role: "kandidaat" | "leercoach" | "beoordelaar";
  personId: string;
}) {
  const [toetsdocumentenList, beoordelingsCriteria] = await Promise.all([
    getPvbToetsdocumenten(aanvraag.id),
    getPvbBeoordelingsCriteria(aanvraag.id),
  ]);

  return (
    <ToetsdocumentenClient
      toetsdocumentenList={toetsdocumentenList}
      aanvraag={aanvraag}
      beoordelingsCriteria={beoordelingsCriteria.items}
      role={role}
      personId={personId}
    />
  );
}
