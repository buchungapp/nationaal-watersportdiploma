import Logo from "~/app/_components/brand/logo";
import { BoxedButton } from "~/app/(public)/_components/style/buttons";
import WaveAnimation from "../../_components/style/wave-animation";

export default function Seperator() {
  return (
    <section className="relative z-10 flex flex-col items-center gap-8 overflow-hidden rounded-[3rem] bg-branding-light py-12 lg:gap-12 lg:py-20">
      <div className="grid gap-4 text-center max-w-(--breakpoint-lg) px-8 lg:px-16">
        <h2 className="text-3xl font-bold text-white lg:text-5xl xl:text-6xl text-balance">
          Klaar voor een zorgeloze tijd op het water?
        </h2>
        <p className="text-lg text-white/80 leading-relaxed">
          Vind een vaarschool waar je zeker weet dat de veiligheid, instructeurs
          en het materiaal tiptop in orde zijn. Het enige wat jij hoeft te doen,
          is genieten.
        </p>
      </div>
      <BoxedButton
        href="/vaarlocaties"
        className="bg-white text-branding-dark font-bold"
      >
        Vind jouw perfecte NWD-school
      </BoxedButton>
      <Logo
        className="absolute -left-10 -top-12 -z-10 h-[24rem] w-[24rem] -rotate-[15deg] text-transparent opacity-20 lg:h-[28rem] lg:w-[28rem]"
        plainColor="branding-dark"
      />
      <WaveAnimation begin={-600} end={-100} />
    </section>
  );
}
