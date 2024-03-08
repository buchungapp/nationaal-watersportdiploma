import { BoxedButton } from "~/app/_components/style/Buttons";
import WaveAnimation from "./WaveAnimation";

export default function Heading() {
  return (
    <section className="w-full py-12 bg-branding-light rounded-b-[3rem] grid gap-12">
      <div className="items-center grid gap-8 grid-cols-1 lg:grid-cols-2 px-4 lg:px-16">
        <div className="grid gap-10 justify-center lg:justify-start">
          <div className="text-white grid gap-6">
            <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl max-w-lg">
              Welkom bij het Nationaal Watersportdiploma.
            </h1>
            <p className="text-xl">Wij zijn klaar voor het nieuwe vaarseizoen, jij ook?</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2">
            <BoxedButton href="/locaties" className="bg-white text-branding-dark">
              Vindt een NWD locatie
            </BoxedButton>
            <BoxedButton href="/over" className="bg-branding-light text-white">
              Waarom het NWD
            </BoxedButton>
          </div>
        </div>
        <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/IWuNoqaOv4M?autoplay=1&mute=1&playsinline=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            className="border-0"
            allowFullScreen
          />
        </div>
      </div>
      <div className="w-full">
        <WaveAnimation begin={-600} end={-100} />
      </div>
    </section>
  );
}
