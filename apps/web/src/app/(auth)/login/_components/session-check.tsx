import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "~/lib/auth/server";

async function SessionCheckLogic() {
  const session = await getSession();

  if (session) {
    redirect("/profiel?_cacheBust=1");
  }

  return null;
}

export default function SessionCheck() {
  return (
    <Suspense fallback={null}>
      <SessionCheckLogic />
    </Suspense>
  );
}
