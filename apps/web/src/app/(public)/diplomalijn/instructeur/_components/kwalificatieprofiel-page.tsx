import { notFound } from "next/navigation";
import { getPublicKssTree } from "~/lib/kss-public";
import {
  findKwalificatieprofiel,
  type KwalificatieprofielId,
} from "../_data/kwalificatieprofielen";
import { KwalificatieprofielExtras } from "./kwalificatieprofiel-extras";
import { KssProfielView } from "./kss-tree-view";
import { QualificationProfile } from "./qualification-profile";

export async function KwalificatieprofielPageContent({
  profielId,
}: {
  profielId: KwalificatieprofielId;
}) {
  const profiel = findKwalificatieprofiel(profielId);
  if (!profiel) notFound();

  const tree = await getPublicKssTree({
    rang: profiel.rang,
    richting: profiel.richting,
  });

  return (
    <div className="not-prose space-y-8">
      <QualificationProfile
        role={profiel.role}
        level={profiel.level}
        title={profiel.title}
        subtitle={profiel.subtitle}
        description={profiel.description}
        minAge={profiel.minAge}
        prerequisites={profiel.prerequisites}
        pvbs={profiel.pvbs}
        permissions={profiel.permissions}
        skillLevel={profiel.skillLevel}
        additionalInfo={profiel.additionalInfo}
      />

      {profiel.hasNiveau5Extras ? (
        <KwalificatieprofielExtras profielId={profiel.id} />
      ) : null}

      <div>
        <h2 className="mb-2 text-xl font-semibold text-slate-900">
          Competentieprofiel
        </h2>
        <p className="mb-6 text-sm text-slate-600">
          De kerntaken, werkprocessen en beoordelingscriteria hieronder komen
          direct uit het officiële KSS-kwalificatieprofiel. Klik een werkproces
          aan om de beoordelingscriteria te bekijken.
        </p>
        <KssProfielView profielen={tree} />
      </div>
    </div>
  );
}
