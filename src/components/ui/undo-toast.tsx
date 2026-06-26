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
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-4 rounded-lg border border-hub-espresso/10 bg-hub-espresso px-4 py-3 text-sm text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200"
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
