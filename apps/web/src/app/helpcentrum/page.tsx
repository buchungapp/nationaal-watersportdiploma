import { listFaqs } from "~/lib/faqs";

export default async function Page() {
  const _questions = await listFaqs({
    filter: {
      category: "instructeur",
    },
  });

  return "hallo";
}
