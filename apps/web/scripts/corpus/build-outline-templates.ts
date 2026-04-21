// Build and persist outline templates for every populated kwalificatieprofiel.
//
// Phase 1 approach: deterministic from the rubric. We generate the wrapper
// sections (voorwoord, zeil-cv, inleiding, reflectie, bijlagen) based on the
// profiel's richting + niveau, and the middle sections directly from the
// werkprocessen in the rubric. No LLM calls, no corpus analysis — this gives
// us a solid MVP that's easy to iterate on.
//
// Phase 2 extension: refine descriptions via an LLM pass over the ingested
// corpus per profiel. Bump version number.
//
// Run:
//   pnpm -C apps/web corpus:build-outline-templates

import { AiCorpus, withDatabase } from "@nawadi/core";
import pg from "pg";

const PGURI =
  process.env.PGURI ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

type RichtingLabel = "Instructeur" | "Leercoach" | "PvB-beoordelaar";

function richtingLabel(
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar",
): RichtingLabel {
  switch (richting) {
    case "instructeur":
      return "Instructeur";
    case "leercoach":
      return "Leercoach";
    case "pvb_beoordelaar":
      return "PvB-beoordelaar";
  }
}

type KerntaakRow = {
  kerntaakId: string;
  kerntaakTitel: string;
  kerntaakRang: number;
};

type WerkprocesRow = KerntaakRow & {
  werkprocesId: string;
  werkprocesTitel: string;
  werkprocesResultaat: string;
  werkprocesRang: number;
  criteriumCount: number;
};

type ProfielRow = {
  profielId: string;
  profielTitel: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  niveauRang: number;
};

async function loadAllProfielenWithWerkprocessen(): Promise<
  Array<ProfielRow & { werkprocessen: WerkprocesRow[] }>
> {
  const client = new pg.Client({ connectionString: PGURI });
  await client.connect();
  try {
    const res = await client.query<{
      profielId: string;
      profielTitel: string;
      richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
      niveauRang: number;
      kerntaakId: string | null;
      kerntaakTitel: string | null;
      kerntaakRang: number | null;
      werkprocesId: string | null;
      werkprocesTitel: string | null;
      werkprocesResultaat: string | null;
      werkprocesRang: number | null;
      criteriumCount: number;
    }>(
      `
      SELECT
        kp.id AS "profielId",
        kp.titel AS "profielTitel",
        kp.richting AS richting,
        n.rang AS "niveauRang",
        kt.id AS "kerntaakId",
        kt.titel AS "kerntaakTitel",
        kt.rang AS "kerntaakRang",
        wp.id AS "werkprocesId",
        wp.titel AS "werkprocesTitel",
        wp.resultaat AS "werkprocesResultaat",
        wp.rang AS "werkprocesRang",
        (SELECT COUNT(*) FROM kss.beoordelingscriterium bc WHERE bc.werkproces_id = wp.id)::int AS "criteriumCount"
      FROM kss.kwalificatieprofiel kp
      JOIN kss.niveau n ON n.id = kp.niveau_id
      LEFT JOIN kss.kerntaak kt ON kt.kwalificatieprofiel_id = kp.id
      LEFT JOIN kss.werkproces wp ON wp.kerntaak_id = kt.id
      ORDER BY kp.richting, n.rang, kt.rang NULLS LAST, wp.rang NULLS LAST
      `,
    );

    const byProfiel = new Map<string, ProfielRow & { werkprocessen: WerkprocesRow[] }>();
    for (const row of res.rows) {
      if (!byProfiel.has(row.profielId)) {
        byProfiel.set(row.profielId, {
          profielId: row.profielId,
          profielTitel: row.profielTitel,
          richting: row.richting,
          niveauRang: row.niveauRang,
          werkprocessen: [],
        });
      }
      const entry = byProfiel.get(row.profielId)!;
      if (row.werkprocesId && row.kerntaakId) {
        entry.werkprocessen.push({
          kerntaakId: row.kerntaakId,
          kerntaakTitel: row.kerntaakTitel ?? "",
          kerntaakRang: row.kerntaakRang ?? 0,
          werkprocesId: row.werkprocesId,
          werkprocesTitel: row.werkprocesTitel ?? "",
          werkprocesResultaat: row.werkprocesResultaat ?? "",
          werkprocesRang: row.werkprocesRang ?? 0,
          criteriumCount: row.criteriumCount,
        });
      }
    }
    return [...byProfiel.values()];
  } finally {
    await client.end();
  }
}

