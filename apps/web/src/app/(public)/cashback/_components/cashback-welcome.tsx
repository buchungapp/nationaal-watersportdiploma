import Image from "next/image";
import Balancer from "react-wrap-balancer";
import { TekstButton } from "~/app/(public)/_components/style/buttons";
import { BoxedButton } from "../../_components/style/buttons";
import featuredImage from "../opengraph-image.jpeg";

export default function CashbackWelcome() {
  return (
    <div className="grid grid-cols-1 items-center gap-8 px-4 lg:grid-cols-2 lg:px-16 min-w-0">
      <div className="grid gap-6 text-white min-w-0">
        <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl">
          <Balancer>
            Ontvang €50 cashback bij inlevering van je CWO-diploma!
          </Balancer>
        </h1>
        <p className="text-xl">
          <Balancer>
            De diplomalijn van het Nationaal Watersportdiploma wordt de nieuwe
            landelijke standaard, en we helpen je graag om deze overstap te
            maken.
          </Balancer>
        </p>
        <div className="flex gap-x-6 items-center">
          <BoxedButton
            href="/actueel/#TODO"
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
