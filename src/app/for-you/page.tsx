import { redirect } from "next/navigation";

import { ForYouList } from "@/components/inbox/for-you-list";
import { getForYouItems } from "@/lib/inbox/queries";
import { LOGIN_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export default async function ForYouPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const items = await getForYouItems(supabase, user.id);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-hub-espresso/40">
          Inbox
        </p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-hub-espresso sm:text-3xl">
          For you
        </h1>
        <p className="max-w-xl text-xs text-hub-espresso/55">
          Mentions and open threads on assets you uploaded, across every project.
        </p>
      </div>

      <ForYouList items={items} />
    </section>
  );
}
