import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco, OnMount } from '@monaco-editor/react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { configureMonacoLanguage } from './monacoConfig';

export const MonacoEditor: React.FC = () => {
  const code = useWorkspaceStore((state) => state.code);
  const setCode = useWorkspaceStore((state) => state.setCode);
  const diagnostics = useWorkspaceStore((state) => state.diagnostics);
  const selectedNodeId = useWorkspaceStore((state) => state.selectedNodeId);
  const ast = useWorkspaceStore((state) => state.ast);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // Configure custom Monaco language properties on load
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register custom completions and hover cards
    configureMonacoLanguage(monaco);

    // Apply initial decorations/markers
    updateMarkers();
    updateSelectionDecoration();
  };

  // Sync Diagnostics to Editor Markers (Squiggles)
  const updateMarkers = () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const markers = diagnostics.map((d) => {
      // Clean safety checks for bounds
      const lineCount = model.getLineCount();
      const line = Math.max(1, Math.min(d.line, lineCount));
      const maxCol = model.getLineMaxColumn(line);
      const startCol = Math.max(1, Math.min(d.column, maxCol));
      
      return {
        startLineNumber: line,
        startColumn: startCol,
        endLineNumber: line,
        endColumn: maxCol,
        message: d.message,
        severity: d.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
      };
    });

    monaco.editor.setModelMarkers(model, 'compose-validator', markers);
  };

  // Decorate and highlight line in Monaco when a node is selected in workspace
  const updateSelectionDecoration = () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !ast) return;

    // Find the selected node in the AST
    let targetRange: any = null;
    
    const findNodeRange = (node: any) => {
      if (node.id === selectedNodeId) {
        targetRange = node.range;
        return;
      }
      if (node.body && Array.isArray(node.body)) {
        for (const child of node.body) {
          findNodeRange(child);
          if (targetRange) return;
        }
      }
      if (node.thenBody && Array.isArray(node.thenBody)) {
        for (const child of node.thenBody) {
          findNodeRange(child);
          if (targetRange) return;
        }
      }
      if (node.elseBody && Array.isArray(node.elseBody)) {
        for (const child of node.elseBody) {
          findNodeRange(child);
          if (targetRange) return;
        }
      }
    };

    findNodeRange(ast);

    if (targetRange) {
      const range = new monaco.Range(
        targetRange.start.line,
        targetRange.start.column,
        targetRange.end.line,
        targetRange.end.column || 100
      );

      // Scroll cursor to visible position
      editor.revealRangeInCenterIfOutsideViewport(range);

      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range,
          options: {
            isWholeLine: true,
            className: 'bg-blue-500/10 border-l-4 border-blue-500',
            glyphMarginClassName: 'bg-blue-500',
          },
        },
      ]);
    } else {
      // Clear decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  };

  useEffect(() => {
    updateMarkers();
  }, [diagnostics]);

  useEffect(() => {
    updateSelectionDecoration();
  }, [selectedNodeId, ast]);

  return (
    <div className="w-full h-full relative border border-slate-800 bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="kotlin"
        theme="vs-dark"
        value={code}
        onChange={(val) => setCode(val || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          folding: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
        }}
      />
    </div>
  );
};
