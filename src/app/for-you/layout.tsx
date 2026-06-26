import { HubShell } from "@/components/hub/hub-shell";

export default function ForYouLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HubShell>{children}</HubShell>;
}
