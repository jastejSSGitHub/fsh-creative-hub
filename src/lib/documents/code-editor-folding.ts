import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

/** Fold nested blocks in overlay; keep imports and top-level structure visible. */
export function applySmartCodeFolding(
  editorInstance: editor.IStandaloneCodeEditor,
  monaco: Monaco,
) {
  const model = editorInstance.getModel();
  if (!model || model.getLineCount() < 6) return;

  window.setTimeout(() => {
    const lineCount = model.getLineCount();

    // Fold function bodies and nested scopes (level 3+), leave module structure open.
    editorInstance.getAction("editor.foldLevel3")?.run();

    // Reveal imports, exports, and opening declarations at the top.
    const unfoldThrough = Math.min(24, lineCount);
    for (let line = 1; line <= unfoldThrough; line += 1) {
      editorInstance.setPosition({ lineNumber: line, column: 1 });
      editorInstance.getAction("editor.unfold")?.run();
    }

    editorInstance.setScrollTop(0);
    editorInstance.setPosition({ lineNumber: 1, column: 1 });
    editorInstance.revealLineInCenter(1);

    // If the file is mostly one large block, fold one level deeper for readability.
    if (lineCount > 80) {
      editorInstance.getAction("editor.foldLevel4")?.run();
      for (let line = 1; line <= Math.min(12, lineCount); line += 1) {
        editorInstance.setPosition({ lineNumber: line, column: 1 });
        editorInstance.getAction("editor.unfold")?.run();
      }
      editorInstance.setScrollTop(0);
      editorInstance.setPosition({ lineNumber: 1, column: 1 });
    }

    monaco.editor.setModelMarkers(model, "smart-fold", []);
  }, 120);
}
