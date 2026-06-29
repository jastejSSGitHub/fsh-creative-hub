import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const admin = createClient(url, serviceKey);
const userId = "74d7becd-3c95-4171-9c70-ea4d37f42bb1";

const { data: authUser } = await admin.auth.admin.getUserById(userId);
console.log("auth user", authUser.user?.email);

const anon = createClient(url, anonKey);
const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
  email: "dev@fshdesign.local",
  password: process.env.DEV_AUTH_BYPASS_PASSWORD ?? "dev-bypass-local-only",
});

if (signInError) {
  console.error("sign in failed", signInError);
  process.exit(1);
}

console.log("signed in as", signIn.user?.id);

const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);

const { data: sessionData } = await anon.auth.getSession();
console.log("session user id", sessionData.session?.user?.id);

const insertOnly = await anon.from("hub_tasks").insert({
  name: "Demo Task insert only",
  project_id: null,
  due_at: endOfDay.toISOString(),
  assignee_id: signIn.user.id,
  created_by: signIn.user.id,
  priority: 4,
  sort_order: 0,
});
console.log("insert only", insertOnly);

const { data: selected, error: selectError } = await anon
  .from("hub_tasks")
  .select("id, name")
  .eq("name", "Demo Task insert only");
console.log("select after insert", { selected, selectError });
