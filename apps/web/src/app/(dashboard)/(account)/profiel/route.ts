import { redirect } from "next/navigation";
import { getUserOrThrow } from "~/lib/nwd";
import { getProfileRedirectPath } from "~/lib/profile-redirect";

export async function GET() {
  const user = await getUserOrThrow();

  redirect(getProfileRedirectPath(user.persons));
}
