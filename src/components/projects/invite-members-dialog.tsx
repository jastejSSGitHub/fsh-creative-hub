"use client";

import { Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { copyProjectLink } from "@/components/projects/project-card";
import { HubDialog } from "@/components/projects/hub-dialog";
import { HubSelect } from "@/components/ui/hub-select";
import { inviteEmailDomain, validateInviteEmail } from "@/lib/email";
import {
  inviteProjectMemberAction,
  removeProjectMemberAction,
  updateProjectMemberRoleAction,
} from "@/lib/projects/actions";
import { roleLabel } from "@/lib/permissions";
import type { ProjectCardData } from "@/lib/projects/queries";
import type { HubRole } from "@/types/database";

type PendingAdminAction =
  | { kind: "invite"; email: string }
  | { kind: "role"; memberUserId: string; memberName: string };

type InviteMembersDialogProps = {
  project: ProjectCardData | null;
  currentUserId: string;
  onClose: () => void;
};

const ROLES: HubRole[] = ["admin", "editor", "viewer"];

const ROLE_OPTIONS = ROLES.map((role) => ({
  value: role,
  label: roleLabel(role),
}));

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toLowerCase();
  return `${parts[0][0]}${parts[1][0]}`.toLowerCase();
}

function roleDisplay(role: HubRole): string {
  return roleLabel(role).toLowerCase();
}

