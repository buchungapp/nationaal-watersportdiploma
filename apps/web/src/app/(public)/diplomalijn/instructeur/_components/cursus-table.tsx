import { listPublicInstructiegroepenWithCourses } from "~/lib/kss-public";

export async function CursusTable() {
  const groepen = await listPublicInstructiegroepenWithCourses("instructeur");
  const totalCourses = groepen.reduce((s, g) => s + g.courses.length, 0);

  if (totalCourses === 0) {
    return (
      <div className="not-prose rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        De koppeling tussen cursussen en instructiegroepen wordt op dit moment
        ingericht. Zodra deze beschikbaar is verschijnt hier per instructiegroep
        een actueel overzicht van de bijbehorende cursussen.
      </div>
    );
  }

  return (
    <div className="not-prose overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-slate-700">
              Instructiegroep
            </th>
            <th className="px-4 py-2 text-left font-semibold text-slate-700">
              Cursussen
            </th>
          </tr>
        </thead>
        <tbody>
          {groepen.map((groep) => (
            <tr
              key={groep.id}
              className="border-t border-slate-100 align-top"
            >
              <td className="w-48 px-4 py-3 font-medium text-slate-900">
                {groep.title}
                <span className="ml-2 font-mono text-xs text-slate-500">
                  {groep.courses.length}
                </span>
              </td>
              <td className="px-4 py-3">
                {groep.courses.length === 0 ? (
                  <span className="text-slate-400">—</span>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {groep.courses.map((course) => (
                      <li
                        key={course.id}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200"
                      >
                        {course.code && (
                          <span className="font-mono text-[10px] text-slate-500">
                            {course.code}
                          </span>
                        )}
                        <span>{course.title ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
