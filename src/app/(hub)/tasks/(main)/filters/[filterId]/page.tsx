import { notFound, redirect } from "next/navigation";

import { getFilterById } from "@/lib/tasks/queries";
import { LOGIN_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

type FilterPageProps = {
  params: Promise<{ filterId: string }>;
};

export default async function TasksFilterPage({ params }: FilterPageProps) {
  const { filterId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const filter = await getFilterById(supabase, filterId);
  if (!filter) notFound();

  return null;
}
