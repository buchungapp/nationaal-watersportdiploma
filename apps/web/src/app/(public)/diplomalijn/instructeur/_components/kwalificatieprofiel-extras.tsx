import type { KwalificatieprofielId } from "../_data/kwalificatieprofielen";
import { Niveau5DidactiekNote } from "./niveau-5-didactiek-note";

export function KwalificatieprofielExtras({
  profielId,
}: {
  profielId: KwalificatieprofielId;
}) {
  if (profielId === "I5") {
    return <Niveau5DidactiekNote tone="instructeur" />;
  }

  if (profielId === "L5") {
    return <Niveau5DidactiekNote tone="leercoach" />;
  }

  if (profielId === "B5") {
    return <Niveau5DidactiekNote tone="beoordelaar" />;
  }

  return null;
}