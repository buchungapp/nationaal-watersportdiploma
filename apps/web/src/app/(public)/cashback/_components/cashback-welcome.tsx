import Balancer from "react-wrap-balancer";
import { BoxedButton } from "../../_components/style/buttons";

export default function CashbackWelcome() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-16">
      <div className="gap-6 grid max-w-4xl text-white">
        <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl">
          <Balancer>
            Ontvang €50 cashback bij inlevering van je CWO-diploma!<sup>*</sup>
          </Balancer>
        </h1>
        <p className="text-xl">
          <Balancer>
            De diplomalijn van het Nationaal Watersportdiploma wordt de nieuwe
            landelijke standaard, en we helpen je graag om deze overstap te
            maken.
          </Balancer>
        </p>
      </div>
      <BoxedButton
        href="/actueel/#TODO"
        className="bg-white text-branding-dark"
      >
        Lees de aankondiging
      </BoxedButton>
    </div>
  );
}
