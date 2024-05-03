import { notFound } from "next/navigation";
import { Suspense } from "react";
import { retrieveCertificateById } from "~/lib/nwd";
import { Confetti } from "./_components/confetti";
import CertificateTemplate from "./_components/template";

export default async function Page({
  params,
}: {
  params: {
    id: string;
  };
}) {
  const certificate = await retrieveCertificateById(params.id).catch(() =>
    notFound(),
  );

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

      <div className="rounded-sm overflow-hidden bg-white drop-shadow-[0_10px_8px_rgba(0,0,0,0.04),0_4px_3px_rgba(0,0,0,0.1)]">
        <CertificateTemplate id={params.id} />
      </div>
    </div>
  );
}
