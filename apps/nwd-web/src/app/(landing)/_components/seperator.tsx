import Logo from "~/app/_components/brand/logo";
import WaveAnimation from "../../_components/style/wave-animation";

export default function Seperator() {
  return (
    <section className="bg-branding-light relative rounded-[3rem] py-8 gap-8 z-10 lg:py-16 items-center flex flex-col lg:gap-20 overflow-hidden">
      <h2 className="font-bold text-white text-3xl px-8 lg:px-16 lg:text-5xl xl:text-6xl max-w-screen-lg text-center">
        Wij zijn klaar voor het nieuwe vaarseizoen, jij ook?
      </h2>
      <Logo
        className="w-[24rem] h-[24rem] opacity-20 lg:w-[28rem] lg:h-[28rem] -top-12 -left-10 -rotate-[15deg] text-transparent absolute -z-10"
        plainColor="branding-dark"
      />
      <WaveAnimation begin={-600} end={-100} />
    </section>
  );
}
