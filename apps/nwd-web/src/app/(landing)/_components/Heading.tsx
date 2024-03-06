import { ArrowLongRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import WaveAnimation from "./WaveAnimation";

export default function Heading() {
  return (
    <section className=" w-full py-12 bg-branding-light rounded-b-3xl grid gap-12">
      <div className="items-center grid gap-8 grid-cols-1 lg:grid-cols-2 px-4 lg:px-16">
        <div className="grid gap-10 justify-center lg:justify-start">
          <div className="text-white grid gap-6">
            <h1 className="font-bold text-4xl lg:text-5xl max-w-lg">
              Welkom bij het Nationaal Watersportdiploma.
            </h1>
            <p className="text-xl">
              Wij zijn klaar voor het nieuwe vaarseizoen, jij ook?
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6">
            <Link
              href="/locaties"
              className="bg-white text-branding-dark text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center"
            >
              Vindt een NWD locatie <ArrowLongRightIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/over"
              className="bg-branding-light text-white text-sm font-semibold px-4 py-2 flex gap-1 w-fit rounded-lg items-center"
            >
              Waarom het NWD <ArrowLongRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/IWuNoqaOv4M?autoplay=1&mute=1&playsinline=1`}
          title="YouTube video player"
          frameBorder="0"
          className="aspect-[4/3] w-full rounded-3xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <WaveAnimation />
    </section>
  );
}
