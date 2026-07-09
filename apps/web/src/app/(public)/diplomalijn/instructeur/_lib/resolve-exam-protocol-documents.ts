import {
  EXAM_PROTOCOL_DISCIPLINES,
  EXAM_PROTOCOL_NWD_C,
  EXAM_PROTOCOL_NWD_C_ID,
  type ExamProtocolSelectionId,
} from "../_data/exam-protocol-disciplines";

export type KnowledgeCenterDocument = {
  id: string;
  name: string | null;
  updatedAt: string;
  size: number;
};

export type ExamProtocolDocumentRef = {
  id: string;
  name: string;
  updatedAt: string;
  size: number;
};

export type ExamProtocolOption = {
  id: ExamProtocolSelectionId;
  title: string;
  group: "discipline" | "general";
  document: ExamProtocolDocumentRef | null;
};

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[_\s]+/g, " ")
    .trim();
}

export function parseExamProtocolFilename(
  filename: string,
):
  | { type: "discipline"; label: string }
  | { type: "nwd-c" }
  | null {
  const base = filename.replace(/\.pdf$/i, "").trim();

  if (/^examenprotocol[_\s]+nwd[-\s]?c$/i.test(base)) {
    return { type: "nwd-c" };
  }

  if (/^exameneisen[_\s]+nwd[-\s]?c$/i.test(base)) {
    return { type: "nwd-c" };
  }

  const disciplineMatch = base.match(/^exameneisen[_\s]+(.+)$/i);
  if (disciplineMatch?.[1]) {
    return {
      type: "discipline",
      label: normalizeLabel(disciplineMatch[1]),
    };
  }

  return null;
}

function indexExamProtocolDocuments(documents: KnowledgeCenterDocument[]) {
  const byDisciplineLabel = new Map<string, KnowledgeCenterDocument>();
  let nwdC: KnowledgeCenterDocument | undefined;

  for (const document of documents) {
    if (!document.name) continue;

    const parsed = parseExamProtocolFilename(document.name);
    if (!parsed) continue;

    if (parsed.type === "nwd-c") {
      nwdC ??= document;
      continue;
    }

    const existing = byDisciplineLabel.get(parsed.label);
    if (!existing) {
      byDisciplineLabel.set(parsed.label, document);
    }
  }

  return { byDisciplineLabel, nwdC };
}

function toDocumentRef(
  document: KnowledgeCenterDocument,
): ExamProtocolDocumentRef {
  return {
    id: document.id,
    name: document.name ?? "Onbekend document",
    updatedAt: document.updatedAt,
    size: document.size,
  };
}

export function buildExamProtocolOptions(
  documents: KnowledgeCenterDocument[] | null,
): ExamProtocolOption[] {
  const indexed =
    documents == null
      ? null
      : indexExamProtocolDocuments(documents);

  const disciplineOptions: ExamProtocolOption[] = EXAM_PROTOCOL_DISCIPLINES.map(
    (discipline) => {
      const matched =
        indexed?.byDisciplineLabel.get(normalizeLabel(discipline.fileLabel)) ??
        null;

      return {
        id: discipline.id,
        title: discipline.title,
        group: "discipline",
        document: matched ? toDocumentRef(matched) : null,
      };
    },
  );

  const nwdCOption: ExamProtocolOption = {
    id: EXAM_PROTOCOL_NWD_C_ID,
    title: EXAM_PROTOCOL_NWD_C.title,
    group: "general",
    document: indexed?.nwdC ? toDocumentRef(indexed.nwdC) : null,
  };

  return [...disciplineOptions, nwdCOption];
}
