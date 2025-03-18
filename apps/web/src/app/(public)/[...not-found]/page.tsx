import { notFound } from "next/navigation";

export default function CatchAll() {
  notFound(); // Triggers Next.js to send a 404 status, important for SEO
}
