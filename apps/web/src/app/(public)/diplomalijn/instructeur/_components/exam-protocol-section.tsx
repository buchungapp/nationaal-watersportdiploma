import { getIsActiveInstructor, listKnowledgeCenterDocuments } from "~/lib/nwd";
import {
  buildExamProtocolOptions,
  type KnowledgeCenterDocument,
} from "../_lib/resolve-exam-protocol-documents";
import { ExamProtocolPanel } from "./exam-protocol-panel";

export async function ExamProtocolSection() {
  const canDownload = await getIsActiveInstructor();

  let documents: KnowledgeCenterDocument[] | null = null;
  let loadError = false;

  if (canDownload) {
    try {
      documents = await listKnowledgeCenterDocuments();
    } catch {
      loadError = true;
    }
  }

  const options = buildExamProtocolOptions(documents);

  return (
    <ExamProtocolPanel
      options={options}
      canDownload={canDownload}
      loadError={loadError}
    />
  );
}
