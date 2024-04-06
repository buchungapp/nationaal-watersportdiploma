import { APP_NAME } from "@nawadi/lib/constants";
import Logo from "~/app/_components/brand/logo";
import { Field, Label } from "../_components/fieldset";
import { Input } from "../_components/input";
import { EmailForm, SubmitButton } from "./_components/login-form";

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-sm lg:w-96">
      <div>
        <Logo className="h-20 w-auto text-white" />
        <h2 className="mt-8 text-2xl font-bold leading-8 tracking-tight text-gray-900">
          Welkom bij het {APP_NAME}
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Log in met je e-mailadres om verder te gaan.
        </p>
      </div>

      <div className="mt-8">
        <div>
          <EmailForm className="space-y-6">
            <Field>
              <Label>E-mailadres</Label>
              <Input name="email" type="email" autoComplete="email" required />
            </Field>

            <div>
              <SubmitButton>Doorgaan</SubmitButton>

              <p className="text-center text-gray-400 text-sm mt-2.5">
                We sturen een pincode naar je e-mailadres
              </p>
            </div>
          </EmailForm>
        </div>
      </div>
    </div>
  );
}
