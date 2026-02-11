import { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import type { EditorConfig } from '../types';

/**
 * Props for the MarkdownEditor component.
 */
interface MarkdownEditorProps {
  /** Current markdown text content */
  value: string;
  /** Callback fired when markdown content changes */
  onChange: (value: string) => void;
  /** Optional editor configuration */
  config?: EditorConfig;
}

/**
 * CodeMirror-based Markdown editor component with syntax highlighting.
 *
 * Features:
 * - Markdown syntax highlighting with code block support
 * - Line numbers and active line highlighting
 * - Undo/redo history
 * - Line wrapping (configurable)
 *
 * @example
 * ```tsx
 * const [markdown, setMarkdown] = useState('# Hello');
 *
 * <MarkdownEditor
 *   value={markdown}
 *   onChange={setMarkdown}
 *   config={{ lineNumbers: true, lineWrapping: true }}
 * />
 * ```
 */
export function MarkdownEditor({
  value,
  onChange,
  config = {},
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isExternalUpdate = useRef(false);

  const { lineNumbers: showLineNumbers = true, lineWrapping = true } = config;

  // Memoize the onChange handler to avoid recreating the editor
  const handleChange = useCallback(
    (newValue: string) => {
      if (!isExternalUpdate.current) {
        onChange(newValue);
      }
    },
    [onChange],
  );

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown({ codeLanguages: languages }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          handleChange(newValue);
        }
      }),
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily:
            "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
        },
        '.cm-content': {
          padding: '16px',
        },
        '.cm-line': {
          padding: '0 4px',
        },
        '&.cm-focused': {
          outline: 'none',
        },
      }),
    ];

    if (showLineNumbers) {
      extensions.push(lineNumbers());
    }

    if (lineWrapping) {
      extensions.push(EditorView.lineWrapping);
    }

    extensions.push(highlightActiveLine());

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update editor content when value prop changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      isExternalUpdate.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
      isExternalUpdate.current = false;
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className="markdown-editor"
      style={{
        height: '100%',
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    />
  );
}
