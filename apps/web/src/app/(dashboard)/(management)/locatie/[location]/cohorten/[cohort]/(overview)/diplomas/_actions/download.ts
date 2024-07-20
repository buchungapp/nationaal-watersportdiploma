"use server";

import { redirect } from "next/navigation";
import { storeCertificateHandles } from "~/lib/nwd";

export async function kickOffGeneratePDF({
  handles,
  fileName,
}: {
  handles: string[];
  fileName: string;
}) {
  const uuid = await storeCertificateHandles({ handles, fileName });

  redirect(`/api/export/certificate/pdf/${uuid}`);
}
