import type { Faq as FaqType } from "~/lib/faqs";
import Faq from "./faq";

export default function FaqGroup({ faqs }: { faqs: FaqType[] }) {
  return (
    <dl className="divide-y divide-gray-900/10 rounded-lg border border-gray-900/10">
      {faqs.length < 1 ? (
        <div className="p-4 text-center text-gray-900/50">
          Er zijn geen vragen gevonden.
        </div>
      ) : null}
      {faqs.map(({ answer, question }) => (
        <Faq key={question} question={question}>
          <div dangerouslySetInnerHTML={{ __html: answer }} />
        </Faq>
      ))}
    </dl>
  );
}
