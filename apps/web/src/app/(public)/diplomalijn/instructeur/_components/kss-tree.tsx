import { getPublicKssTree } from "~/lib/kss-public";
import type { PublicRichting } from "~/lib/kss-public-types";
import { KssProfielView } from "./kss-tree-view";

export async function KssCompetentieTree({
  rang,
  richting,
}: {
  rang: number;
  richting: PublicRichting;
}) {
  const profielen = await getPublicKssTree({ rang, richting });
  return <KssProfielView profielen={profielen} />;
}
