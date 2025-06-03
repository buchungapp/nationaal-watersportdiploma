import Image from "next/image";
import Bahia from "../_assets/RVP05937.jpg";
import { BoxedButton } from "./style/buttons";

export function FindNWDCourse() {
  return (
    <div className="relative bg-branding-dark rounded-3xl overflow-hidden">
      <div className="relative h-80 overflow-hidden md:absolute md:left-0 md:h-full md:w-1/3 lg:w-1/2">
        <Image
          placeholder="blur"
          className="h-full w-full object-cover"
          src={Bahia}
          alt=""
        />
      </div>
      <div className="relative mx-auto max-w-7xl py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="pl-6 pr-6 md:ml-auto md:w-2/3 md:pl-16 lg:w-1/2 lg:pl-24 lg:pr-0 xl:pl-32">
          <h2 className="text-base font-semibold leading-7 text-white/60">
            Klaar voor een nieuwe uitdaging?
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ga watersporten!
          </p>
          <p className="mt-6 text-base leading-7 text-slate-300">
            Wil je bijvoorbeeld op zeilkamp, leren surfen of gaan jachtvaren?
            Boek een cursus bij een NWD-erkende vaarschool!
          </p>
          <div className="mt-8">
            <BoxedButton
              href="/vaarlocaties"
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              Vind een NWD vaarlocatie
            </BoxedButton>
          </div>
        </div>
      </div>
    </div>
  );
}
