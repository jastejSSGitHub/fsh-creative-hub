import { redirect } from "next/navigation";

import { LANDING_PATH } from "@/lib/routes";

/** Alias so /landing works; canonical URL remains `/`. */
export default function LandingAliasPage() {
  redirect(LANDING_PATH);
}
