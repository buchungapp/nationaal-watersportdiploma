import Image from "next/image";
import Balancer from "react-wrap-balancer";
import { TekstButton } from "~/app/(public)/_components/style/buttons";
import { BoxedButton } from "../../_components/style/buttons";
import featuredImage from "../opengraph-image.jpg";

export default function CashbackWelcome() {
  return (
    <div className="grid grid-cols-1 items-center gap-8 px-4 lg:grid-cols-2 lg:px-16 min-w-0">
      <div className="grid gap-6 text-white min-w-0">
        <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl">
          <Balancer>Je CWO-ervaring is geld waard!</Balancer>
        </h1>
        <p className="text-xl">
          <Balancer>
            Tijd voor een upgrade? Stap over naar een NWD-erkende vaarlocatie en
            ontvang €50 cashback. Doe geen concessies op kwaliteit of plezier.
            Ga voor <i>Serieus leuk</i>.
          </Balancer>
        </p>
        <div className="flex gap-x-6 items-center">
          <BoxedButton
            href="/actueel/jur1zF0r-van-cwo-naar-nwd-stap-over-naar-de-nieuwe-standaard-en-ontvang-50-euro-cadeau"
            className="bg-white text-branding-dark"
          >
            Lees de aankondiging
          </BoxedButton>
          <TekstButton href="/vaarlocaties">Deelnemende locaties</TekstButton>
        </div>
      </div>
      <div className="relative aspect-[1.91/1] w-full overflow-hidden rounded-3xl border-2 border-white/20 shadow-lg">
        <Image
          src={featuredImage}
          alt=""
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
