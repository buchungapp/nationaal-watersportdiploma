import type { Metadata } from "next";
import RawCertificate from "~/app/_components/certificate/certificate-raw";
import { retrieveCertificateById } from "~/lib/nwd";
import { generateAdvise } from "../../_utils/generate-advise";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const [certificate, advice] = await Promise.all([
    retrieveCertificateById(params.id),
    generateAdvise(params.id),
  ]);

  return <RawCertificate certificate={certificate} advice={advice} />;
}
