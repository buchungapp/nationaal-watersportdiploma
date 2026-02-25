"use client";

import FaqDisclosure from "~/app/(public)/_components/faq/faq.tsx";

interface FaqItem {
  question: string;
  answer: string;
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
        </FaqDisclosure>
      ))}
    </dl>
  );
}
