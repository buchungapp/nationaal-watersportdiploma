import { listFaqs } from "~/lib/faqs";

export default async function Page() {
  const questions = await listFaqs({ filter: "instructeur" });

  console.log("questions", questions);

  return "hallo";
}
