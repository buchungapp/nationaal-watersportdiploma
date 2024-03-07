import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import Double from "~/app/_assets/Double";

import locations from "./_assets/locations.png";

export default function Locations() {
  return (
    <section className="w-full bg-branding-orange rounded-[3rem] grid items-center lg:grid-cols-2 overflow-hidden">
      <div className="grid gap-10 p-4 py-12 lg:p-16 text-white">
        <div className="grid gap-2">
          <div className={"flex gap-3 items-center"}>
            <span className="uppercase font-bold">Locaties</span>
            <Double />
          </div>
          <h3 className="font-bold text-2xl">
            <Balancer>Vind jouw NWD-vaarlocatie.</Balancer>
          </h3>
          <p>
            NWD-locaties voldoen aan strenge kwaliteitseisen op gebied van
            persoonlijke- en sociale veiligheid. Verder hebben zij zich
            gecommitteerd aan de visie van het NWD: veiligheid, kwaliteit en
            plezier op het water. Daarom zijn zij gelicenseerd om het
            NWD-diploma uit te geven.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2">
          <Link
            href="/locaties"
            className="bg-white text-slate-900 group text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center"
          >
            Bekijk NWD locaties{" "}
            <ArrowLongRightIcon
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              strokeWidth={2.5}
            />
          </Link>
          <Link
            href="/kwaliteitseisen-locaties"
            className="group text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center"
          >
            Kwaliteitseisen voor locaties{" "}
            <ArrowLongRightIcon
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              strokeWidth={2.5}
            />
          </Link>
        </div>
      </div>
      <Image
        src={locations}
        alt="NWD-locaties"
        width={locations.width}
        height={locations.height}
        className="mix-blend-luminosity"
      />
    </section>
  );
}
