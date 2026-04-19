import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "~/lib/supabase/server";

// Leercoach is auth-only. Q7 decision (leercoach-pivot.md): per-user hard
// budget via Supabase. Anonymous users are redirected to login with a
// bounce-back.
export default async function LeercoachLayout({
  children,
}: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=/leercoach");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">{children}</div>
    </div>
  );
}
