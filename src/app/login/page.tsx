import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { LoginShowcase } from "@/components/auth/login-showcase";

export default function LoginPage() {
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="hidden lg:block">
        <LoginShowcase />
      </div>

      <div className="flex items-center justify-center bg-hub-paper px-5 py-16 lg:border-l lg:border-hub-foreground/8 lg:px-10 xl:px-16">
        <Suspense fallback={<p className="text-hub-foreground/50">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
