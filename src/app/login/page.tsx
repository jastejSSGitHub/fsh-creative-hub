import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { LoginShowcase } from "@/components/auth/login-showcase";

export default function LoginPage() {
  return (
    <div className="grid h-dvh overflow-hidden lg:grid-cols-2">
      <div className="hidden lg:block">
        <LoginShowcase />
      </div>

      <div
        data-fsh-scroll
        className="fsh-scroll flex items-center justify-center overflow-y-auto bg-hub-paper px-5 py-16 lg:border-l lg:border-hub-foreground/8 lg:px-10 xl:px-16"
      >
        <Suspense fallback={<p className="text-hub-foreground/50">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
