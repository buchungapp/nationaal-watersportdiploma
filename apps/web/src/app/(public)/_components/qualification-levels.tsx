const profileBaseUrl =
  "https://fls-a00a39e3-96ae-443d-9a29-20809d9171d3.laravel.cloud/media/";

const qualifications = [
  {
    name: "Wal/waterhulp 1 (I1)",
    level: 2,
    profile: "5b58cd18-cb26-4345-a37c-c2db4ae7ab6e",
  },
  {
    name: "Instructeur 2 (I2)",
    level: 3,
    profile: "229b82b5-a9c2-4fea-8a86-2c22e16f311d",
  },
  {
    name: "Instructeur 3 (I3)",
    level: 4,
    profile: "d1aa94c7-14cb-42ef-a416-41e104841ff2",
  },
  {
    name: "Instructeur 4 (I4)",
    level: 5,
    profile: "a7ceeab7-7ced-473b-af42-3ce281ed5737",
  },
  {
    name: "Instructeur 5 (I5)",
    level: 6,
    profile: "b56ac183-1ffc-4a0c-b61a-16697b9625d2",
  },
  {
    name: "PvB-beoordelaar 4 (B4)",
    level: 5,
    profile: "d2cac9d0-7165-4b6b-94d1-041eefc7d920",
  },
  {
    name: "Leercoach 5 (L5)",
    level: 6,
    profile: "da16456f-cdf4-4e1a-bb45-61892ad2473c",
  },
  {
    name: "PvB-beoordelaar 5 (B5)",
    level: 6,
    profile: "b6e4f5a1-9c82-495d-9e21-ade87e2c91f1",
  },
];

export default function QualificationLevels() {
  return (
    <div className="not-prose my-6">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <caption className="bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
            NLQF/EQF-niveaus volgens de watersportprofielen van 4 november 2025
          </caption>
          <thead className="border-y border-slate-200 bg-slate-50 text-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3">
                Kwalificatie
              </th>
              <th scope="col" className="px-4 py-3">
                NLQF
              </th>
              <th scope="col" className="px-4 py-3">
                EQF
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {qualifications.map(({ name, level, profile }) => (
              <tr key={name}>
                <th scope="row" className="px-4 py-3 font-medium">
                  <a
                    href={`${profileBaseUrl}${profile}.pdf`}
                    className="text-branding-dark underline underline-offset-2 hover:no-underline"
                  >
                    {name}
                    <span className="sr-only">: kwalificatieprofiel (PDF)</span>
                  </a>
                </th>
                <td className="px-4 py-3">{level}</td>
                <td className="px-4 py-3">{level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">
        Leercoach 4 (L4) heeft een eigen profiel. De Watersport Academy verwijst
        hiervoor naar een{" "}
        <a
          href={`${profileBaseUrl}703de15b-7fd7-414b-959b-70bd5c98f48b.pdf`}
          className="text-branding-dark underline underline-offset-2"
        >
          profiel Praktijkbegeleider 4 met NLQF/EQF-niveau 5
        </a>
        , terwijl het{" "}
        <a
          href={`${profileBaseUrl}d841b018-b936-4701-b64e-64ded4a09242.pdf`}
          className="text-branding-dark underline underline-offset-2"
        >
          toetsplan Leercoach 4
        </a>{" "}
        aanvullende taken noemt. Daarom vermelden we voor L4 nog geen definitief
        NLQF/EQF-niveau. De bevoegdheden van L4 blijven beschreven in het
        toetsplan van het Watersportverbond.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        De nummers I1–I5, L4–L5 en B4–B5 zijn KSS-rangen. Ze geven niet
        hetzelfde aan als een NLQF/EQF-niveau. De tabel geldt voor de genoemde
        profielen; oudere diploma’s en afzonderlijke onderdelen krijgen hierdoor
        niet automatisch een nieuw niveau.
      </p>
    </div>
  );
}
