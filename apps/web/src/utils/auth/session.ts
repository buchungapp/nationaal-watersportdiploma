import { cache } from "react";
import { createClient } from "~/lib/supabase/server";

async function currentSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export function getSession() {
  return cache(() => currentSession())();
}
