import type { Faq as FaqType } from "~/lib/faqs";
import Faq from "./faq";

export default function FaqGroup({ faqs }: { faqs: FaqType[] }) {
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map(({ answer, question }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: {
                "@type": "Answer",
                text: answer,
              },
            })),
          }),
        }}
      />

      <dl className="divide-y divide-slate-900/10 rounded-lg border border-slate-900/10">
        {faqs.length < 1 ? (
          <div className="p-4 text-center text-slate-900/50">
            Er zijn geen vragen gevonden.
          </div>
        ) : null}
        {faqs.map(({ answer, question }) => (
          <Faq key={question} question={question}>
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: intentional */}
            <div dangerouslySetInnerHTML={{ __html: answer }} />
          </Faq>
        ))}
      </dl>
    </>
  );
}
