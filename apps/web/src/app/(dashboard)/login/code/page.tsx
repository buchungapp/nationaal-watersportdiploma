import { redirect } from "next/navigation";
import { z } from "zod";
import Logo from "~/app/_components/brand/logo";
import { OtpForm } from "../_components/login-form";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const _email = z.string().email().safeParse(searchParams.email);

  if (!_email.success) {
    redirect("/login");
  }

  const email = _email.data;

  return (
    <div className="mx-auto w-full max-w-sm lg:w-96">
      <div>
        <Logo className="h-20 w-auto text-white" />
        <h2 className="mt-8 text-2xl font-bold leading-8 tracking-tight text-gray-900">
          Laten we je e-mailadres verifiëren
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Controleer je inbox voor de pincode die we je hebben gestuurd.
        </p>
      </div>

      <div className="mt-8">
        <div>
          <OtpForm email={email} className="space-y-6" />
        </div>
      </div>
    </div>
  );
}
