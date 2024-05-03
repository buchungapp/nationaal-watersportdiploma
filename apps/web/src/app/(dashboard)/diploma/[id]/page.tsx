import { Suspense } from "react";
import CertificateTemplate from "../_components/template";
import { Confetti } from "./_components/confetti";

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
      <CertificateTemplate id={params.id} />
    </div>
  );
}
