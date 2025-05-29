import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { constants } from "@nawadi/lib";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import Logo from "~/app/_components/brand/logo";
import {
  Facebook,
  Instagram,
  LinkedIn,
  TikTok,
  YouTube,
} from "~/app/_components/socials";
import dayjs from "~/lib/dayjs";
import { retrieveCertificateById } from "~/lib/nwd";
import { Text, TextLink } from "../../../(dashboard)/_components/text";
import { safeParseCertificateParams } from "../_utils/parse-certificate-params";
import CertificateAdvise from "./_components/advise";
import { Confetti } from "./_components/confetti";
import { ShareCertificate } from "./_components/share";
import CertificateTemplate from "./_components/template";

interface Props {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  // read route params
  const id = params.id;

  const certificate = await retrieveCertificateById(id).catch(() => notFound());

  return {
    title: `Bekijk het NWD diploma van ${certificate.student.firstName}!`,
    description: `${certificate.student.firstName} heeft een nieuwe diploma behaald voor ${certificate.program.title} bij ${certificate.location.name}!`,
    openGraph: {
      title: `Bekijk het NWD diploma van ${certificate.student.firstName}!`,
      description: `${certificate.student.firstName} heeft een nieuwe diploma behaald voor ${certificate.program.title} bij ${certificate.location.name}!`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const [certificate] = await Promise.all([
    retrieveCertificateById(params.id).catch(() => notFound()),
  ]);

  const result = safeParseCertificateParams({
    handle: searchParams.nummer,
    issuedDate: searchParams.datum,
  });

  const socials = [
    {
      name: "Facebook",
      icon: Facebook,
      link: constants.FACEBOOK_URL,
    },
    {
      name: "Instagram",
      icon: Instagram,
      link: constants.INSTAGRAM_URL,
    },
    {
      name: "LinkedIn",
      icon: LinkedIn,
      link: constants.LINKEDIN_URL,
    },
    {
      name: "TikTok",
      icon: TikTok,
      link: constants.TIKTOK_URL,
    },
    {
      name: "YouTube",
      icon: YouTube,
      link: constants.YOUTUBE_URL,
    },
  ];

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
    <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="mx-auto py-8 lg:py-12 max-w-prose text-center">
        <h2 className="font-bold text-slate-950 text-2xl">
          {`Gefeliciteerd, ${certificate.student.firstName}! Een nieuw diploma!`}
        </h2>

        <Text>
          Op deze pagina vind je alle details over jouw behaalde diploma. Kom er
          achter welke eisen je hebt behaald, wat je hierna kunt doen of deel je
          diploma met je familie en vrienden!
        </Text>

        <Text className="my-6 italic">
          <strong>Psst..</strong> Deel een foto van jou en je diploma op
          Instagram, tag ons op{" "}
          <TextLink href={constants.INSTAGRAM_URL} target="_blank">
            @nationaalwatersportdiploma
          </TextLink>{" "}
          en krijg een persoonlijke NWD felicitatie met stickers thuisgestuurd!
        </Text>

        <div className="flex md:flex-row flex-col justify-center items-center gap-x-4 gap-y-3.5">
          <Suspense>
            <Confetti />
          </Suspense>
          <ShareCertificate id={params.id} />
          {!shouldMask ? (
            <Button
              type="button"
              color="blue"
              href={`/api/export/certificate/pdf/${params.id}?preview=true&signed=true&handle=${result.handle}&issuedDate=${result.issuedDate.format("YYYYMMDD")}&filename=nationaal-watersportdiploma_nwd-${result.handle}-${result.issuedDate.format("YYYYMMDD")}`}
              target="_blank"
              rel="noreferrer"
            >
              <ArrowDownTrayIcon />
              Download je diploma!
            </Button>
          ) : null}
        </div>
      </div>

      <div className="bg-white shadow-md -mx-2.5 sm:mx-0 border border-slate-200 rounded-xs overflow-hidden">
        <CertificateTemplate id={params.id} maskPii={shouldMask} />
      </div>

      <div className="py-8 text-center">
        <h2 className="font-semibold text-slate-950 text-2xl">En nu?</h2>

        <Suspense>
          <CertificateAdvise id={params.id} />
        </Suspense>
      </div>

      <div className="mt-10 pb-8 lg:pb-12 xl:pb-16">
        <div className="flex justify-center items-center gap-x-6 sm:gap-x-8 mx-auto">
          <Link href="/">
            <Logo className="mx-auto size-20 sm:size-24 md:size-28 lg:size-32 text-white" />
          </Link>

          <ul className="flex justify-start items-center gap-6">
            {socials.map((social) => (
              <li key={social.name}>
                <Link
                  href={social.link}
                  className="text-branding-dark hover:text-branding-light"
                  target="_blank"
                  referrerPolicy="no-referrer"
                >
                  <social.icon className="size-5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
