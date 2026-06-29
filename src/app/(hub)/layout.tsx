import { HubShell } from "@/components/hub/hub-shell";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HubShell>{children}</HubShell>;
}
