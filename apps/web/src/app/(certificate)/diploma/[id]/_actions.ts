"use server";

import dayjs from "dayjs";
import { redirect } from "next/navigation";
import { retrieveCertificateById } from "~/lib/nwd";
import { safeParseCertificateParams } from "../_utils/parse-certificate-params";

export async function showPiiHandler(
  certificateId: string,
  _prev: unknown,
  data: FormData,
) {
  const result = safeParseCertificateParams({
    handle: data.get("handle"),
    issuedDate: data.get("issuedDate"),
  });

  if (!result) {
    return {
      success: false,
    };
  }

  const certificate = await retrieveCertificateById(certificateId);

  const isValid =
    result.handle === certificate.handle &&
    result.issuedDate.format("YYYYMMDD") ===
      dayjs(certificate.issuedAt).format("YYYYMMDD");

  if (!isValid) {
    return {
      success: false,
    };
  }

  redirect(
    `/diploma/${certificateId}/?nummer=${result.handle}&datum=${result.issuedDate.format("YYYYMMDD")}`,
  );
}
