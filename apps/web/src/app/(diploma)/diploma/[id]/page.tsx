import { constants } from "@nawadi/lib";
import dayjs from "dayjs";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { retrieveCertificateById } from "~/lib/nwd";
import { Text, TextLink } from "../../../(dashboard)/_components/text";
import { generateAdvise } from "../_utils/generate-advise";
import { safeParseCertificateParams } from "../_utils/parse-certificate-params";
import { Confetti } from "./_components/confetti";
import CertificateTemplate from "./_components/template";

export default async function Page({
  params,
  searchParams,
}: {
  params: {
    id: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const [certificate, advice] = await Promise.all([
    retrieveCertificateById(params.id).catch(() => notFound()),
    generateAdvise(params.id),
  ]);

  const result = safeParseCertificateParams({
    handle: searchParams.nummer,
    issuedDate: searchParams.datum,
  });

  /**
   * Determines whether the value should be masked based on the given conditions.
   * The value should be masked if:
   * - There is no result
   * - The result handle is different from the certificate handle
   * - The result issued date is different from the certificate issued date
   */
  const shouldMask =
    !result ||
    result.handle !== certificate.handle ||
    result.issuedDate.format("YYYYMMDD") !==
      dayjs(certificate.issuedAt).format("YYYYMMDD");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-gray-950">
          {`Gefeliciteerd, ${certificate.student.firstName}! Een nieuw diploma!`}
        </h2>

        <Suspense>
          <Confetti />
        </Suspense>
      </div>

      <div className="rounded-sm overflow-hidden bg-white shadow border border-gray-200">
        <CertificateTemplate id={params.id} maskPii={shouldMask} />
      </div>

      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-gray-950">En nu?</h2>

        <Text className="max-w-prose mx-auto mt-1.5">{advice}</Text>

        <Text className="max-w-prose mx-auto mt-2">
          Leer meer over alle verschillende diploma's op{" "}
          <TextLink href="/diplomalijn/consument">onze diplomalijn</TextLink>{" "}
          pagina!
        </Text>

        <Text className="max-w-prose mx-auto mt-8">
          <strong>Psst..</strong> Deel een foto van jou en je diploma op
          Instagram, tag ons op{" "}
          <TextLink href={constants.INSTAGRAM_URL}>
            @nationaalwatersportdiploma
          </TextLink>{" "}
          en krijg een unieke NWD sticker thuisgestuurd!
        </Text>
      </div>
    </div>
  );
}
