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
            href="/actueel/jh38UnmG-persbericht-samenwerking-watersportverbond-en-nationaal-watersportdiploma"
            className="w-fit rounded-full bg-white/15 px-6 py-2 text-sm text-white 
            hover:bg-white/25 transition-colors duration-200 backdrop-blur-sm
            flex items-center gap-2 mb-4 font-medium leading-tight mx-auto sm:mx-0
            border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <MegaphoneIcon className="h-4 w-4" /> Lees: Vernieuwd
            watersportdiploma voor Nederland
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
