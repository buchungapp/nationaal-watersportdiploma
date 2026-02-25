import Double from "~/app/_components/brand/double-line";

const stats = [
  {
    value: "11",
    label: "Erkende vaarlocaties",
    description:
      "Van Friesland tot Zeeland: overal dezelfde hoge standaard.",
  },
  {
    value: "804",
    label: "Actieve instructeurs",
    description:
      "Een groeiende community van gedreven professionals op het water.",
  },
  {
    value: "5.500+",
    label: "Diploma's in 2025",
    description:
      "In ons tweede vaarseizoen behaalden duizenden cursisten hun NWD-diploma.",
  },
];

export default function Stats() {
  return (
    <section className="relative z-10 overflow-hidden rounded-2xl bg-branding-dark py-12 sm:rounded-[3rem] sm:py-24">
      <div className="mx-auto max-w-(--breakpoint-xl) px-6 sm:px-8 lg:px-16">
        <div className="grid gap-16">
          <div className="mx-auto text-center grid gap-4">
            <div className="flex items-center justify-center gap-x-3 font-bold uppercase text-white/60">
              <Double className="text-white/40" />
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
