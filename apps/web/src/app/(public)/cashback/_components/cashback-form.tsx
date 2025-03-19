import Balancer from "react-wrap-balancer";
import { listAllLocations } from "~/lib/nwd";
import { CashbackFormClient } from "./cashback-form-client";

export default async function CashbackForm() {
  const locations = await listAllLocations();

  return (
    <section className="flex flex-col items-center gap-8 bg-branding-light sm:px-4 lg:px-16 pt-20 pb-4 sm:pb-20 rounded-t-[3rem] rounded-b-xl sm:rounded-b-[3rem] w-full">
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-white text-3xl sm:text-4xl text-center">
          Vraag je cashback aan
        </h2>
        <p className="max-w-2xl text-white/80 text-center">
          <Balancer>
            Let op: je moet het formulier{" "}
            <strong>per deelnemer invullen</strong>. Zorg dat je je
            boekingsbevestiging en een kopie van je CWO-diploma bij de hand
            hebt.
          </Balancer>
        </p>
      </div>
      <CashbackFormClient locations={locations} />
    </section>
  );
}
