import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

// Colours come only from the `--code-*` / `--color-*` custom properties, so the
// editor follows the active theme and mode without being rebuilt.

/** The editor chrome; `minLines` keeps short snippets from collapsing to one line. */
export function editorThemeSpec(minLines: number) {
  return {
    '&': {
      backgroundColor: 'var(--code-background)',
      color: 'var(--code-foreground)',
      border: '1px solid var(--color-surface-border)',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--font-size-sm)',
    },
    '&.cm-focused': { outline: '2px solid var(--color-accent)', outlineOffset: '1px' },
    '.cm-scroller': {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      lineHeight: 'var(--line-height-sm)',
    },
    '.cm-content': { caretColor: 'var(--code-foreground)', minHeight: `calc(${minLines} * var(--line-height-sm) * 1em)` },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--code-foreground)' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'var(--code-selection)',
    },
    '.cm-activeLine': { backgroundColor: 'var(--code-line-highlight)' },
    '.cm-gutters': {
      backgroundColor: 'var(--code-background)',
      color: 'var(--code-line-number)',
      border: 'none',
    },
    '.cm-activeLineGutter': { backgroundColor: 'var(--code-line-highlight)' },
    '&.cm-focused .cm-matchingBracket': { backgroundColor: 'var(--code-selection)', outline: '1px solid var(--code-line-number)' },
    '&.cm-focused .cm-nonmatchingBracket': { color: 'var(--color-danger)' },
  };
}

export const editorHighlightSpec = [
  { tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: 'var(--code-token-comment)', fontStyle: 'italic' },
  { tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.controlKeyword, tags.definitionKeyword, tags.moduleKeyword], color: 'var(--code-token-keyword)' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: 'var(--code-token-string)' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom, tags.constant(tags.name), tags.standard(tags.name)], color: 'var(--code-token-constant)' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName), tags.className, tags.typeName, tags.definition(tags.function(tags.variableName))], color: 'var(--code-token-function)' },
  { tag: [tags.definition(tags.variableName), tags.propertyName, tags.attributeName], color: 'var(--code-token-parameter)' },
  { tag: [tags.punctuation, tags.separator, tags.bracket, tags.operator], color: 'var(--code-token-punctuation)' },
  { tag: [tags.link, tags.url], color: 'var(--code-token-link)', textDecoration: 'underline' },
  { tag: tags.inserted, color: 'var(--code-token-inserted)' },
  { tag: tags.deleted, color: 'var(--code-token-deleted)' },
  { tag: tags.changed, color: 'var(--code-token-changed)' },
  { tag: tags.invalid, color: 'var(--color-danger)' },
];

export function editorTheme(minLines: number): Extension {
  return [EditorView.theme(editorThemeSpec(minLines)), syntaxHighlighting(HighlightStyle.define(editorHighlightSpec))];
}
