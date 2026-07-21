import type { PublicRichting } from "~/lib/kss-public-types";

export type KwalificatieprofielId =
  | "I1"
  | "I2"
  | "I3"
  | "I4"
  | "I5"
  | "L4"
  | "L5"
  | "B4"
  | "B5";

type ProfileRole = "instructeur" | "leercoach" | "beoordelaar";

export type KwalificatieprofielDefinition = {
  id: KwalificatieprofielId;
  group: ProfileRole;
  groupLabel: string;
  selectorLabel: string;
  navLabel: string;
  pathSegments: string[];
  order: number;
  rang: number;
  richting: PublicRichting;
  role: ProfileRole;
  level: string;
  title: string;
  subtitle: string;
  description: string;
  minAge: number;
  prerequisites: string[];
  pvbs: Array<{ code: string; title: string; type: string }>;
  permissions: string[];
  skillLevel: "A" | "B" | "C" | null;
  additionalInfo?: string;
  hasNiveau5Extras?: boolean;
};

const BASE_INSTRUCTEUR = "/diplomalijn/instructeur";

export function kwalificatieprofielHref(
  profiel: Pick<KwalificatieprofielDefinition, "pathSegments">,
) {
  return `${BASE_INSTRUCTEUR}/${profiel.pathSegments.join("/")}`;
}

export function isKwalificatieprofielActive(
  profiel: Pick<KwalificatieprofielDefinition, "pathSegments">,
  selectedLayoutSegments: string[],
) {
  return (
    profiel.pathSegments.length === selectedLayoutSegments.length &&
    profiel.pathSegments.every(
      (segment, index) => selectedLayoutSegments[index] === segment,
    )
  );
}

