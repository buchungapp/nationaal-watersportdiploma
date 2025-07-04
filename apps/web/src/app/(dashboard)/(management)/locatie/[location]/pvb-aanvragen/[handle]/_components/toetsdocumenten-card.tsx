import { getPvbToetsdocumenten, retrievePvbAanvraagByHandle } from "~/lib/nwd";
import { ToetsdocumentenDisplay } from "./toetsdocumenten-display";

export async function ToetsdocumentenCard({
  params,
}: {
  params: Promise<{ location: string; handle: string }>;
}) {
  const resolvedParams = await params;
  const aanvraag = await retrievePvbAanvraagByHandle(resolvedParams.handle);
  const toetsdocumenten = await getPvbToetsdocumenten(aanvraag.id);

  return <ToetsdocumentenDisplay toetsdocumenten={toetsdocumenten} />;
}
