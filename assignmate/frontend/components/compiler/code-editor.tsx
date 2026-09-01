"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import type { editor as MonacoEditorType } from "monaco-editor";
import {
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronDown,
  FileCode2,
  ZoomIn,
  ZoomOut,
  MapPin,
  Braces,
  Keyboard,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically load Monaco to ensure clean hydration in Next.js
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 text-muted-foreground gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-slate-400">
          Initializing VS Code Monaco Engine...
        </span>
      </div>
    ),
  }
);

export type SupportedLanguage = "python" | "c" | "cpp" | "java" | "javascript";

export interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: SupportedLanguage;
  onLanguageChange?: (language: SupportedLanguage) => void;
  onReset?: () => void;
  isLocked?: boolean;
  isTestMode?: boolean;
  preventCopyPaste?: (e: any) => void;
  className?: string;
  height?: string;
  errorLine?: number | null;
  errorMessage?: string | null;
  readOnly?: boolean;
}

export const LANGUAGE_CONFIG: Record<
  SupportedLanguage,
  {
    label: string;
    monacoLang: string;
    fileExtension: string;
    defaultFilename: string;
    tabSize: number;
    color: string;
  }
> = {
  python: {
    label: "Python 3",
    monacoLang: "python",
    fileExtension: ".py",
    defaultFilename: "main.py",
    tabSize: 4,
    color: "#3572A5",
  },
  c: {
    label: "C (GCC)",
    monacoLang: "c",
    fileExtension: ".c",
    defaultFilename: "solution.c",
    tabSize: 4,
    color: "#555555",
  },
  cpp: {
    label: "C++ (G++)",
    monacoLang: "cpp",
    fileExtension: ".cpp",
    defaultFilename: "solution.cpp",
    tabSize: 4,
    color: "#f34b7d",
  },
  java: {
    label: "Java (OpenJDK)",
    monacoLang: "java",
    fileExtension: ".java",
    defaultFilename: "Main.java",
    tabSize: 4,
    color: "#b07219",
  },
  javascript: {
    label: "JavaScript (Node)",
    monacoLang: "javascript",
    fileExtension: ".js",
    defaultFilename: "index.js",
    tabSize: 2,
    color: "#f1e05a",
  },
};

