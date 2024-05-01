import CertificateTemplate from "../_components/template";

export default function Page({
  params,
}: {
  params: {
    id: string;
  };
}) {
  return <CertificateTemplate id={params.id} />;
}
