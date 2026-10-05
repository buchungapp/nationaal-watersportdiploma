export type PublicRichting = "instructeur" | "leercoach" | "pvb_beoordelaar";

export type PublicKssCriterium = {
  id: string;
  title: string;
  omschrijving: string;
  rang: number;
};

export type PublicKssWerkproces = {
  id: string;
  titel: string;
  resultaat: string;
  rang: number;
  onderdeelTypes: Array<"portfolio" | "praktijk">;
  beoordelingscriteria: PublicKssCriterium[];
};

export type PublicKssOnderdeel = {
  id: string;
  type: "portfolio" | "praktijk";
  werkprocesIds: string[];
};

export type PublicKssKerntaak = {
  id: string;
  titel: string;
  type: "verplicht" | "facultatief";
  rang: number | null;
  onderdelen: PublicKssOnderdeel[];
  werkprocessen: PublicKssWerkproces[];
};

export type PublicKssProfiel = {
  id: string;
  titel: string;
  richting: PublicRichting;
  niveau: { id: string; rang: number };
  kerntaken: PublicKssKerntaak[];
};