// Deterministic outline template from the rubric. No LLM calls.
function buildOutlineFromProfiel(
  profiel: ProfielRow & { werkprocessen: WerkprocesRow[] },
): Array<{
  ordinal: number;
  kind:
    | "voorwoord"
    | "zeil_cv"
    | "inleiding"
    | "context"
    | "pvb_werkproces"
    | "reflectie"
    | "bijlagen"
    | "other";
  title: string;
  description: string;
  targetWordCountMin: number | null;
  targetWordCountMax: number | null;
  filledBy: "user" | "ai" | "rubric_driven";
  werkprocesId: string | null;
  kerntaakId: string | null;
}> {
  const label = richtingLabel(profiel.richting);
  const sections: ReturnType<typeof buildOutlineFromProfiel> = [];
  let ordinal = 0;

  // ---- Front matter ----
  sections.push({
    ordinal: ordinal++,
    kind: "voorwoord",
    title: "Voorwoord",
    description: `Een persoonlijke inleiding. Wie ben je, waarom doe je deze PvB ${label} ${profiel.niveauRang}, hoe ben je instructeur geworden, op welke vereniging of zeilschool werk je, en wat hoop je met dit portfolio te laten zien. Schrijf in de ik-vorm, ontspannen toon. Beoordelaars lezen dit als eerste — een concreet, persoonlijk voorwoord zet gelijk de goede toon.`,
    targetWordCountMin: 200,
    targetWordCountMax: 500,
    filledBy: "user",
    werkprocesId: null,
    kerntaakId: null,
  });

  sections.push({
    ordinal: ordinal++,
    kind: "zeil_cv",
    title: "Zeil-CV en personalia",
    description: `Naam, geboortedatum, pasnummer, vereniging en sportdiscipline. Daarna een korte chronologische CV van je ${label.toLowerCase()}sloopbaan: eerder behaalde kwalificaties, sinds wanneer je lesgeeft/coacht/beoordeelt, in welke boottypes, eventueel wedstrijdervaring of andere relevante NOC*NSF-achtergrond. Kort en feitelijk, bullet points mogen.`,
    targetWordCountMin: 100,
    targetWordCountMax: 300,
    filledBy: "user",
    werkprocesId: null,
    kerntaakId: null,
  });

  sections.push({
    ordinal: ordinal++,
    kind: "inleiding",
    title: "Inleiding bij dit portfolio",
    description: `Korte lezerswijzer: welke PvB('s) dit portfolio dekt, hoe het is opgebouwd, eventueel een verantwoording van gemaakte keuzes (bijvoorbeeld welke kerntaken je hebt gekozen, welke bijlagen je hebt meegeleverd). Dit blok is geen reflectie — het is orientering voor de beoordelaar.`,
    targetWordCountMin: 150,
    targetWordCountMax: 400,
    filledBy: "user",
    werkprocesId: null,
    kerntaakId: null,
  });

  // ---- Middle: one section per werkproces, grouped by kerntaak ----
  // Group werkprocessen by kerntaak so we can add a kerntaak-level intro for
  // kandidaten doing multi-kerntaak portfolios (e.g. Leercoach 5 with 3 kerntaken).
  const werkprocessenByKerntaak = new Map<string, WerkprocesRow[]>();
  const kerntaakOrder: string[] = [];
  for (const wp of profiel.werkprocessen) {
    if (!werkprocessenByKerntaak.has(wp.kerntaakId)) {
      werkprocessenByKerntaak.set(wp.kerntaakId, []);
      kerntaakOrder.push(wp.kerntaakId);
    }
    werkprocessenByKerntaak.get(wp.kerntaakId)!.push(wp);
  }

  for (const kerntaakId of kerntaakOrder) {
    const wps = werkprocessenByKerntaak.get(kerntaakId)!;
    const first = wps[0]!;

    // Kerntaak intro — only when there's more than one kerntaak in the profiel,
    // so "single kerntaak" portfolios stay lean.
    if (werkprocessenByKerntaak.size > 1) {
      sections.push({
        ordinal: ordinal++,
        kind: "context",
        title: `Over ${first.kerntaakTitel}`,
        description: `Een korte inleiding (1-2 alinea's) op deze kerntaak: waarom je hem kiest als onderdeel van je PvB, in welke context je dit werk doet (welke cursisten, welke vereniging, welk trainingstraject). Beoordelaars gebruiken dit om de bewijs-paragrafen hierna in perspectief te plaatsen. Alleen nodig als je meerdere kerntaken in dit portfolio hebt.`,
        targetWordCountMin: 150,
        targetWordCountMax: 350,
        filledBy: "user",
        werkprocesId: null,
        kerntaakId,
      });
    }

    for (const wp of wps) {
      // Indicative word count: ~350 words per criterium is our Stage A target.
      const minW = 250 * wp.criteriumCount;
      const maxW = 450 * wp.criteriumCount;
      sections.push({
        ordinal: ordinal++,
        kind: "pvb_werkproces",
        title: `${wp.werkprocesTitel}`,
        description: `Bewijs voor de ${wp.criteriumCount} beoordelingscriteria van dit werkproces. Resultaat van het werkproces volgens de rubriek: "${wp.werkprocesResultaat}". Dit gedeelte wordt gegenereerd op basis van jouw antwoorden; jij controleert en bewerkt waar nodig.`,
        targetWordCountMin: minW,
        targetWordCountMax: maxW,
        filledBy: "ai",
        werkprocesId: wp.werkprocesId,
        kerntaakId: wp.kerntaakId,
      });
    }
  }

  // ---- Closing ----
  sections.push({
    ordinal: ordinal++,
    kind: "reflectie",
    title: "Reflectie",
    description: `Een persoonlijke reflectie op je leerproces richting deze PvB. Welke leerpunten heb je opgepikt, wat heeft je verrast, waar ben je tegen grenzen gelopen, en hoe ga je dit meenemen in je volgende periode als ${label.toLowerCase()}? Reflectie is waar beoordelaars zelfbewustzijn zoeken — durf kwetsbaar te zijn over wat nog niet goed ging.`,
    targetWordCountMin: 400,
    targetWordCountMax: 800,
    filledBy: "user",
    werkprocesId: null,
    kerntaakId: null,
  });

  sections.push({
    ordinal: ordinal++,
    kind: "bijlagen",
    title: "Bijlagen",
    description: `Ondersteunend materiaal. Verwijs expliciet vanuit de werkproces-bewijzen naar deze bijlagen (bv. "zie bijlage 3 — videofragment van de aankomst-oefening"). Gebruikelijke bijlagen: videofragmenten van lessen of trainingen, feedback-brieven van collega's of mentor, eigen lesplannen of trainingsopbouw, evaluatie-formulieren van cursisten, foto's van je begeleiding.`,
    targetWordCountMin: null,
    targetWordCountMax: null,
    filledBy: "user",
    werkprocesId: null,
    kerntaakId: null,
  });

  return sections;
}

// ---- Run ----

console.log("Building outline templates for every populated profiel...");

await withDatabase({ connectionString: PGURI }, async () => {
  const profielen = await loadAllProfielenWithWerkprocessen();
  const withWerkprocessen = profielen.filter(
    (p) => p.werkprocessen.length > 0,
  );
  console.log(
    `Found ${withWerkprocessen.length} populated profielen (skipping ${profielen.length - withWerkprocessen.length} stubs).`,
  );

  for (const profiel of withWerkprocessen) {
    const sections = buildOutlineFromProfiel(profiel);
    const result = await AiCorpus.upsertOutlineTemplate({
      profielId: profiel.profielId,
      sections,
      notes: {
        generator: "scripts/corpus/build-outline-templates.ts",
        strategy: "deterministic-from-rubric-v1",
        werkproces_count: profiel.werkprocessen.length,
      },
    });
    console.log(
      `  ✓ ${profiel.profielTitel} (${profiel.werkprocessen.length} werkprocessen) → template v${result.version} (${sections.length} sections)`,
    );
  }
});
console.log("Done.");
