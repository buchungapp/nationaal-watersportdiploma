export type CompareCompetency = {
  competencyId: string;
  handle: string;
  title: string;
  weight: number;
  requirement: string | null;
};

export type CompareModule = {
  moduleId: string;
  handle: string;
  title: string;
  weight: number;
  competencies: CompareCompetency[];
};

export type CompareLevel = {
  programId: string;
  label: string;
  letter: string;
  hasModules: boolean;
  modules: CompareModule[];
};

export type CompareDiscipline = {
  id: string;
  handle: string;
  title: string;
  programPageHref: string;
  levels: CompareLevel[];
};

export type CompareRow = {
  rowKey: string;
  competencyId: string;
  moduleId: string;
  moduleTitle: string;
  moduleWeight: number;
  title: string;
  weight: number;
  aText: string;
  bText: string;
};

export type CompareModuleGroup = {
  moduleKey: string;
  moduleId: string;
  moduleTitle: string;
  moduleWeight: number;
  competencies: CompareRow[];
};

export type ViewMode = "verschil" | "beschrijving";
