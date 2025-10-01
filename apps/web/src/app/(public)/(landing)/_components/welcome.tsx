import { MegaphoneIcon } from "@heroicons/react/16/solid";
import Link from "next/link";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import MuxVideo from "./mux-video";

export default function Welcome() {
  return (
    <div className="grid grid-cols-1 items-center gap-8 px-4 lg:grid-cols-2 lg:px-16">
      <div className="grid justify-center gap-10 lg:justify-start">
        <div className="grid gap-6 text-white text-center sm:text-left">
          <Link
            href="/actueel/zc2GQupd-definitieve-keuze-gemaakt-nwd-diplomalijn-wordt-vanaf-2026-de-enige-erkende-standaard"
            className="w-fit rounded-full px-6 py-3 text-sm sm:text-base text-branding-dark font-bold bg-white transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mb-4 leading-tight mx-auto sm:mx-0 shadow-xl"
          >
            <MegaphoneIcon className="h-4 w-4" />
            Strategisch partnership met Watersportverbond
            <span className="text-xs">→</span>
          </Link>
          <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl">
            Welkom bij het Nationaal Watersportdiploma.
          </h1>
          <p className="text-xl text-slate-100">
            Wij zijn klaar voor het nieuwe vaarseizoen, jij ook?
          </p>
        </div>
        <div className="flex flex-col items-center sm:items-start gap-x-6 gap-y-4 sm:flex-row">
          <BoxedButton
            href="/vaarlocaties"
            className="bg-white text-branding-dark"
          >
            Vind een NWD vaarschool
          </BoxedButton>
          <BoxedButton
            href="/diplomalijn/consument"
            className="text-white hover:bg-white/10"
          >
            Ontdek de diplomalijn
          </BoxedButton>
        </div>
      </div>
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl">
        <MuxVideo
          style={{
            position: "absolute",
            inset: 0,
          }}
          playbackId="7lX3InLCH2hfWQGRJnXtOybImuqggOzkPgHEgHi9isY"
          streamType="on-demand"
          preload="auto"
          loop
          muted
          autoPlay
        />
      </div>
    </div>
  );
}
