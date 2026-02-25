"use client";

import Link from "next/link";
import FaqDisclosure from "~/app/(public)/_components/faq/faq.tsx";

interface FaqItem {
  question: string;
  answer: string;
  link?: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <dl className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
      {items.map((item, index) => (
        <FaqDisclosure
          key={item.question}
          question={item.question}
          defaultOpen={index === 0}
        >
          <p className="text-sm text-slate-600 leading-relaxed">
            {item.answer}
          </p>
          {item.link ? (
            <Link
              href={item.link}
              className="mt-3 inline-block text-sm font-semibold text-branding-dark hover:underline"
            >
              {"Verder lezen \u2192"}
            </Link>
          ) : null}
        </FaqDisclosure>
      ))}
    </dl>
  );
}
