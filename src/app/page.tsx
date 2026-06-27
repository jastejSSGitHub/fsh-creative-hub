import { Suspense } from "react";

import { LandingPage } from "@/components/landing/landing-page";
import { OAuthCodeRedirect } from "@/components/auth/oauth-code-redirect";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Suspense fallback={null}>
        <OAuthCodeRedirect />
      </Suspense>
      <LandingPage isLoggedIn={!!user} />
    </>
  );
}
