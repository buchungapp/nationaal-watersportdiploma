import Link from "next/link";
import Double from "~/app/_components/brand/double-line";
import { listCourses, listDisciplines } from "~/lib/nwd";
import DiplomaTabs from "./diplomalijn-tabs";

const usps = [
  {
    title: "Modulair opgebouwd",
    description:
      "Kern- en keuzemodules: leer wat je wilt, wanneer je wilt. Behaalde modules vervallen nooit.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="size-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
        />
      </svg>
    ),
  },
  {
    title: "4 niveaus, jouw tempo",
    description:
      "Van beginner tot zelfstandig varen. Elke stap bouwt voort op de vorige, met gelijkmatige progressie.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="size-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
  },
  {
    title: "Diploma per vaartuig",
    description:
      "Elk diploma is gekoppeld aan een specifiek vaartuig, zodat het een eerlijke weerspiegeling is van jouw vaardigheden.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="size-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
        />
      </svg>
    ),
  },
];

export default async function Diplomalijn() {
  const [disciplines, courses] = await Promise.all([
    listDisciplines(),
    listCourses("consument"),
  ]);

  return (
    <section className="mx-auto w-full max-w-(--breakpoint-xl)">
      <div className="grid gap-8 lg:gap-12">
        {/* Header */}
        <div className="grid gap-3">
          <div className="flex items-center gap-x-3 font-bold uppercase text-branding-dark">
            <span className="whitespace-nowrap">De NWD diplomalijn</span>
            <Double />
          </div>
          <div className="flex items-end justify-between gap-8">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl text-balance">
              Jouw route, jouw diploma
            </h2>
            <Link
              href="/diplomalijn/consument"
              className="hidden shrink-0 rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10 sm:inline-flex items-center gap-1.5 transition-colors"
            >
              Bekijk de diplomalijn
              <span aria-hidden="true">{"\u2192"}</span>
            </Link>
          </div>
          <p className="text-lg text-slate-600 text-pretty max-w-2xl">
            Het NWD werkt met een moderne, modulaire diplomalijn. Kies je eigen
            discipline, werk op jouw tempo door vier niveaus en bouw een diploma
            op dat past bij jouw ambities.
          </p>
          <Link
            href="/diplomalijn/consument"
            className="self-start rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10 inline-flex items-center gap-1.5 transition-colors sm:hidden"
          >
            Bekijk de diplomalijn
            <span aria-hidden="true">{"\u2192"}</span>
          </Link>
        </div>

        {/* USP cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {usps.map((usp) => (
            <div
              key={usp.title}
              className="flex items-start gap-4 rounded-xl border border-slate-200 p-5 sm:p-6 transition-colors hover:border-slate-300 hover:bg-slate-50/50"
            >
              <div className="inline-flex shrink-0 p-2.5 rounded-full bg-branding-light/10 text-branding-dark">
                {usp.icon}
              </div>
              <div className="grid gap-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">
                  {usp.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {usp.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive discipline tabs */}
        <DiplomaTabs
          disciplines={disciplines}
          courses={courses.map((c) => ({
            id: c.id,
            handle: c.handle,
            title: c.title,
            disciplineId: c.discipline.id,
          }))}
        />
      </div>
    </section>
  );
}
