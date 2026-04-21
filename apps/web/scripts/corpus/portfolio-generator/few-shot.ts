// Few-shot bewijs examples for the draft generator.
//
// Source: three real, anonymised, human-reviewed bewijs paragraphs from the
// NWD portfolio corpus (.tmp/portfolio-corpus/anonymized/*, polished via
// apps/web/scripts/corpus/pick-fewshot.ts).
//
// Why this lives in its own file:
// - Makes provenance and review state explicit, separate from the prompt logic.
// - Easy to swap/add/remove individual examples without touching prompts.ts.
// - Each snippet is marked with its source + what register/criterium-type it
//   teaches so future maintainers know why it's here.
//
// Permissions:
// - All 10+ kandidaten in the underlying corpus gave explicit permission to
//   use their materials for training our model, including uploading to model
//   providers. They did NOT give permission to share AS-IS with third parties,
//   so the raw PDFs and extracted JSONs live in .tmp/ and are never committed.
// - Each snippet below went through three scrub passes:
//     1. Filename-derived regex scrub for first names and dates
//     2. Corpus-wide Claude scrub for names, locations, verenigingen, dates
//     3. Targeted per-snippet polish pass (scripts/corpus/pick-fewshot.ts)
//   and was eyeballed by a human before landing here. If you add a new snippet,
//   do the same.

export type FewShotExample = {
  /** Source file in .tmp/portfolio-corpus/anonymized/ */
  source: string;
  /** What register or criterium-type this example teaches the model. */
  teaches: string;
  /** The polished bewijs text — Dutch, first-person, past tense, specific. */
  text: string;
};

export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  {
    source: "4.4_boris.json#p14",
    teaches:
      "Coaching van meerdere instructeurs achter elkaar. Concrete week-nummer, concrete interventie, eerlijk over afwijken van de methode. Geen meta-coda.",
    text: `In week 29 heb ik [KANDIDAAT] begeleid, een tweedejaars instructeur die deze week les gaf aan de Dart-16. Vanuit GPAL was af te leiden dat hij vorig jaar voor het laatst bezig was geweest met de inrichting van de instructiefase. Het lag dan erg voor de hand om hierop door te pakken. Echter zag ik dat [KANDIDAAT] deze week CWO I en CWO II les ging geven, verschillende niveaus. Om deze reden hebben we ervoor gekozen om de leervraag 'Hoe geef ik gedifferentieerd les?' naar voren te halen en deze eerst te behandelen. Hierdoor kon [KANDIDAAT] effectief omgaan met het leerrendement voor de cursisten en heeft hij zelf zijn eigen leerrendement verhoogd. Ik heb deze week bewust gekozen om af te wijken van de methodische opbouw. [KANDIDAAT] had namelijk verschillende niveaus in zijn bootgroep. Door door te pakken naar gedifferentieerd lesgeven, heeft [KANDIDAAT] zijn lessen doelmatiger in kunnen richten op de verschillende niveaus. Doordat zijn veiligheid en plezier op orde was, was het mogelijk om deze sprong te maken.

In week 32 heb ik [KANDIDAAT] begeleid, een eerstejaars instructeur die voor de derde week les gaf. Hij gaf les aan Laser Pico cursisten. Ik heb bij [KANDIDAAT] een deel van de les meegekeken en heb middels observaties van afstand gezien dat de les vrij chaotisch was. Dit herkende ik doordat de boten soms rakelings langs elkaar voeren en er af en toe gegil te horen was vanuit de richting van de boten van [KANDIDAAT]. De oorzaak van de chaos was een te klein parcours voor de wind op dat moment. Ik heb toen besloten om zelf het parcourtje groter te maken. Later in de begeleiding hebben wij stilgestaan bij dit voorval en hebben wij besloten om een leervraag op te stellen met betrekking tot de veiligheid.`,
  },
  {
    source: "alle_niveau_4_mus.json#p68",
    teaches:
      "Planning en organisatie met expliciete trade-offs. Concrete aantallen, concrete overwegingen, hulp gevraagd aan collega's. Toont STAR impliciet (situatie, taak, actie, resultaat).",
    text: `Voor de zondagochtendtraining van [DATUM] heb ik een trainingsindeling gemaakt. Hierbij heb ik geprobeerd rekening te houden met het niveau en de behoeften van de instructeurs en de trainers. Een instructeur die voor de eerste keer niveau 3 gaat lesgeven laten we het liefst zondagochtend mee kijken en samen lesgeven met een ervaren trainer. Er waren twee leercoaches aanwezig die dit weekend graag wilde meekijken bij een training van hun leercoach kindjes.

Ik heb de voorgaande week samen met drie collega-instructeurs een groep Laser Pico's lesgegeven. Om hen meer trainers te laten leren kennen en variatie te bieden zouden ze niet van mij training moeten krijgen. Er zijn drie opleiders naar de zeilschool gekomen om training te geven, dus het is mogelijk om 4+ training aan te bieden. Ik vond dat het meekijken van een instructeur die voor het eerst niveau 3 gaat lesgeven prioriteit had omdat het voor de instructeur erg fijn is om te wennen aan het geven van training op hoger niveau.

Het was een lastige puzzel en daarom heb ik om advies gevraagd bij drie ervaren opleiders. Ik vond dit een goede zet omdat zij veel meer ervaring hebben in het koppelen van trainers aan instructeurs en ik hier weer van kon leren. De uiteindelijke indeling bestond uit vijf groepen met verschillende combinaties van trainers en instructeurs, waarbij CWO 4 training, onofficiële 4+ training en officiële 4+ training werd aangeboden, en waarbij twee begeleidingsmomenten voor leercoaches waren ingepland.

Na afloop heb ik aan twee instructeurs gevraagd hoe het was gegaan, zo kon ik controleren of het een effectieve indeling was en of de eerste jaars instructeurs goed op niveau zaten.`,
  },
  {
    source: "5.7_jade.json#p12",
    teaches:
      "Leercoach-perspectief op een PvB-beoordeling. Observaties over iemand anders z'n portfolio, concrete acties, eigen blinde vlek zichtbaar gemaakt aan het eind.",
    text: `[KANDIDAAT]'s portfolio was heel persoonlijk. Ik kon duidelijk lezen dat ze gedurende haar I4-traject steeds haar leerpunten heeft bijgehouden en hier later een geheel van heeft gemaakt. Dit zorgde er wel voor dat het lastig leesbaar was. Uiteindelijk heb ik alle onderdelen uit de werkprocessen van 4.4 portfolio kunnen terugvinden. Wel vond ik haar aanpassing van het begeleidingsplan onduidelijk. Op [VERENIGING] maken ze gebruik van een standaard methodische opbouw, die in het portfolio was terug te vinden. Ze heeft hierbij geschreven dat ze indien nodig van deze opbouw afwijkt. Hier gaf ze verder geen uitleg bij.

Tijdens het nagesprek heb ik haar gevraagd naar een voorbeeld van een afwijking van de methodische opbouw. Dit kon ze goed uitleggen en onderbouwen. Ik heb haar de opdracht meegegeven dat ze dit toevoegt aan haar portfolio en het mij opstuurt voor ik het afmeld. Dit heeft ze netjes gedaan en de PVB is afgemeld.

Over werkvormen stond niks beschreven in het portfolio. Ook niet in een voorbeeld. Tijdens het reflectie-interview wist [KANDIDAAT] niet wat werkvormen waren en herkende ze ook geen voorbeelden. Volgens werkproces 4.4.3.3 Kiest werkvormen die bijdragen aan het realiseren van doelstellingen voor sportkader, moest dit onderdeel wel in het portfolio zitten. Ik heb toen besloten om haar een extra schrijfopdracht te geven, waarin ze een aantal werkvormen moest beschrijven en een voorbeeld moest geven van waarom ze een werkvorm toepaste.

Ik vond het interessant om te zien dat bij een andere zeilschool de nadruk in het begeleiden en ook in het portfolio ergens anders ligt dan ik gewend ben vanuit mijn eigen zeilschool. Door het portfolio samen met [KANDIDAAT] te lezen, werd ik me ervan bewust dat ik mijn eigen verwachtingen van een portfolio aan de kant moet zetten en moet beoordelen op basis van de CWO-eisen.`,
  },
];

