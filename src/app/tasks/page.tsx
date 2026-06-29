import { redirect } from "next/navigation";

import { TASKS_TODAY_PATH } from "@/lib/routes";

export default function TasksIndexPage() {
  redirect(TASKS_TODAY_PATH);
}
