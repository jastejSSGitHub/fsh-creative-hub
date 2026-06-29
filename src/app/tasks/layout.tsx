import { HubShell } from "@/components/hub/hub-shell";

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HubShell variant="inbox">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </HubShell>
  );
}