export function InviteMembersDialog({
  project,
  currentUserId,
  onClose,
}: InviteMembersDialogProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<HubRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAdminAction, setPendingAdminAction] =
    useState<PendingAdminAction | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = project != null;

  function handleClose() {
    if (isPending) return;
    setEmail("");
    setRole("editor");
    setError(null);
    setMessage(null);
    setPendingAdminAction(null);
    onClose();
  }

  function handleCopyLink() {
    if (!project) return;

    void copyProjectLink(project.id).then(() => {
      setError(null);
      setMessage("Link copied.");
    });
  }

  function submitInvite(inviteEmail: string) {
    if (!project) return;

    const formData = new FormData();
    formData.set("projectId", project.id);
    formData.set("email", inviteEmail);
    formData.set("role", role);

    startTransition(async () => {
      const result = await inviteProjectMemberAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setEmail("");
      setPendingAdminAction(null);
      setMessage("Member added. They can sign in with that email.");
      router.refresh();
    });
  }

  function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    if (!project) return;

    setError(null);
    setMessage(null);

    const emailResult = validateInviteEmail(email);
    if (!emailResult.ok) {
      setError(emailResult.error);
      return;
    }

    if (role === "admin") {
      setPendingAdminAction({ kind: "invite", email: emailResult.email });
      return;
    }

    submitInvite(emailResult.email);
  }

  function confirmAdminAction() {
    if (!pendingAdminAction || !project) return;

    if (pendingAdminAction.kind === "invite") {
      submitInvite(pendingAdminAction.email);
      return;
    }

    const { memberUserId } = pendingAdminAction;
    setPendingAdminAction(null);
    changeRole(memberUserId, "admin");
  }

  function requestMemberRoleChange(
    memberUserId: string,
    memberName: string,
    currentRole: HubRole,
    nextRole: HubRole,
  ) {
    if (nextRole === "admin" && currentRole !== "admin") {
      setError(null);
      setMessage(null);
      setPendingAdminAction({ kind: "role", memberUserId, memberName });
      return;
    }

    changeRole(memberUserId, nextRole);
  }

  function changeRole(memberUserId: string, nextRole: HubRole) {
    if (!project) return;

    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.set("projectId", project.id);
    formData.set("memberUserId", memberUserId);
    formData.set("role", nextRole);

    startTransition(async () => {
      const result = await updateProjectMemberRoleAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessage("Role updated.");
      setPendingAdminAction(null);
      router.refresh();
    });
  }

  function removeMember(memberUserId: string) {
    if (!project) return;

    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.set("projectId", project.id);
    formData.set("memberUserId", memberUserId);

    startTransition(async () => {
      const result = await removeProjectMemberAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setMessage("Member removed.");
      router.refresh();
    });
  }

  return (
    <HubDialog
      open={open}
      onClose={handleClose}
      title={project ? `Members · ${project.name}` : "Members"}
      headerAction={
        project ? (
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex shrink-0 items-center gap-1 rounded-[6px] px-1.5 py-1 text-[0.8125rem] font-medium text-[#18a0fb] transition-colors hover:bg-[#18a0fb]/10"
          >
            <Link2 className="size-3.5" strokeWidth={2} />
            Copy link
          </button>
        ) : undefined
      }
    >
      {project && (
        <div className="space-y-4 overflow-visible">
          {error && (
            <p className="rounded-[6px] border border-hub-rejected/30 bg-hub-rejected/10 px-3 py-2 text-xs text-hub-rejected">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-[6px] border border-hub-approved/30 bg-hub-approved/10 px-3 py-2 text-xs text-hub-espresso">
              {message}
            </p>
          )}

          {pendingAdminAction && (
            <div className="rounded-[6px] border border-hub-espresso/12 bg-white px-3 py-3">
              <p className="text-[0.8125rem] leading-relaxed text-hub-espresso">
                {pendingAdminAction.kind === "invite" ? (
                  <>
                    Are you sure you want to make{" "}
                    <span className="font-medium">{pendingAdminAction.email}</span>{" "}
                    an admin? They&apos;ll be able to manage members, delete
                    content, and change project settings.
                  </>
                ) : (
                  <>
                    Are you sure you want to make{" "}
                    <span className="font-medium">
                      {pendingAdminAction.memberName}
                    </span>{" "}
                    an admin? They&apos;ll be able to manage members, delete
                    content, and change project settings.
                  </>
                )}
              </p>
              <div className="mt-2.5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingAdminAction(null)}
                  disabled={isPending}
                  className="rounded-[6px] px-2.5 py-1.5 text-[0.8125rem] text-hub-espresso/70 transition-colors hover:bg-hub-espresso/[0.05] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAdminAction}
                  disabled={isPending}
                  className="rounded-[6px] bg-hub-espresso px-2.5 py-1.5 text-[0.8125rem] font-medium text-hub-paper transition-colors hover:bg-hub-espresso/90 disabled:opacity-60"
                >
                  {isPending ? "Saving…" : "Yes, make admin"}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={inviteMember} className="overflow-visible">
            <div className="flex items-stretch gap-2 overflow-visible">
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                placeholder={`name@${inviteEmailDomain()}`}
                className="min-h-8 min-w-0 flex-1 rounded-[6px] border border-hub-espresso/12 bg-white px-2.5 text-[0.8125rem] text-hub-espresso outline-none ring-[#18a0fb]/40 placeholder:text-hub-espresso/40 focus:border-[#18a0fb]/50 focus:ring-1 disabled:opacity-60"
              />

              <HubSelect
                value={role}
                onChange={setRole}
                options={ROLE_OPTIONS}
                disabled={isPending}
                aria-label="Role for invite"
                variant="field"
              />

              <button
                type="submit"
                disabled={isPending}
                className="shrink-0 rounded-[6px] bg-hub-espresso/[0.08] px-3 text-[0.8125rem] font-medium text-hub-espresso transition-colors hover:bg-hub-espresso/[0.12] disabled:opacity-60"
              >
                {isPending ? "Inviting…" : "Invite"}
              </button>
            </div>
          </form>

          <div className="space-y-1.5">
            <p className="text-[0.6875rem] font-medium text-hub-espresso/45">
              Who has access
            </p>
            <ul className="max-h-56 space-y-0.5 overflow-y-auto">
              {project.members.map((member) => {
                const isSelf = member.id === currentUserId;

                return (
                  <li
                    key={member.id}
                    className="group flex items-center gap-2.5 rounded-[6px] py-1.5 pr-1 transition-colors hover:bg-hub-espresso/[0.04]"
                  >
                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#18a0fb] text-[0.625rem] font-semibold text-white">
                      {member.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.avatar_url}
                          alt=""
                          className="size-full rounded-full object-cover"
                        />
                      ) : (
                        memberInitials(member.display_name)
                      )}
                    </span>

                    <p className="min-w-0 flex-1 truncate text-[0.8125rem] text-hub-espresso">
                      {member.display_name}
                      {isSelf ? " (you)" : ""}
                    </p>

                    <div className="relative flex w-[4.75rem] shrink-0 items-center justify-end">
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          disabled={isPending}
                          className="absolute right-full mr-1.5 whitespace-nowrap rounded-[6px] px-1.5 py-0.5 text-[0.6875rem] text-hub-rejected opacity-0 transition-opacity group-hover:opacity-100 hover:bg-hub-rejected/5 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      )}

                      {isSelf ? (
                        <span className="w-full pr-3 text-right text-[0.8125rem] text-hub-espresso/45">
                          {roleDisplay(member.role)}
                        </span>
                      ) : (
                        <HubSelect
                          value={member.role}
                          onChange={(nextRole) =>
                            requestMemberRoleChange(
                              member.id,
                              member.display_name,
                              member.role,
                              nextRole,
                            )
                          }
                          options={ROLE_OPTIONS}
                          disabled={isPending}
                          aria-label={`Role for ${member.display_name}`}
                          variant="inline"
                          formatLabel={(label) => label.toLowerCase()}
                          className="w-full justify-end"
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </HubDialog>
  );
}
