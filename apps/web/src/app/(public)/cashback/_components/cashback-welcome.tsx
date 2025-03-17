import Balancer from "react-wrap-balancer";
import { BoxedButton } from "../../_components/style/buttons";

export default function CashbackWelcome() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-16">
      <div className="gap-6 grid max-w-3xl text-white">
        <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl">
          <Balancer>
            Cashback actie voor jouw watersportdiploma en ontvang tot €X,-
          </Balancer>
        </h1>
        <p className="text-xl">
          <Balancer>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip.
          </Balancer>
        </p>
      </div>
      <BoxedButton
        href="/actueel/#TODO"
        className="bg-white text-branding-dark"
      >
        Lees meer over de actie
      </BoxedButton>
    </div>
  );
}
