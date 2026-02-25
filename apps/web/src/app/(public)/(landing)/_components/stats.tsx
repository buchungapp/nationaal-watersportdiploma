import Double from "~/app/_components/brand/double-line";

const stats = [
  {
    value: "1 norm",
    label: "Officieel erkend vanaf 2026",
    description:
      "Het Watersportverbond stelt duidelijkheid voorop. Dit is de enige standaard.",
  },
  {
    value: "126.570+",
    label: "Behaalde competenties in 2025",
    description:
      "De groeiende beweging van watersporters die kiest voor bewezen veiligheid.",
  },
  {
    value: "100%",
    label: "Getoetste instructeurs",
    description:
      "Wij garanderen topkwaliteit door continue bijscholing. Zonder uitzonderingen.",
  },
];

export default function Stats() {
  return (
    <section className="relative z-10 overflow-hidden rounded-[3rem] bg-branding-dark py-16 sm:py-24">
      <div className="container mx-auto px-4 lg:px-16">
        <div className="grid gap-16">
          <div className="max-w-(--breakpoint-lg) mx-auto text-center grid gap-4">
            <div className="flex items-center justify-center gap-x-3 font-bold uppercase text-white/60">
              <span className="whitespace-nowrap">Kwaliteit is geen keuze</span>
              <Double className="text-white/40" />
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl text-balance">
              De cijfers achter Nederlands veiligste water
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {stats.map((stat) => (
              <div key={stat.value} className="text-center grid gap-3">
                <span className="text-5xl sm:text-6xl font-extrabold text-white">
                  {stat.value}
                </span>
                <span className="text-sm font-bold uppercase tracking-wide text-branding-orange">
                  {stat.label}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
