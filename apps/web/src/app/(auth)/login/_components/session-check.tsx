import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "~/lib/supabase/server";

async function SessionCheckLogic() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  if (data.user) {
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
