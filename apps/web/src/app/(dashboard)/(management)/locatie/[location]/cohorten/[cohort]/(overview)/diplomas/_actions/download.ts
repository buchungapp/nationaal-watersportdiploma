"use server";

import { redirect } from "next/navigation";
import { storeCertificateHandles } from "~/lib/nwd";

export async function kickOffGeneratePDF({
  handles,
  fileName,
  sort,
}: {
  handles: string[];
  fileName: string;
  sort: "student" | "instructor";
}) {
  const uuid = await storeCertificateHandles({ handles, fileName, sort });

  redirect(`/api/export/certificate/pdf/${uuid}`);
}
