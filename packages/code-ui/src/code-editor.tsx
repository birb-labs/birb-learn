'use client';

import { useEffect, useRef } from 'react';
import { Annotation, Compartment, EditorState, Transaction } from '@codemirror/state';
import { EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput } from '@codemirror/language';
// Type-only deep import: the content-schema barrel would pull Drizzle into browser bundles.
import type { Language } from '@birb-learn/content-schema/src/code-languages';
import { editorLanguageExtension } from './editor-languages';
import { editorTheme } from './editor-theme';
import styles from './code-editor.module.css';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  readOnly?: boolean;
  /** Accessible name of the editing area; the caller supplies the translated text. */
  ariaLabel: string;
  /** The editor is at least this many lines tall. */
  minLines?: number;
}

// Marks the document replacements that come from the `value` prop, so they are
// not reported back through `onChange`.
const FromProps = Annotation.define<boolean>();

const languageSlot = new Compartment();
const readOnlySlot = new Compartment();
const labelSlot = new Compartment();

// Only `readOnly`, never `editable: false`: a read-only editor must stay focusable and selectable (copying, screen readers).
function readOnlyExtension(readOnly: boolean) {
  return EditorState.readOnly.of(readOnly);
}

/** CodeMirror stores line breaks as `\n`, so compare and insert values in that form. */
function normalizeLineBreaks(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

function labelExtension(ariaLabel: string) {
  return EditorView.contentAttributes.of({ 'aria-label': ariaLabel, 'aria-multiline': 'true' });
}

export function CodeEditor({ value, onChange, language, readOnly = false, ariaLabel, minLines = 6 }: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  // The view is created once; it reads the latest callback and initial props from these refs.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialRef = useRef({ value, readOnly, ariaLabel, minLines });

  useEffect(() => {
    const initial = initialRef.current;
    const view = new EditorView({
      parent: hostRef.current ?? undefined,
      state: EditorState.create({
        doc: initial.value,
        extensions: [
          lineNumbers(),
          highlightActiveLine(),
          highlightActiveLineGutter(),
          drawSelection(),
          history(),
          bracketMatching(),
          indentOnInput(),
          // Tab indents; Escape then Tab leaves the editor (CodeMirror's tab-focus mode), so keyboard users are never trapped.
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          editorTheme(initial.minLines),
          languageSlot.of([]),
          readOnlySlot.of(readOnlyExtension(initial.readOnly)),
          labelSlot.of(labelExtension(initial.ariaLabel)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && !update.transactions.some((tr) => tr.annotation(FromProps))) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    const text = normalizeLineBreaks(value);
    if (view && view.state.doc.toString() !== text) {
      // An external replacement is not the student's edit: keep it out of the undo history.
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: text },
        annotations: [FromProps.of(true), Transaction.addToHistory.of(false)],
      });
    }
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({ effects: readOnlySlot.reconfigure(readOnlyExtension(readOnly)) });
  }, [readOnly]);

  useEffect(() => {
    viewRef.current?.dispatch({ effects: labelSlot.reconfigure(labelExtension(ariaLabel)) });
  }, [ariaLabel]);

  useEffect(() => {
    let cancelled = false;
    editorLanguageExtension(language).then(
      (extension) => {
        // Reconfiguring a compartment keeps the view (and the student's cursor and history) in place.
        if (!cancelled) viewRef.current?.dispatch({ effects: languageSlot.reconfigure(extension) });
      },
      () => {
        // Without a grammar the code is still editable, just not coloured: drop the previous language's.
        if (!cancelled) viewRef.current?.dispatch({ effects: languageSlot.reconfigure([]) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [language]);

  return <div ref={hostRef} className={styles.editor} />;
}
