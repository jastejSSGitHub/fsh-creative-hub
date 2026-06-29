import { redirect } from "next/navigation";

import { getLabels } from "@/lib/tasks/queries";
import { LOGIN_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

type LabelPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function TasksLabelPage({ params }: LabelPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(LOGIN_PATH);

  const labels = await getLabels(supabase);
  const label = labels.find((entry) => entry.name.toLowerCase() === slug.toLowerCase());

  if (!label) {
    // Unknown labels still render an empty workspace via the shared shell.
    return null;
  }

  return null;
}
