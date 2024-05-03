import { Suspense } from "react";
import { Confetti } from "./_components/confetti";
import CertificateTemplate from "./_components/template";

export default function Page({
  params,
}: {
  params: {
    id: string;
  };
}) {
  return (
    <div>
      <Suspense>
        <Confetti />
      </Suspense>

      <div className="container rounded-sm mx-auto bg-white drop-shadow-[0_10px_8px_rgba(0,0,0,0.04),0_4px_3px_rgba(0,0,0,0.1)]">
        <CertificateTemplate id={params.id} />
      </div>
    </div>
  );
}
