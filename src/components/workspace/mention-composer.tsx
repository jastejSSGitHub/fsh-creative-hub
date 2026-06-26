"use client";

import { useRef, useState } from "react";

import {
  filterMembersForMention,
  getMentionRangeAtCursor,
} from "@/lib/mentions/utils";
import type { HubProfile } from "@/types/database";
import { cn } from "@/lib/utils";

type MentionComposerProps = {
  value: string;
  onChange: (value: string) => void;
  members: HubProfile[];
  currentUserId?: string;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

export function MentionComposer({
  value,
  onChange,
  members,
  currentUserId,
  rows = 3,
  placeholder,
  disabled,
  className,
  onKeyDown,
}: MentionComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionRange, setMentionRange] = useState<ReturnType<
    typeof getMentionRangeAtCursor
  > | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const suggestions = mentionRange
    ? filterMembersForMention(members, mentionRange.query, currentUserId)
    : [];

  function syncMentionState(nextValue: string, cursor: number) {
    setMentionRange(getMentionRangeAtCursor(nextValue, cursor));
    setHighlightIndex(0);
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value;
    const cursor = event.target.selectionStart ?? nextValue.length;
    onChange(nextValue);
    syncMentionState(nextValue, cursor);
  }

  function insertMention(member: HubProfile) {
    if (!mentionRange) return;

    const insert = `@${member.display_name} `;
    const nextValue =
      value.slice(0, mentionRange.start) + insert + value.slice(mentionRange.end);

    onChange(nextValue);
    setMentionRange(null);
    setHighlightIndex(0);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const cursor = mentionRange.start + insert.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionRange && suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightIndex((index) => (index + 1) % suggestions.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightIndex(
          (index) => (index - 1 + suggestions.length) % suggestions.length,
        );
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        insertMention(suggestions[highlightIndex]);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setMentionRange(null);
        return;
      }
    }

    onKeyDown?.(event);
  }

  return (
    <div className="relative">
      {mentionRange && suggestions.length > 0 && (
        <ul
          className="absolute bottom-full left-0 z-10 mb-1.5 w-full overflow-hidden rounded-md border border-hub-espresso/10 bg-white shadow-sm"
          role="listbox"
        >
          {suggestions.map((member, index) => (
            <li key={member.id} role="option" aria-selected={index === highlightIndex}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertMention(member);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors",
                  index === highlightIndex
                    ? "bg-hub-espresso/5"
                    : "hover:bg-hub-espresso/[0.03]",
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-hub-espresso/8 font-mono text-[0.55rem] font-semibold text-hub-espresso">
                  {member.display_name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-hub-espresso">
                    {member.display_name}
                  </span>
                  <span className="block truncate font-mono text-[0.58rem] text-hub-espresso/40">
                    {member.email}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          const cursor = event.currentTarget.selectionStart ?? value.length;
          syncMentionState(value, cursor);
        }}
        onKeyUp={(event) => {
          const cursor = event.currentTarget.selectionStart ?? value.length;
          syncMentionState(value, cursor);
        }}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full resize-none rounded-md border border-hub-espresso/12 bg-white px-3 py-2 text-xs text-hub-espresso outline-none placeholder:text-hub-espresso/35 focus:border-hub-espresso/25 focus:ring-1 focus:ring-hub-espresso/10 disabled:opacity-60",
          className,
        )}
      />
    </div>
  );
}
