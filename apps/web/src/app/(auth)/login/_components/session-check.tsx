import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "~/lib/supabase/server";

async function SessionCheckLogic() {
  const supabase = createClient();

  const { data } = await supabase.auth.getUser();

  if (!!data.user) {
    redirect("/profiel");
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
