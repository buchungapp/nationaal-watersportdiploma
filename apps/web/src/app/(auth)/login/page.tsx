import { constants } from "@nawadi/lib";
import Logo from "~/app/_components/brand/logo";
import { EmailForm } from "./_components/login-form";

export default function Page() {
  return (
    <div className="mx-auto w-full lg:w-96 max-w-sm">
      <div>
        <Logo className="w-auto h-20 text-white" />
        <h2 className="mt-8 font-bold text-slate-900 text-2xl leading-8 tracking-tight">
          Welkom bij het {constants.APP_NAME}
        </h2>
        <p className="mt-2 text-slate-500 text-sm leading-6">
          Log in met je e-mailadres om verder te gaan.
        </p>
      </div>

      <div className="mt-8">
        <div>
          <EmailForm className="space-y-6" />
        </div>
      </div>
    </div>
  );
}