export const KWALIFICATIEPROFIELEN: KwalificatieprofielDefinition[] = [
  {
    id: "I1",
    group: "instructeur",
    groupLabel: "Instructeur",
    selectorLabel: "I1 — Wal/Waterhulp 1",
    navLabel: "Instructeur 1 (I1)",
    pathSegments: ["niveau-1"],
    order: 101,
    rang: 1,
    richting: "instructeur",
    role: "instructeur",
    level: "I1",
    title: "Wal/Waterhulp 1",
    subtitle: "Assisterende rol",
    description:
      "Instructeur 1 noemen we Wal/Waterhulp omdat deze geen sporttechnische instructie geeft. Deze verricht hand- en spandiensten bij de begeleiding van de sporters en de verzorging van de sportomgeving en -materialen. De Wal/Waterhulp 1 geeft zelf geen sporttechnische informatie of inhoudelijke begeleiding aan de sporters, maar levert wel de randvoorwaarden hiervoor ter ondersteuning van de verantwoordelijke Instructeur 3.",
    minAge: 12,
    prerequisites: ["Zwemdiploma C"],
    pvbs: [
      {
        code: "1.1",
        title: "Assisteren bij lessen/activiteiten",
        type: "Praktijk (mag worden afgenomen door I3, gevalideerd door B4)",
      },
    ],
    permissions: [
      "Geen eindverantwoordelijkheid",
      "Werkt onder directe aansturing en verantwoordelijkheid van minimaal I3",
      "Geeft zelf geen sporttechnische informatie of inhoudelijke begeleiding",
      "Levert randvoorwaarden ter ondersteuning van de verantwoordelijke instructeur",
    ],
    skillLevel: null,
  },
  {
    id: "I2",
    group: "instructeur",
    groupLabel: "Instructeur",
    selectorLabel: "I2 — Instructeur 2",
    navLabel: "Instructeur 2 (I2)",
    pathSegments: ["niveau-2"],
    order: 102,
    rang: 2,
    richting: "instructeur",
    role: "instructeur",
    level: "I2",
    title: "Instructeur 2",
    subtitle: "Beginnend instructeur",
    description:
      "Het diploma Instructeur 2 is het eerste 'echte' instructeursniveau. Een kwalificatie die stelt dat een instructeur voldoende eigenvaardigheid en basis lesgeefvaardigheden bezit om veilige lesgeefsituaties te creëren. Een gediplomeerd Instructeur 2 mag, onder supervisie van een Instructeur 3 of hoger uit dezelfde discipline, lesgeven en de Instructeur 3 adviseren bij het afnemen van vaardigheidstoetsen.",
    minAge: 16,
    prerequisites: ["Zwemdiploma C"],
    pvbs: [
      {
        code: "2.1",
        title: "Geven van lessen",
        type: "Praktijkbeoordeling (onder begeleiding vanaf de wal of vanaf het water)",
      },
      {
        code: "2.2",
        title: "Begeleiden/adviseren bij vaardigheidstoetsen",
        type: "Portfoliobeoordeling",
      },
      {
        code: "3.5",
        title: "Toetsen (optioneel)",
        type: "Portfoliobeoordeling - voor ervaren Instructeur 2 die niet de ambitie heeft om Instructeur 3 te worden, maar wel zelfstandig wil mogen toetsen",
      },
    ],
    permissions: [
      "Lesgeven onder supervisie van een Instructeur 3 of hoger uit dezelfde discipline",
      "De Instructeur 3 adviseren bij het afnemen van vaardigheidstoetsen",
      "Zelfstandig toetsen (alleen met optionele PvB 3.5)",
    ],
    skillLevel: "A",
  },
  {
    id: "I3",
    group: "instructeur",
    groupLabel: "Instructeur",
    selectorLabel: "I3 — Instructeur 3",
    navLabel: "Instructeur 3 (I3)",
    pathSegments: ["niveau-3"],
    order: 103,
    rang: 3,
    richting: "instructeur",
    role: "instructeur",
    level: "I3",
    title: "Instructeur 3",
    subtitle: "Zelfstandig instructeur",
    description:
      "Een Instructeur 3 verzorgt zelfstandig op een veilige en didactisch verantwoorde manier leuke en leerzame lessen voor zowel beginnende als gevorderde cursisten. Daarnaast behoort het aansturen/begeleiden van Instructeurs 2 en het afnemen van vaardigheidstoetsen en het aftekenen van diploma's tot de kerntaken. Ook is de Instructeur 3 bevoegd het NWD A van de Instructeur 2 te toetsen.",
    minAge: 17,
    prerequisites: ["Zwemdiploma C"],
    pvbs: [
      {
        code: "3.1",
        title: "Geven van lessen",
        type: "Praktijk- en Portfoliobeoordeling",
      },
      {
        code: "3.4",
        title: "Aansturen sportkader",
        type: "Portfoliobeoordeling",
      },
      {
        code: "3.5",
        title: "Afnemen van vaardigheidstoetsen",
        type: "Portfoliobeoordeling",
      },
    ],
    permissions: [
      "Zelfstandig lesgeven aan beginnende en gevorderde cursisten",
      "Aansturen en begeleiden van Instructeurs 2",
      "Afnemen van vaardigheidstoetsen",
      "Aftekenen van diploma's",
      "Examineren van NWD A",
    ],
    skillLevel: "B",
    additionalInfo:
      "De portfoliobeoordelingen van 3.1, 3.4 en 3.5 worden in combinatie afgenomen — je levert één portfolio aan met de uitgewerkte opdrachten voor alle drie. Op basis daarvan bepaalt de beoordelaar of de praktijkbeoordeling voor 3.1 (Geven van lessen) kan worden afgenomen.",
  },
  {
    id: "I4",
    group: "instructeur",
    groupLabel: "Instructeur",
    selectorLabel: "I4 — Instructeur 4",
    navLabel: "Instructeur 4 (I4)",
    pathSegments: ["niveau-4"],
    order: 104,
    rang: 4,
    richting: "instructeur",
    role: "instructeur",
    level: "I4",
    title: "Instructeur 4",
    subtitle: "Opleider van instructeurs",
    description:
      "Een Instructeur 4 geeft les/training in de eigenvaardigheid van Instructeurs 3 in opleiding en is bevoegd om deze middels een examen te toetsen. Dit niveau vormt de brug tussen het lesgeven aan cursisten en het opleiden van andere instructeurs.",
    minAge: 18,
    prerequisites: [
      "In het bezit zijn van Instructeur 3 in de desbetreffende discipline",
      "In het bezit zijn van Klein Vaarbewijs I (KVB-I)",
    ],
    pvbs: [
      {
        code: "4.1",
        title: "Geven van trainingen",
        type: "Praktijk- en Portfoliobeoordeling",
      },
      {
        code: "4.8",
        title: "Afnemen van vaardigheidstoetsen",
        type: "Praktijkbeoordeling",
      },
    ],
    permissions: [
      "Training geven aan Instructeur 3 in opleiding in de eigenvaardigheid",
      "Examineren van NWD B",
    ],
    skillLevel: "C",
  },
  {
    id: "I5",
    group: "instructeur",
    groupLabel: "Instructeur",
    selectorLabel: "I5 — Instructeur 5",
    navLabel: "Instructeur 5 (I5)",
    pathSegments: ["niveau-5"],
    order: 105,
    rang: 5,
    richting: "instructeur",
    role: "instructeur",
    level: "I5",
    title: "Instructeur 5",
    subtitle: "Hoogste instructeursniveau",
    description:
      "Een Instructeur 5 geeft les/training in de eigenvaardigheid van Instructeurs 4 in opleiding en is bevoegd om samen met een tweede Instructeur 5 vast te stellen of de kandidaat op het vereiste niveau is. De les/training mag zelf gepland worden maar moet binnen de gestelde termijn aangemeld worden bij de Watersport Academy.",
    minAge: 18,
    prerequisites: [
      "In het bezit zijn van Instructeur 4 in de desbetreffende discipline",
    ],
    pvbs: [
      {
        code: "5.1",
        title: "Geven van lessen",
        type: "Praktijk- en Portfoliobeoordeling",
      },
    ],
    permissions: [
      "Training geven aan Instructeur 4 in opleiding in de eigenvaardigheid",
      "Samen met een tweede Instructeur 5 vaststellen of een kandidaat op NWD C niveau zit",
    ],
    skillLevel: null,
    hasNiveau5Extras: true,
  },
  {
    id: "L4",
    group: "leercoach",
    groupLabel: "Leercoach",
    selectorLabel: "L4 — Leercoach 4",
    navLabel: "Leercoach 4 (L4)",
    pathSegments: ["leercoach", "niveau-4"],
    order: 204,
    rang: 4,
    richting: "leercoach",
    role: "leercoach",
    level: "L4",
    title: "Leercoach 4",
    subtitle: "Opleider van instructeurs 1 t/m 3",
    description:
      "De Leercoach 4 is op de eigen opleidingslocatie verantwoordelijk voor het opleiden van Instructeurs 1 tot en met 3 en zorgt voor kennisoverdracht en begeleiding in de praktijk en ontwikkeling van de didactische-, leidinggevende- en toetsingsvaardigheden.",
    minAge: 18,
    prerequisites: [
      "In het bezit zijn van Instructeur 3 in de desbetreffende discipline",
    ],
    pvbs: [
      {
        code: "4.4",
        title: "Bevordering competentieontwikkeling sportkader",
        type: "Praktijk- en Portfoliobeoordeling",
      },
      {
        code: "4.5",
        title: "Samenwerken begeleidingsteam en onderhouden contacten",
        type: "Portfoliobeoordeling",
      },
    ],
    permissions: [
      "Opleiden van Instructeurs 1 tot en met 3 op de eigen opleidingslocatie",
      "Kennisoverdracht en begeleiding in de praktijk",
      "Ontwikkeling van didactische-, leidinggevende- en toetsingsvaardigheden",
      "Ondersteuning bij het opbouwen van portfolio's van kandidaten",
    ],
    skillLevel: null,
  },
  {
    id: "L5",
    group: "leercoach",
    groupLabel: "Leercoach",
    selectorLabel: "L5 — Leercoach 5",
    navLabel: "Leercoach 5 (L5)",
    pathSegments: ["leercoach", "niveau-5"],
    order: 205,
    rang: 5,
    richting: "leercoach",
    role: "leercoach",
    level: "L5",
    title: "Leercoach 5",
    subtitle: "Eindverantwoordelijk voor opleidingstraject",
    description:
      "Een Leercoach 5 is binnen de leslocatie eindverantwoordelijk voor de ontwikkeling van het opleidingstraject en de opleiding van Instructeurs 4, Leercoaches 4 en PvB-beoordelaars 4. Daarmee is de Leercoach 5 dus eindverantwoordelijk voor de kwaliteit van de vaar- en kaderopleidingen op de opleidingslocatie.",
    minAge: 18,
    prerequisites: [
      "In het bezit zijn van Beoordelaar 4 (dus ook Leercoach 4) in de desbetreffende discipline",
      "In het bezit zijn van Instructeur 4 in de desbetreffende discipline",
    ],
    pvbs: [
      {
        code: "5.3",
        title: "Ontwikkelen opleidingsprogramma's",
        type: "Portfoliobeoordeling en Assessment",
      },
      {
        code: "5.4",
        title: "Coachen van cursisten",
        type: "Praktijk- en Portfoliobeoordeling",
      },
      {
        code: "5.5",
        title: "Samenwerken begeleidingsteam en onderhouden contacten",
        type: "Portfoliobeoordeling en Assessment",
      },
    ],
    permissions: [
      "Eindverantwoordelijk voor de ontwikkeling van het opleidingstraject",
      "Opleiding van Instructeurs 4, Leercoaches 4 en PvB-beoordelaars 4",
      "Eindverantwoordelijk voor de kwaliteit van vaar- en kaderopleidingen op de opleidingslocatie",
    ],
    skillLevel: null,
    hasNiveau5Extras: true,
  },
  {
    id: "B4",
    group: "beoordelaar",
    groupLabel: "PvB-beoordelaar",
    selectorLabel: "B4 — PvB-beoordelaar 4",
    navLabel: "PvB-beoordelaar 4 (B4)",
    pathSegments: ["pvb-beoordelaar", "niveau-4"],
    order: 304,
    rang: 4,
    richting: "pvb_beoordelaar",
    role: "beoordelaar",
    level: "B4",
    title: "PvB-beoordelaar 4",
    subtitle: "Afnemen van PvB's voor niveau 1 t/m 3",
    description:
      "Een PvB-beoordelaar 4 is binnen de eigen opleidingslocatie verantwoordelijk voor het afnemen van PvB's voor Instructeurs 1, 2 en 3. Door het 'vier-ogen principe' werkt de beoordelaar samen met de Leercoach: beiden moeten goedkeuring geven voor het afronden van een kandidaat.",
    minAge: 18,
    prerequisites: [
      "In het bezit zijn van Leercoach 4 in de desbetreffende discipline",
    ],
    pvbs: [
      {
        code: "4.7",
        title: "Afnemen van PvB's",
        type: "Portfoliobeoordeling",
      },
    ],
    permissions: [
      "Afnemen van PvB's voor Instructeurs 1, 2 en 3 binnen de eigen opleidingslocatie",
      "Valideren/aftekenen van beoordelingsformulieren voor Wal/Waterhulp 1",
      "Samenwerken met Leercoach volgens het vier-ogen principe",
    ],
    skillLevel: null,
  },
  {
    id: "B5",
    group: "beoordelaar",
    groupLabel: "PvB-beoordelaar",
    selectorLabel: "B5 — PvB-beoordelaar 5",
    navLabel: "PvB-beoordelaar 5 (B5)",
    pathSegments: ["pvb-beoordelaar", "niveau-5"],
    order: 305,
    rang: 5,
    richting: "pvb_beoordelaar",
    role: "beoordelaar",
    level: "B5",
    title: "PvB-beoordelaar 5",
    subtitle: "Externe beoordelaar namens Watersport Academy",
    description:
      "Een PvB-beoordelaar 5 heeft als taak om namens de Watersport Academy PvB's van Instructeurs 4, Leercoaches 4 en PvB-beoordelaars 4 af te nemen. Deze externe beoordelaar wordt door de Watersport Academy toegewezen aan kandidaten en mag niet actief zijn op dezelfde opleidingslocatie als de kandidaat.",
    minAge: 18,
    prerequisites: [
      "In het bezit zijn van Leercoach 5 in de desbetreffende discipline",
    ],
    pvbs: [
      {
        code: "5.7",
        title: "Afnemen van PvB's",
        type: "Portfoliobeoordeling",
      },
    ],
    permissions: [
      "Afnemen van PvB's voor Instructeurs 4 namens de Watersport Academy",
      "Afnemen van PvB's voor Leercoaches 4 namens de Watersport Academy",
      "Afnemen van PvB's voor PvB-beoordelaars 4 namens de Watersport Academy",
      "Landelijke kwaliteitsborging van niveau 4 kwalificaties",
    ],
    skillLevel: null,
    hasNiveau5Extras: true,
  },
];

export function findKwalificatieprofiel(id: string | null) {
  if (!id) return undefined;
  return KWALIFICATIEPROFIELEN.find((profiel) => profiel.id === id);
}

export function kwalificatieprofielenByGroup(group: ProfileRole) {
  return KWALIFICATIEPROFIELEN.filter((profiel) => profiel.group === group);
}

export const DEFAULT_KWALIFICATIEPROFIEL_ID: KwalificatieprofielId = "I3";
