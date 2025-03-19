import Balancer from "react-wrap-balancer";
import { BoxedButton } from "../../_components/style/buttons";

export default function CashbackWelcome() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-16">
      <div className="gap-6 grid max-w-4xl text-white">
        <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl">
          <Balancer>€50 Cashback bij inlevering van je CWO-diploma!</Balancer>
        </h1>
        <p className="text-xl">
          <Balancer>
            Ter ere van de overgang van CWO naar NWD ontvang je €50 cashback
            wanneer je in 2024 een CWO-diploma behaalt én een meerdaagse cursus
            of zeilkamp boekt bij een NWD-locatie.
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
