import FaqGroup from "~/app/(public)/_components/faq/faq-group";
import { listFaqs } from "~/lib/faqs";

export default async function LaunchFaq({ category }: { category: string }) {
  const questions = await listFaqs({
    filter: {
      category,
    },
  });

  return <FaqGroup faqs={questions} />;
}
