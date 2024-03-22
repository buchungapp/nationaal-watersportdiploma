import FaqGroup from "~/app/_components/faq/faq-group";
import type { Faq } from "~/lib/faqs-diplomalijn";
import { listFaqs } from "~/lib/faqs-diplomalijn";

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
