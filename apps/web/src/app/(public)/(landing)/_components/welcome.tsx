import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import MuxVideo from "./mux-video";

export default function Welcome() {
  return (
    <div className="items-center gap-8 grid grid-cols-1 lg:grid-cols-2 px-4 lg:px-16">
      <div className="justify-center lg:justify-start gap-10 grid">
        <div className="gap-6 grid text-white sm:text-left text-center">
          <h1 className="max-w-lg font-bold text-4xl lg:text-5xl xl:text-6xl">
            Welkom bij het Nationaal Watersportdiploma.
          </h1>
          <p className="text-slate-100 text-xl">
            Wij zijn klaar voor het nieuwe vaarseizoen, jij ook?
          </p>
        </div>
        <div className="flex sm:flex-row flex-col items-center sm:items-start gap-x-6 gap-y-4">
          <BoxedButton
            href="/vaarlocaties"
            className="bg-white text-branding-dark"
          >
            Vind een NWD vaarschool
          </BoxedButton>
          <BoxedButton
            href="/diplomalijn/consument"
            className="hover:bg-white/10 text-white"
          >
            Over de NWD diploma's
          </BoxedButton>
        </div>
      </div>
      <div className="relative rounded-3xl w-full aspect-4/3 overflow-hidden">
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
