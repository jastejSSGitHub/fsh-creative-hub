"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { UrlLinkTag } from "@/components/documents/block-editor/url-link-tag";
import {
  isUrlOnlyText,
  resolveDisplayUrl,
  splitTextByUrls,
  textContainsUrl,
} from "@/lib/documents/url-display";
import { cn } from "@/lib/utils";

type UrlAwareFieldProps = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  multiline?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onInputRef?: (el: HTMLTextAreaElement | HTMLInputElement | null) => void;
  renderPlain?: (value: string) => ReactNode;
  forceEditing?: boolean;
  activated?: boolean;
  onBlurField?: () => void;
  truncate?: boolean;
  title?: string;
};

function UrlAwareDisplay({
  value,
  onEdit,
  className,
  truncate = false,
  title,
}: {
  value: string;
  onEdit: () => void;
  className?: string;
  truncate?: boolean;
  title?: string;
}) {
  const truncateClass = truncate ? "min-w-0 truncate whitespace-nowrap" : "break-words whitespace-pre-wrap";
  if (isUrlOnlyText(value)) {
    return (
      <div
        role="button"
        tabIndex={0}
        onDoubleClick={onEdit}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onEdit();
          }
        }}
        title={title ?? (truncate ? value.trim() : "Double-click to edit")}
        className={cn("max-w-full cursor-text", truncate ? "block min-w-0" : "inline-flex", className)}
      >
        <UrlLinkTag
          url={resolveDisplayUrl(value)!}
          className={truncate ? "max-w-full" : undefined}
        />
      </div>
    );
  }

  if (textContainsUrl(value)) {
    const segments = splitTextByUrls(value);
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onEdit}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onEdit();
          }
        }}
        title={title ?? (truncate ? value : undefined)}
        className={cn("w-full min-w-0 cursor-text text-left", truncateClass, className)}
      >
        {truncate ? (
          <span className="block truncate">{value}</span>
        ) : (
          segments.map((segment, index) =>
            segment.type === "url" ? (
              <UrlLinkTag
                key={`${segment.href}-${index}`}
                url={segment.href}
                className="mx-0.5 align-middle"
                onClick={(event) => event.stopPropagation()}
              />
            ) : (
              <span key={`text-${index}`}>{segment.value}</span>
            ),
          )
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit();
        }
      }}
      title={title ?? (truncate && value ? value : undefined)}
      className={cn("w-full min-w-0 cursor-text text-left", truncateClass, className)}
    >
      {value || "\u00a0"}
    </div>
  );
}

export function UrlAwareField({
  value,
  onChange,
  readOnly = false,
  placeholder,
  className,
  inputClassName,
  multiline = false,
  onKeyDown,
  onInputRef,
  renderPlain,
  forceEditing = false,
  activated = false,
  onBlurField,
  truncate = false,
  title,
}: UrlAwareFieldProps) {
  const [editing, setEditing] = useState(false);
  const [placeholderVisible, setPlaceholderVisible] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const isEditing = forceEditing || activated || editing;

  const setRef = useCallback(
    (el: HTMLTextAreaElement | HTMLInputElement | null) => {
      inputRef.current = el;
      onInputRef?.(el);
    },
    [onInputRef],
  );

  const startEditing = useCallback(
    (showPlaceholder = false) => {
      if (readOnly) return;
      setEditing(true);
      if (showPlaceholder) setPlaceholderVisible(true);
    },
    [readOnly],
  );

  useEffect(() => {
    if (forceEditing || activated) {
      setEditing(true);
      setPlaceholderVisible(true);
    }
  }, [activated, forceEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const el = inputRef.current;
    if (!el) return;
    if (document.activeElement !== el) {
      el.focus();
      if ("setSelectionRange" in el) {
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
    if (el instanceof HTMLTextAreaElement) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [isEditing, activated, forceEditing]);

  if (readOnly) {
    if (renderPlain) return <>{renderPlain(value)}</>;
    if (isUrlOnlyText(value)) {
      return (
        <UrlLinkTag
          url={resolveDisplayUrl(value)!}
          className={truncate ? "max-w-full" : undefined}
          title={title ?? value.trim()}
        />
      );
    }
    if (textContainsUrl(value)) {
      const segments = splitTextByUrls(value);
      return (
        <span
          title={title ?? (truncate ? value : undefined)}
          className={cn(truncate ? "block min-w-0 truncate whitespace-nowrap" : "break-words whitespace-pre-wrap", className)}
        >
          {segments.map((segment, index) =>
            segment.type === "url" ? (
              <UrlLinkTag
                key={`${segment.href}-${index}`}
                url={segment.href}
                className="mx-0.5 align-middle"
              />
            ) : (
              <span key={`text-${index}`}>{segment.value}</span>
            ),
          )}
        </span>
      );
    }
    return (
      <span
        title={title ?? (truncate ? value : undefined)}
        className={cn(truncate ? "block min-w-0 truncate whitespace-nowrap" : "break-words whitespace-pre-wrap", className)}
      >
        {value}
      </span>
    );
  }

  const hasUrl = isUrlOnlyText(value) || textContainsUrl(value);
  const showUrlDisplay =
    !isEditing &&
    value.trim() &&
    !value.startsWith("/") &&
    !forceEditing &&
    (hasUrl || truncate);

  if (showUrlDisplay) {
    return (
      <UrlAwareDisplay
        value={value}
        onEdit={() => startEditing(false)}
        className={className}
        truncate={truncate}
        title={title}
      />
    );
  }

  if (!value.trim() && !isEditing && !readOnly) {
    return (
      <div
        role="textbox"
        tabIndex={0}
        aria-label={placeholder ?? "Empty line"}
        onMouseDown={(event) => {
          event.preventDefault();
          startEditing(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            startEditing(true);
          }
        }}
        className={cn("min-h-[1.625rem] w-full cursor-text", inputClassName, className)}
      />
    );
  }

  const sharedProps = {
    ref: setRef as never,
    value,
    placeholder: placeholderVisible || forceEditing || activated ? placeholder : undefined,
    onChange: (
      event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    ) => {
      onChange(event.target.value);
      if (event.target instanceof HTMLTextAreaElement) {
        event.target.style.height = "auto";
        event.target.style.height = `${event.target.scrollHeight}px`;
      }
    },
    onBlur: () => {
      if (!forceEditing && !activated) setEditing(false);
      if (!value.trim()) setPlaceholderVisible(false);
      onBlurField?.();
    },
    onKeyDown,
    className: cn(
      "w-full bg-transparent outline-none placeholder:text-hub-foreground/35",
      inputClassName,
    ),
  };

  if (multiline) {
    return (
      <textarea
        {...sharedProps}
        rows={1}
        onFocus={() => setEditing(true)}
      />
    );
  }

  return (
    <input
      {...sharedProps}
      type="text"
      onFocus={() => setEditing(true)}
    />
  );
}
