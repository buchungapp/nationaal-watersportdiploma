import Balancer from "react-wrap-balancer";
import { listAllLocations } from "~/lib/nwd";
import { CashbackFormClient } from "./cashback-form-client";

export default async function CashbackForm() {
  const locations = await listAllLocations();

  return (
    <section className="flex flex-col items-center gap-8 bg-branding-light px-4 lg:px-16 py-20 rounded-[3rem] w-full">
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-white text-3xl sm:text-4xl text-center">
          Vraag je cashback aan
        </h2>
        <p className="max-w-2xl text-white/80 text-center">
          <Balancer>
            Vul onderstaand formulier in om je cashback aan te vragen. Let op:
            je moet het formulier per deelnemer invullen. Zorg dat je je
            boekingsbevestiging en een kopie van je X bij de hand hebt.
          </Balancer>
        </p>
      </div>
      <CashbackFormClient locations={locations} />
    </section>
  );
}
