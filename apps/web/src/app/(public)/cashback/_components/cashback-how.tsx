import type { ReactNode } from "react";
import Balancer from "react-wrap-balancer";

export default function CashbackHow() {
  return (
    <section className="flex flex-col gap-12 mx-auto px-4 lg:px-16 container">
      <div className="self-center gap-8 grid max-w-5xl text-center">
        <h2 className="font-bold text-slate-900 text-3xl sm:text-4xl">
          <Balancer>Hoe werkt het?</Balancer>
        </h2>

        <div className="gap-4 grid grid-cols-1 lg:grid-cols-3">
          <Step
            number={1}
            title="Boek een zeilkamp of zeilcursus"
            description="Bij één van de NWD-erkende vaarlocaties, voor minimaal 2 dagen."
          />
          <Step
            number={2}
            title="Upload je CWO-bewijs uit 2024"
            description="Vul het onderstaande formulier in en upload je bewijsstuk."
          />
          <Step
            number={3}
            title="Ontvang €50 cashback!"
            description="Nadat je cursus is afgerond, stort het Nationaal Watersportdiploma wij €50,- terug op je
                rekening."
          />
        </div>
      </div>
    </section>
  );
}

function Step({
  number,
  title,
  description,
}: { number: number; title: ReactNode; description: ReactNode }) {
  return (
    <article className="flex flex-col items-center gap-2 px-4 py-12 border-2 border-branding-light rounded-xl">
      <span className="flex justify-center items-center bg-branding-orange mb-4 p-4 rounded-full size-15 aspect-square text-white text-2xl">
        {number}
      </span>
      <h3 className="font-bold text-branding-light text-2xl">
        <Balancer>{title}</Balancer>
      </h3>
      <p className="text-slate-600 text-sm">
        <Balancer>{description}</Balancer>
      </p>
    </article>
  );
}
