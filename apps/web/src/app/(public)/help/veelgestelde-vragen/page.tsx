import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { getHelpFaqs } from "~/lib/help-content";
import Breadcrumb from "../../_components/breadcrumb";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(
  _: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const [parentMeta] = await Promise.all([parent]);

  return {
    title: "Veelgestelde vragen",
    description: "Ontdek antwoorden op veelgestelde vragen.",
    alternates: {
      canonical: "/help/veelgestelde-vragen",
    },
    openGraph: {
      ...parentMeta.openGraph,
      title: "Veelgestelde vragen",
      description: parentMeta.openGraph?.description,
      url: "/help/veelgestelde-vragen",
    },
  };
}

export default async function Page() {
  const [questions] = await Promise.all([getHelpFaqs()]);

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Helpcentrum", href: "/help" },
          {
            label: "Veelgestelde vragen",
            href: "/help/veelgestelde-vragen",
          },
        ]}
      />

      <div className="">
        <h1 className="text-3xl font-bold lg:text-4xl xl:text-5xl text-branding-dark">
          Veelgestelde vragen
        </h1>
        <p className="text-lg/6 text-slate-800 mt-4">
          Ontdek antwoorden op veelgestelde vragen.
        </p>
      </div>

      <ul className="space-y-3.5 w-full">
        {questions.map((question) => (
          <li key={question.slug}>
            <Link
              href={`/help/veelgestelde-vragen/${question.slug}`}
              className="group flex gap-1 justify-between text-base font-semibold transition-colors text-branding-dark hover:bg-branding-dark/10 w-full rounded-2xl bg-slate-100 px-6 py-4"
            >
              <span className="mr-2">{question.metadata.question}</span>
              <ArrowLongRightIcon
                className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
                strokeWidth={2.5}
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
