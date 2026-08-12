"use client";

import Editor from "@monaco-editor/react";

const MONACO_LANG: Record<string, string> = {
  cpp: "cpp",
  python: "python",
  java: "java",
  rust: "rust",
  go: "go",
  javascript: "javascript",
  kotlin: "kotlin",
};

let isCpDarkThemeDefined = false;

export interface MonacoCodeEditorProps {
  value: string;
  language: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  height?: number;
}

export default function MonacoCodeEditor({
  value,
  language,
  onChange,
  onFocus,
  height = 320,
}: MonacoCodeEditorProps) {
  return (
    <Editor
      value={value}
      language={MONACO_LANG[language] ?? "plaintext"}
      onChange={(v) => onChange(v ?? "")}
      theme="cp-dark"
      height={height}
      beforeMount={(monaco) => {
        if (!isCpDarkThemeDefined) {
          try {
            monaco.editor.defineTheme("cp-dark", {
              base: "vs-dark",
              inherit: true,
              rules: [],
              colors: {
                "editor.background": "#06141B",
                "editorGutter.background": "#06141B",
                "editor.lineHighlightBackground": "#0d1c26",
                "editor.lineHighlightBorder": "#00000000",
                "editorLineNumber.foreground": "#3a4d5c",
                "editorLineNumber.activeForeground": "#9BA8AB",
                "editorCursor.foreground": "#9BA8AB",
                "editor.selectionBackground": "#25374588",
                "editor.inactiveSelectionBackground": "#25374544",
                "editorIndentGuide.background1": "#11212D",
                "editorIndentGuide.activeBackground1": "#253745",
                "editorWidget.background": "#11212D",
                "editorWidget.border": "#253745",
                "editorSuggestWidget.background": "#11212D",
                "editorSuggestWidget.border": "#253745",
                "input.background": "#11212D",
                "scrollbarSlider.background": "#25374566",
                "scrollbarSlider.hoverBackground": "#4A5C6A88",
              },
            });
            isCpDarkThemeDefined = true;
          } catch (err) {
            console.warn("Theme definition skipped:", err);
          }
        }
      }}
      loading={
        <div className="p-3 font-mono text-[11px] text-muted-foreground/40 animate-pulse">
          booting editor…
        </div>
      }
      onMount={(editor, monaco) => {
        try {
          monaco.editor.setTheme("cp-dark");
          if (onFocus) editor.onDidFocusEditorText(onFocus);
        } catch (err) {
          console.warn("Monaco mount warning:", err);
        }
      }}
      options={{
        fontSize: 13,
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
        fontLigatures: false,
        minimap: { enabled: false },
        lineNumbers: "on",
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: "off",
        bracketPairColorization: { enabled: true },
        matchBrackets: "always",
        autoClosingBrackets: "always",
        formatOnPaste: true,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        renderLineHighlight: "all",
        renderWhitespace: "selection",
        padding: { top: 10, bottom: 10 },
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        fixedOverflowWidgets: true,
      }}
    />
  );
}
