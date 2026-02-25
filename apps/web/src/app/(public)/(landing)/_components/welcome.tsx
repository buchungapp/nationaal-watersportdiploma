import { CheckIcon, MegaphoneIcon } from "@heroicons/react/16/solid";
import Link from "next/link";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import MuxVideo from "./mux-video";

const heroBullets = [
  "Behaal een diploma dat er echt toe doet",
  "Vaar met modern en gekeurd materiaal",
  "Leer van de beste, gecertificeerde instructeurs",
];

export default function Welcome() {
  return (
    <div className="mx-auto grid max-w-(--breakpoint-2xl) grid-cols-1 items-center gap-8 px-4 lg:grid-cols-[1fr_1fr] lg:px-16 xl:grid-cols-[3fr_2fr] xl:gap-16">
      <div className="grid justify-center gap-8 lg:justify-start">
        <div className="grid gap-6 text-white text-center sm:text-left">
          <Link
            href="/actueel/jur1zF0r-van-cwo-naar-nwd-stap-over-naar-de-nieuwe-standaard-en-ontvang-50-euro-cadeau"
            className="group w-fit rounded-md border border-white/25 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm text-white font-medium transition-colors hover:bg-white/20 flex items-center gap-2.5 leading-tight mx-auto sm:mx-0"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-branding-orange">
              <MegaphoneIcon className="size-2.5 text-white" />
            </span>
            {"Stap over naar het NWD en ontvang \u20AC50 cashback!"}
            <span className="text-white/50 transition-transform group-hover:translate-x-0.5">{"→"}</span>
          </Link>
          <h1 className="max-w-lg text-4xl font-bold lg:text-5xl xl:text-6xl text-balance">
            Zorgeloos het water op, met een erkend diploma.
          </h1>
          <p className="text-lg text-slate-100 max-w-lg leading-relaxed">
            Kies voor een watersportlocatie die voldoet aan de strengste eisen
            voor veiligheid en kwaliteit. Zo focus jij je op wat echt telt:
            plezier maken en beter worden.
          </p>
          <ul className="grid gap-3 text-left mx-auto sm:mx-0">
            {heroBullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <CheckIcon className="size-3 text-white" />
                </span>
                <span className="text-sm text-white/90">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center sm:items-start gap-x-6 gap-y-4 sm:flex-row">
          <BoxedButton
            href="/vaarlocaties"
            className="bg-white text-branding-dark font-bold"
          >
            Vind een veilige locatie
          </BoxedButton>
          <BoxedButton
            href="/diplomalijn/consument"
            className="text-white hover:bg-white/10"
          >
            Bekijk alle diploma's en cursussen
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
          preload="metadata"
          loop
          muted
          autoPlay
        />
      </div>
    </div>
  );
}
