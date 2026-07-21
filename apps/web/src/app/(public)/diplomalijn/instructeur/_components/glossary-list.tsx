import slugify from "@sindresorhus/slugify";

type Scope = "instructeur" | "leercoach" | "beoordelaar" | "algemeen";

type Entry = {
  term: string;
  aka?: string[];
  scope: Scope;
  body: string;
  seeAlso?: string[];
};

const scopeTokens: Record<Scope, { chip: string; label: string }> = {
  instructeur: {
    chip: "bg-branding-light/10 text-branding-dark",
    label: "Instructeur",
  },
  leercoach: {
    chip: "bg-branding-orange/10 text-branding-orange",
    label: "Leercoach",
  },
  beoordelaar: {
    chip: "bg-branding-dark/10 text-branding-dark",
    label: "Beoordelaar",
  },
  algemeen: {
    chip: "bg-slate-100 text-slate-700",
    label: "Algemeen",
  },
};

const entries: Entry[] = [
  {
    term: "KSS",
    aka: ["Kwalificatiestructuur Sport"],
    scope: "algemeen",
    body: "Landelijk raamwerk van NOC*NSF dat de eisen, competenties en toetsing van sport-kaderopleidingen vastlegt. Elke sportbond werkt dit uit naar kwalificatieprofielen — voor watersport doet het Watersportverbond dat.",
    seeAlso: ["NOC*NSF", "Kwalificatieprofiel"],
  },
  {
    term: "Kwalificatieprofiel",
    scope: "algemeen",
    body: "Formele beschrijving van een rol (bijv. Instructeur 3) binnen de KSS. Bevat kerntaken, werkprocessen en beoordelingscriteria die vastleggen wat iemand moet kunnen.",
    seeAlso: ["Kerntaak", "Werkproces"],
  },
  {
    term: "Kerntaak",
    scope: "algemeen",
    body: 'Een hoofdactiviteit binnen een kwalificatieprofiel, zoals "Geven van lessen" of "Afnemen van vaardigheidstoetsen". Elke kerntaak wordt in een PvB getoetst.',
    seeAlso: ["Werkproces", "PvB"],
  },
  {
    term: "Werkproces",
    scope: "algemeen",
    body: 'Onderdeel van een kerntaak dat een concrete werkzaamheid beschrijft, met een meetbaar resultaat (bijv. "Werkproces 3.1.3 Voert lessen uit" → "De les is gedifferentieerd").',
  },
  {
    term: "PvB",
    aka: ["Proeve van Bekwaamheid"],
    scope: "algemeen",
    body: "De examenvorm van de KSS. Een kandidaat toont per kerntaak aan dat hij de werkprocessen beheerst, via portfoliobeoordeling en/of praktijkbeoordeling. Afgenomen volgens het vier-ogen-principe (beoordelaar + leercoach).",
    seeAlso: [
      "Portfoliobeoordeling",
      "Praktijkbeoordeling",
      "Vier-ogen-principe",
    ],
  },
  {
    term: "Portfoliobeoordeling",
    scope: "algemeen",
    body: "Schriftelijk bewijsstuk waarin een kandidaat aantoont hoe hij werkprocessen heeft uitgevoerd. Ingediend vooraf, beoordeeld door een PvB-beoordelaar met een leercoach.",
  },
  {
    term: "Praktijkbeoordeling",
    scope: "algemeen",
    body: "Live observatie van een kandidaat die de werkprocessen uitvoert (typisch een les). De beoordelaar kijkt mee en toetst aan de beoordelingscriteria.",
  },
  {
    term: "Vier-ogen-principe",
    scope: "algemeen",
    body: "Beoordelingsprincipe waarbij een PvB pas is afgerond als zowel de PvB-beoordelaar als de leercoach het goedgekeurd hebben. Voorkomt eenzijdige besluiten.",
    seeAlso: ["PvB", "Leercoach"],
  },
  {
    term: "Herkansing",
    scope: "algemeen",
    body: "Nieuwe kans om een niet-gehaald PvB-onderdeel opnieuw af te leggen, volgens dezelfde procedure als de oorspronkelijke PvB. Maximaal twee herkansingen per PvB-onderdeel — dus drie kansen in totaal — binnen een jaar na de eerste aanvraag.",
    seeAlso: ["PvB"],
  },
  {
    term: "Leercoach",
    scope: "leercoach",
    body: "Rol die kandidaten binnen de eigen opleidingslocatie begeleidt en coacht. Werkt samen met de PvB-beoordelaar volgens het vier-ogen-principe. Niveau 4 = opleider I1–I3, niveau 5 = eindverantwoordelijk voor opleidingen.",
  },
  {
    term: "PvB-beoordelaar",
    scope: "beoordelaar",
    body: "Rol die PvB's afneemt. B4 beoordeelt binnen de eigen opleidingslocatie (niveaus 1–3). B5 is een externe beoordelaar voor PvB's op niveau 4 (I4, L4, B4); niveau 5 wordt afgerond onder direct toezicht van de opleidingskundige van het Watersportverbond.",
  },
  {
    term: "Instructiegroep",
    scope: "algemeen",
    body: "Cluster van cursussen met dezelfde methodisch-didactische context: Afstandsinstructie, Aan boord instructie of Getijdenwater. Vrijstellingen gelden binnen dezelfde instructiegroep.",
    seeAlso: ["Vrijstelling", "Cursusgebondenheid"],
  },
  {
    term: "Cursusgebondenheid",
    scope: "algemeen",
    body: "Eigenvaardigheidsdiploma's (NWD A, B, C) zijn cursusgebonden: ze kennen geen onderlinge vrijstellingen. Een vrijstelling geldt alleen voor PvB-kerntaken binnen dezelfde instructiegroep, niet voor eigenvaardigheid.",
    seeAlso: ["Eigenvaardigheid", "Vrijstelling"],
  },
  {
    term: "Vrijstelling",
    scope: "algemeen",
    body: "Regeling waarbij eerder behaalde werkprocessen of kerntaken niet opnieuw hoeven te worden getoetst wanneer een kandidaat uitbreidt naar een andere cursus binnen dezelfde instructiegroep.",
    seeAlso: ["Instructiegroep"],
  },
  {
    term: "Eigenvaardigheid",
    aka: ["EV"],
    scope: "instructeur",
    body: "Het persoonlijke vaardigheidsniveau van een instructeur in de discipline. Voor I2, I3 en I4 geldt respectievelijk NWD A, NWD B en NWD C. Vastgesteld via eigenvaardigheidsexamens of (voor NWD C) door twee Instructeurs 5.",
    seeAlso: ["NWD A", "NWD B", "NWD C"],
  },
  {
    term: "NWD A",
    scope: "instructeur",
    body: "Basisniveau eigenvaardigheid. Vereist voor Instructeur 2. Behaald via het NWD A-eigenvaardigheidsexamen.",
  },
  {
    term: "NWD B",
    scope: "instructeur",
    body: "Gevorderd niveau eigenvaardigheid. Vereist voor Instructeur 3. Behaald via het NWD B-eigenvaardigheidsexamen.",
  },
  {
    term: "NWD C",
    scope: "instructeur",
    body: "Hoogste niveau eigenvaardigheid. Vereist voor Instructeur 4. Wordt vastgesteld door twee Instructeurs 5 en kent geen vaste examenvorm.",
  },
  {
    term: "KVB-I",
    aka: ["Klein Vaarbewijs I"],
    scope: "instructeur",
    body: "Wettelijk vaarbewijs voor het besturen van motorvaartuigen. Aanvullende eis voor Instructeur 4, los van de eigenvaardigheid.",
  },
  {
    term: "NOC*NSF",
    scope: "algemeen",
    body: "Nationaal Olympisch Comité * Nederlandse Sport Federatie. Koepel waar alle sportbonden bij zijn aangesloten, licenserende instantie voor de KSS.",
  },
  {
    term: "Watersportverbond",
    scope: "algemeen",
    body: "Koninklijk Nederlands Watersportverbond. Licentiehouder van de KSS-kaderopleidingen voor de watersport en delegator van opleidingen en PvB-afnames aan erkende opleidingslocaties.",
  },
  {
    term: "Watersport Academy",
    scope: "algemeen",
    body: "De zeilopleiding van het Watersportverbond zelf. Gebruikt dezelfde diplomalijn als het NWD, ontstaan uit de samenwerkingsovereenkomst tussen het Watersportverbond en het NWD eind 2025.",
    seeAlso: ["Watersportverbond"],
  },
];

entries.sort((a, b) => a.term.localeCompare(b.term, "nl"));

export function GlossaryList() {
  return (
    <div className="not-prose flex flex-col gap-3">
      {entries.map((entry) => {
        const anchor = slugify(entry.term, { lowercase: true });
        const scope = scopeTokens[entry.scope];
        return (
          <article
            key={entry.term}
            id={anchor}
            className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5"
          >
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-base font-semibold text-slate-900">
                {entry.term}
              </h3>
              {entry.aka && entry.aka.length > 0 && (
                <span className="text-sm italic text-slate-500">
                  ({entry.aka.join(", ")})
                </span>
              )}
              <span
                className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${scope.chip}`}
              >
                {scope.label}
              </span>
            </header>
            <p className="mt-2 text-sm text-slate-700">{entry.body}</p>
            {entry.seeAlso && entry.seeAlso.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span>Zie ook:</span>
                {entry.seeAlso.map((ref) => (
                  <a
                    key={ref}
                    href={`#${slugify(ref, { lowercase: true })}`}
                    className="rounded bg-slate-50 px-1.5 py-0.5 text-slate-700 hover:bg-slate-100"
                  >
                    {ref}
                  </a>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
