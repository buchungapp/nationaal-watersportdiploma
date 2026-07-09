import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getEigenvaardigheidMatrix } from "~/lib/eigenvaardigheid-public";

function disciplineHref(handle: string) {
  return `/diplomalijn/instructeur/eigenvaardigheid/disciplines?discipline=${encodeURIComponent(handle)}`;
}

function EigenvaardigheidDisciplineCardsView({
  disciplines,
}: {
  disciplines: Array<{ handle: string; title: string }>;
}) {
  if (disciplines.length === 0) {
    return (
      <div className="not-prose rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
        Er zijn nog geen instructeur-eigenvaardigheidsdisciplines gepubliceerd.
      </div>
    );
  }

  return (
    <div className="not-prose grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {disciplines.map(({ handle, title }) => (
        <Link
          key={handle}
          href={disciplineHref(handle)}
          className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-colors hover:border-branding-light/40 hover:bg-branding-light/5 hover:shadow-md"
        >
          <p className="text-base font-semibold text-slate-900 group-hover:text-branding-dark">
            {title}
          </p>
          <ArrowRightIcon
            className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-branding-dark"
            aria-hidden="true"
          />
        </Link>
      ))}
    </div>
  );
}

export async function EigenvaardigheidDisciplineCards() {
  const rows = await getEigenvaardigheidMatrix();
  const disciplines = rows.map(({ handle, title }) => ({ handle, title }));
  return <EigenvaardigheidDisciplineCardsView disciplines={disciplines} />;
}
