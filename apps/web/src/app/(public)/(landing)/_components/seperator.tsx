import Logo from "~/app/_components/brand/logo";
import WaveAnimation from "../../_components/style/wave-animation";

export default function Seperator() {
  return (
    <section className="relative z-10 flex flex-col items-center gap-8 overflow-hidden rounded-[3rem] bg-branding-light py-8 lg:gap-20 lg:py-16">
      <h2 className="max-w-screen-lg px-8 text-center text-3xl font-bold text-white lg:px-16 lg:text-5xl xl:text-6xl">
        Wij zijn klaar voor het nieuwe vaarseizoen, jij ook?
      </h2>
      <Logo
        className="absolute -left-10 -top-12 -z-10 h-[24rem] w-[24rem] -rotate-[15deg] text-transparent opacity-20 lg:h-[28rem] lg:w-[28rem]"
        plainColor="branding-dark"
      />
      <WaveAnimation begin={-600} end={-100} />
    </section>
  );
}