// Renders the few-shot set as a prompt fragment. The voice rules in the system
// prompt tell the model to *match the register* of these examples, not to copy
// content. Each example is labelled so the model understands it's reference
// material, not instructions.
//
// When `examples` is provided (e.g. dynamically retrieved chunks in the Stage B
// fewshot mode), it overrides the hand-picked FEW_SHOT_EXAMPLES. Used to test
// the hypothesis that retrieval works as in-context examples — the same slot
// the static few-shot occupies — rather than as mid-prompt "inspiration."
export function renderFewShotFragment(opts?: {
  examples?: FewShotExample[];
}): string {
  const examples = opts?.examples ?? FEW_SHOT_EXAMPLES;
  const blocks = examples
    .map(
      (ex, i) =>
        `--- VOORBEELD ${i + 1} (bron: ${ex.source}; leert: ${ex.teaches}) ---\n${ex.text.trim()}\n--- EINDE VOORBEELD ${i + 1} ---`,
    )
    .join("\n\n");

  return `BELANGRIJK: hieronder staan drie voorbeelden van echte, geanonimiseerde bewijs-paragrafen uit geslaagde PvB-portfolio's, geschreven door verschillende instructeurs en leercoaches.

GEBRUIK DE VOORBEELDEN VOOR REGISTER EN CONCREETHEID, NIET VOOR LENGTE. De voorbeelden hieronder zijn relatief lang (400-500 woorden) omdat deze specifieke kandidaten veel te vertellen hadden. Jouw bewijs mag korter zijn als de kandidaat minder heeft verteld. Lengte moet volgen uit de inhoud van de antwoorden, niet uit het imiteren van deze voorbeelden.

Overneem NIET:
- de specifieke situaties, personen, plekken, weekindeling of werkprocesnummers uit deze voorbeelden
- de exacte lengte van deze voorbeelden

Overneem WEL:
- de ik-vorm, de verleden tijd
- het benoemen van specifieke weken / cursistsituaties / aantallen / wind-condities WANNEER ZE IN DE ANTWOORDEN STAAN
- het durven benoemen van twijfel of afwijken van de standaard
- het ontbreken van meta-coda ('Dit laat zien dat ik...')

${blocks}`;
}
