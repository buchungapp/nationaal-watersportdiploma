/** Disciplines with published Exameneisen PDFs in the kennisbank. */
export const EXAM_PROTOCOL_DISCIPLINES = [
  { id: "catamaran", title: "Catamaran", fileLabel: "Catamaran" },
  { id: "kielboot", title: "Kielboot", fileLabel: "Kielboot" },
  { id: "windsurfen", title: "Windsurfen", fileLabel: "Windsurfen" },
  {
    id: "zwaardboot-1-mans",
    title: "Zwaardboot 1-mans",
    fileLabel: "Zwaardboot 1-mans",
  },
  {
    id: "zwaardboot-2-mans",
    title: "Zwaardboot 2-mans",
    fileLabel: "Zwaardboot 2-mans",
  },
] as const;

export const EXAM_PROTOCOL_NWD_C_ID = "nwd-c" as const;

export const EXAM_PROTOCOL_NWD_C = {
  id: EXAM_PROTOCOL_NWD_C_ID,
  title: "NWD C (algemeen)",
} as const;

export type ExamProtocolDisciplineId =
  (typeof EXAM_PROTOCOL_DISCIPLINES)[number]["id"];

export type ExamProtocolSelectionId =
  | ExamProtocolDisciplineId
  | typeof EXAM_PROTOCOL_NWD_C_ID;
