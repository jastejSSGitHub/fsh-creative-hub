"use client";

type UndoToastProps = {
  message: string;
  visible: boolean;
  onUndo: () => void;
};

export function UndoToast({ message, visible, onUndo }: UndoToastProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[60] flex max-w-[calc(100vw-2rem)] items-center justify-between gap-4 rounded-lg border border-hub-foreground/10 bg-hub-espresso px-4 py-3 text-sm text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 sm:inset-x-auto sm:right-6 sm:max-w-none"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="font-medium text-hub-butter underline-offset-2 transition-colors hover:text-white hover:underline"
      >
        Undo
      </button>
    </div>
  );
}
