import FaqGroup from "~/app/_components/faq/faq-group";
import type { Faq } from "~/lib/faqs";
import { listFaqs } from "~/lib/faqs";

export default async function LaunchFaq({
  category,
}: {
  category: Faq["category"];
}) {
  const questions = await listFaqs({
    filter: {
      category,
    },
  });

  return (
    <>
      <FaqGroup faqs={questions} />
    </>
  );
}
