const roles = [
  {
    name: "Watersportverbond",
    role: "Erkenning en uitvoering",
    description:
      "Erkent de NWD-eigenvaardigheidslijn en opleidingslocaties, stelt watersportspecifieke kwalificatieprofielen vast en houdt toezicht op opleidingen en toetsing.",
  },
  {
    name: "NOC*NSF en KSS",
    role: "Landelijke opleidingseisen",
    description:
      "De Kwalificatiestructuur Sport beschrijft de competenties en toetsing van sportkader. De kaderkwalificaties van het Watersportverbond zijn erkend door NOC*NSF.",
  },
  {
    name: "World Sailing",
    role: "Internationale programma-erkenning",
    description:
      "Het nationale zeilopleidingsprogramma van het Watersportverbond heeft de erkenning World Sailing Recognised Training. Deze betreft de kwaliteit van het programma.",
  },
];

export default function QualificationRoles() {
  return (
    <figure className="not-prose my-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <figcaption className="mb-5 text-lg font-bold text-slate-900">
        Erkenning, opleidingseisen en niveau-inschaling
      </figcaption>
      <dl className="grid gap-4 sm:grid-cols-3">
        {roles.map(({ name, role, description }) => (
          <div key={name} className="rounded-xl bg-slate-50 p-4">
            <dt className="font-semibold text-branding-dark">{name}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-slate-600">
              <span className="mb-2 block font-semibold text-slate-900">
                {role}
              </span>
              {description}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="font-semibold text-branding-dark">
          NCP NLQF: het niveau van een kwalificatie
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          Het NCP NLQF stelt het niveau van de leeruitkomsten van een opleiding
          vast. Het bijbehorende EQF-niveau maakt dit niveau in Europa
          vergelijkbaar. Deze inschaling geeft geen overheidserkenning,
          kwaliteitskeurmerk of opleidingslicentie.
        </p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        NWD en Watersport Academy bieden dezelfde eigenvaardigheidslijn aan.
        Erkenning van een opleidingslocatie en NLQF-inschaling van een
        specifieke kaderkwalificatie hebben ieder een eigen betekenis.
      </p>
    </figure>
  );
}