export function CodeEditor({
  code,
  onChange,
  language,
  onLanguageChange,
  onReset,
  isLocked = false,
  isTestMode = false,
  preventCopyPaste,
  className = "",
  height = "100%",
  errorLine = null,
  errorMessage = null,
  readOnly = false,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<any>(null);

  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [showMinimap, setShowMinimap] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [selectedCount, setSelectedCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLangConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.python;

  // Define VS Code Dark & Light themes with rich token colors
  const defineMonacoThemes = (monaco: any) => {
    // VS Code Dark+ Custom Theme
    monaco.editor.defineTheme("vscode-dark-plus", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "d4d4d4", background: "18181b" },
        { token: "comment", foreground: "6a9955", fontStyle: "italic" },
        { token: "keyword", foreground: "569cd6", fontStyle: "bold" },
        { token: "keyword.control", foreground: "c586c0", fontStyle: "bold" },
        { token: "keyword.operator", foreground: "d4d4d4" },
        { token: "operator", foreground: "d4d4d4" },
        { token: "string", foreground: "ce9178" },
        { token: "string.escape", foreground: "d7ba7d" },
        { token: "number", foreground: "b5cea8" },
        { token: "number.hex", foreground: "b5cea8" },
        { token: "regexp", foreground: "d16969" },
        { token: "type", foreground: "4ec9b0" },
        { token: "class", foreground: "4ec9b0", fontStyle: "bold" },
        { token: "function", foreground: "dcdcaa" },
        { token: "variable", foreground: "9cdcfe" },
        { token: "variable.parameter", foreground: "9cdcfe" },
        { token: "variable.predefined", foreground: "4ec9b0" },
        { token: "constant", foreground: "4fc1ff" },
        { token: "tag", foreground: "569cd6" },
        { token: "attribute.name", foreground: "9cdcfe" },
        { token: "attribute.value", foreground: "ce9178" },
        { token: "delimiter", foreground: "d4d4d4" },
        { token: "delimiter.bracket", foreground: "ffd700" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#c6c6c6",
        "editor.lineHighlightBackground": "#282828",
        "editor.lineHighlightBorder": "#28282800",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
        "editorCursor.foreground": "#aeafad",
        "editorWhitespace.foreground": "#3b3a32",
        "editorIndentGuide.background": "#404040",
        "editorIndentGuide.activeBackground": "#707070",
        "editorBracketMatch.background": "#0064001a",
        "editorBracketMatch.border": "#888888",
        "editorBracketHighlight.foreground1": "#ffd700",
        "editorBracketHighlight.foreground2": "#da70d6",
        "editorBracketHighlight.foreground3": "#179fff",
        "editorBracketHighlight.unexpectedBracket.foreground": "#ff1212",
        "editorOverviewRuler.border": "#1e1e1e",
        "editorGutter.background": "#1e1e1e",
        "editorWidget.background": "#252526",
        "editorWidget.border": "#454545",
        "editorSuggestWidget.background": "#252526",
        "editorSuggestWidget.border": "#454545",
        "editorSuggestWidget.selectedBackground": "#04395e",
      },
    });

    // VS Code Light+ Custom Theme
    monaco.editor.defineTheme("vscode-light-plus", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "", foreground: "000000", background: "ffffff" },
        { token: "comment", foreground: "008000", fontStyle: "italic" },
        { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
        { token: "keyword.control", foreground: "af00db", fontStyle: "bold" },
        { token: "string", foreground: "a31515" },
        { token: "number", foreground: "098658" },
        { token: "type", foreground: "267f99" },
        { token: "class", foreground: "267f99", fontStyle: "bold" },
        { token: "function", foreground: "795e26" },
        { token: "variable", foreground: "001080" },
        { token: "operator", foreground: "000000" },
        { token: "delimiter", foreground: "000000" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#000000",
        "editorLineNumber.foreground": "#237893",
        "editorLineNumber.activeForeground": "#0b216f",
        "editor.lineHighlightBackground": "#f3f3f3",
        "editor.selectionBackground": "#add6ff",
        "editorCursor.foreground": "#000000",
        "editorBracketMatch.background": "#e2e8f0",
        "editorBracketMatch.border": "#3b82f6",
        "editorBracketHighlight.foreground1": "#b45309",
        "editorBracketHighlight.foreground2": "#be185d",
        "editorBracketHighlight.foreground3": "#0369a1",
        "editorGutter.background": "#ffffff",
      },
    });
  };

  const handleEditorDidMount = (
    editor: MonacoEditorType.IStandaloneCodeEditor,
    monaco: any
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    defineMonacoThemes(monaco);

    // Apply active theme based on current theme state
    const themeName =
      resolvedTheme === "light" ? "vscode-light-plus" : "vscode-dark-plus";
    monaco.editor.setTheme(themeName);

    // Track cursor position & selection for status bar
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });

    editor.onDidChangeCursorSelection((e) => {
      const model = editor.getModel();
      if (model) {
        const selectedText = model.getValueInRange(e.selection);
        setSelectedCount(selectedText.length);
      }
    });

    // Proctoring & Anti-Cheat: Intercept copy, cut, paste if test mode is active
    if (isTestMode && preventCopyPaste) {
      editor.onKeyDown((e) => {
        if (
          (e.ctrlKey || e.metaKey) &&
          ["c", "v", "x"].includes(e.browserEvent.key.toLowerCase())
        ) {
          e.preventDefault();
          e.stopPropagation();
          preventCopyPaste({ preventDefault: () => {} });
        }
      });
    }

    // Configure language-specific model features
    editor.updateOptions({
      tabSize: currentLangConfig.tabSize,
    });
  };

  // Sync theme changes with NextThemes
  useEffect(() => {
    if (monacoRef.current) {
      const themeName =
        resolvedTheme === "light" ? "vscode-light-plus" : "vscode-dark-plus";
      monacoRef.current.editor.setTheme(themeName);
    }
  }, [resolvedTheme]);

  // Sync language changes with Monaco Model
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(
          model,
          currentLangConfig.monacoLang
        );
        editorRef.current.updateOptions({
          tabSize: currentLangConfig.tabSize,
        });
      }
    }
  }, [language, currentLangConfig]);

  // Highlight error line if compilation returned error diagnostics
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();

    if (!model) return;

    if (errorLine && errorLine > 0) {
      const markers = [
        {
          startLineNumber: errorLine,
          startColumn: 1,
          endLineNumber: errorLine,
          endColumn: model.getLineMaxColumn(errorLine),
          message: errorMessage || "Syntax or Runtime Error at this line",
          severity: monaco.MarkerSeverity.Error,
        },
      ];
      monaco.editor.setModelMarkers(model, "compiler-diagnostics", markers);
    } else {
      monaco.editor.setModelMarkers(model, "compiler-diagnostics", []);
    }
  }, [errorLine, errorMessage]);

  // Format document action (Shift+Alt+F)
  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (isTestMode && preventCopyPaste) {
      preventCopyPaste({ preventDefault: () => {} });
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // Toggle fullscreen mode
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col border border-border/60 rounded-xl overflow-hidden bg-card shadow-lg ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none h-screen w-screen"
          : ""
      } ${className}`}
      style={{ height: isFullscreen ? "100vh" : height }}
    >
      {/* VS Code Header & Action Bar */}
      <div className="bg-slate-900/95 dark:bg-[#0b0f19] border-b border-border/40 px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none">
        {/* Left Side: Active File Tab & Language Selector */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-border/60 rounded-lg text-xs font-mono text-foreground shadow-inner">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: currentLangConfig.color }}
            />
            <FileCode2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-medium text-slate-200">
              {currentLangConfig.defaultFilename}
            </span>
            <span className="text-[10px] text-muted-foreground/80 px-1 py-0.2 bg-muted/40 rounded uppercase font-semibold">
              {language}
            </span>
          </div>

          {/* Quick Language Selector (if onLanguageChange provided) */}
          {onLanguageChange && !isLocked && (
            <div className="relative inline-block">
              <select
                value={language}
                onChange={(e) =>
                  onLanguageChange(e.target.value as SupportedLanguage)
                }
                className="bg-muted/50 hover:bg-muted/80 text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border/50 focus:outline-none cursor-pointer appearance-none pr-7 transition-colors"
              >
                <option value="python">Python 3</option>
                <option value="c">C (GCC)</option>
                <option value="cpp">C++ (G++)</option>
                <option value="java">Java (OpenJDK)</option>
                <option value="javascript">JavaScript (Node)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Right Side: IDE Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Format Document Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFormatCode}
            disabled={isLocked || readOnly}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60"
            title="Format Document (Shift+Alt+F)"
          >
            <Braces className="w-3.5 h-3.5 mr-1 text-primary" />
            <span className="hidden md:inline">Format</span>
          </Button>

          {/* Font Size Adjusters */}
          <div className="flex items-center border border-border/40 rounded-md bg-muted/30 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize((prev) => Math.max(10, prev - 1))}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="Decrease Font Size"
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-[11px] font-mono font-medium px-1 text-muted-foreground min-w-[20px] text-center">
              {fontSize}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFontSize((prev) => Math.min(24, prev + 1))}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="Increase Font Size"
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>

          {/* Toggle Minimap */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMinimap((prev) => !prev)}
            className={`h-7 px-2 text-xs transition-colors ${
              showMinimap
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
            title="Toggle Minimap"
          >
            <MapPin className="w-3.5 h-3.5 mr-1" />
            <span className="hidden lg:inline">Minimap</span>
          </Button>

          {/* Copy Code */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60"
            title="Copy Code to Clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                <span className="text-emerald-400 text-xs hidden sm:inline">
                  Copied
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </Button>

          {/* Reset Template */}
          {onReset && !isLocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60"
              title="Reset to starter template"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-400" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}

          {/* Keyboard Shortcuts Dialog Trigger */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcutsModal(true)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60"
            title="VS Code Keybindings & Features"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFullscreen}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor Body Area */}
      <div className="flex-1 relative w-full h-full min-h-[360px] overflow-hidden bg-[#0f172a] dark:bg-[#0b0f19]">
        {isLocked && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-40">
            <div className="w-12 h-12 rounded-full bg-destructive/20 border border-destructive/40 flex items-center justify-center mb-3">
              <Terminal className="w-6 h-6 text-destructive animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Editor Locked</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Proctoring limits exceeded. Please unlock or submit your test work.
            </p>
          </div>
        )}

        <MonacoEditor
          height="100%"
          language={currentLangConfig.monacoLang}
          value={code}
          theme={
            resolvedTheme === "light" ? "vscode-light-plus" : "vscode-dark-plus"
          }
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          options={{
            readOnly: isLocked || readOnly,
            fontSize,
            fontFamily:
              "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, Menlo, monospace",
            fontLigatures: true,
            tabSize: currentLangConfig.tabSize,
            insertSpaces: true,
            detectIndentation: true,
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            glyphMargin: true,
            folding: true,
            foldingHighlight: true,
            showFoldingControls: "always",
            renderLineHighlight: "all",
            renderLineHighlightOnlyWhenFocus: false,
            // Smart Auto-Pairing, Auto-Closing & Auto-Indent
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            autoClosingOvertype: "always",
            autoClosingDelete: "always",
            autoSurround: "languageDefined",
            autoIndent: "full",
            formatOnType: true,
            formatOnPaste: true,
            // Bracket Pairing & Rainbow Colorization
            bracketPairColorization: {
              enabled: true,
              independentColorPoolPerBracketType: true,
            },
            guides: {
              bracketPairs: true,
              bracketPairsHorizontal: true,
              highlightActiveBracketPair: true,
              indentation: true,
            },
            matchBrackets: "always",
            // Smooth Caret & Multi-Cursor
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            cursorStyle: "line",
            cursorWidth: 2,
            smoothScrolling: true,
            mouseWheelZoom: true,
            multiCursorModifier: "alt",
            // Autocomplete & IntelliSense
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: "on",
            snippetSuggestions: "inline",
            wordBasedSuggestions: "allDocuments",
            parameterHints: {
              enabled: true,
            },
            // Search & Replace
            find: {
              addExtraSpaceOnTop: false,
              autoFindInSelection: "multiline",
              seedSearchStringFromSelection: "always",
            },
            // Minimap & Layout
            minimap: {
              enabled: showMinimap,
              scale: 1,
              renderCharacters: false,
            },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            padding: {
              top: 12,
              bottom: 12,
            },
            contextmenu: !isTestMode,
          }}
        />
      </div>

      {/* VS Code Inspired Bottom Status Bar */}
      <div className="bg-slate-950 border-t border-border/40 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="text-slate-400">Ln</span> {cursorPos.line},
            <span className="text-slate-400">Col</span> {cursorPos.col}
          </span>
          {selectedCount > 0 && (
            <span className="text-primary font-medium">
              ({selectedCount} selected)
            </span>
          )}
          {errorLine && errorLine > 0 && (
            <span className="text-red-400 font-semibold flex items-center gap-1 animate-pulse">
              ● Error on Line {errorLine}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <span>Spaces: {currentLangConfig.tabSize}</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="text-slate-200 font-semibold">
            {currentLangConfig.label}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-muted/40 text-[10px] uppercase font-bold text-primary">
            {resolvedTheme === "light" ? "VS Code Light" : "VS Code Dark"}
          </span>
        </div>
      </div>

      {/* Shortcuts & Help Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">
                  VS Code Keybindings & Tips
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcutsModal(false)}
                className="h-6 w-6 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-foreground">Search & Replace</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono text-[10px]">
                  Ctrl+F / Ctrl+H
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-foreground">Format Document</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono text-[10px]">
                  Shift+Alt+F
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-foreground">Multi-Cursor Selection</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono text-[10px]">
                  Alt+Click
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-foreground">Toggle Line Comment</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono text-[10px]">
                  Ctrl+/
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-foreground">Move Line Up / Down</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono text-[10px]">
                  Alt+Up / Alt+Down
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-foreground">Duplicate Line</span>
                <kbd className="px-2 py-0.5 bg-muted rounded font-mono text-[10px]">
                  Shift+Alt+Down
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-foreground">Auto-Pairing & Overtyping</span>
                <span className="text-emerald-400 font-semibold">
                  Active (&#123;&#125;, (), [], &quot;&quot;, &apos;&apos;)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-foreground">Bracket Colorization</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground font-semibold mt-4"
              onClick={() => setShowShortcutsModal(false)}
            >
              Got It
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

