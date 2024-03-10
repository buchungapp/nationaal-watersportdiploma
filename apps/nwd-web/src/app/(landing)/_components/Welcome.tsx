import { BoxedButton } from "~/app/_components/style/Buttons";
import MuxVideo from "./mux-video";

export default function Welcome() {
  return (
    <div className="items-center grid gap-8 grid-cols-1 lg:grid-cols-2 px-4 lg:px-16">
      <div className="grid gap-10 justify-center lg:justify-start">
        <div className="text-white grid gap-6">
          <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl max-w-lg">
            Welkom bij het Nationaal Watersportdiploma.
          </h1>
          <p className="text-xl text-gray-100">
            Wij zijn klaar voor het nieuwe vaarseizoen, jij ook?
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2">
          <BoxedButton href="/locaties" className="bg-white text-branding-dark">
            Vindt een NWD locatie
          </BoxedButton>
          <BoxedButton href="/over" className="text-white hover:bg-white/10">
            Waarom het NWD
          </BoxedButton>
        </div>
      </div>
      <div className="aspect-[4/3] relative w-full rounded-3xl overflow-hidden">
        {/* <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/IWuNoqaOv4M?autoplay=1&mute=1&playsinline=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          className="border-0"
          allowFullScreen
        /> */}
        <MuxVideo
          style={{ ["--media-object-fit" as string]: "cover", position: "absolute", inset: 0 }}
          playbackId="DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
          metadata={{
            video_id: "video-id-123456",
            video_title: "Super Interesting Video",
            viewer_user_id: "user-id-bc-789",
          }}
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
