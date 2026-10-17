import { render, waitFor } from '@testing-library/react';
import { language as languageFacet } from '@codemirror/language';
import { indentMore } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import { describe, expect, it, vi } from 'vitest';
import { LANGUAGES } from '@birb-learn/content-schema/src/code-languages';
import { CodeEditor } from './code-editor';
import { editorLanguageExtension } from './editor-languages';
import { editorHighlightSpec, editorThemeSpec } from './editor-theme';

function viewOf(container: HTMLElement): EditorView {
  const dom = container.querySelector<HTMLElement>('.cm-editor');
  const view = dom && EditorView.findFromDOM(dom);
  if (!view) throw new Error('editor not mounted');
  return view;
}

describe('CodeEditor', () => {
  it('mounts the document and gives the editor its accessible name', () => {
    const { container } = render(<CodeEditor value="print(1)" onChange={() => {}} language="python" ariaLabel="Code" />);
    expect(viewOf(container).state.doc.toString()).toBe('print(1)');
    expect(container.querySelector('.cm-content')?.getAttribute('aria-label')).toBe('Code');
    expect(container.querySelector('.cm-lineNumbers')).not.toBeNull();
  });

  it('reports typed text through onChange', async () => {
    const onChange = vi.fn();
    const { container } = render(<CodeEditor value="ab" onChange={onChange} language="python" ariaLabel="Code" />);
    // Type the way the browser does: edit the contenteditable DOM and let CodeMirror read the mutation back.
    const content = container.querySelector<HTMLElement>('.cm-content')!;
    content.focus();
    const text = content.querySelector('.cm-line')!.firstChild as Text;
    text.data = 'abc';
    document.getSelection()!.collapse(text, 3);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('abc'));
    expect(viewOf(container).state.doc.toString()).toBe('abc');
  });

  it('does not echo prop-driven value changes back through onChange', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<CodeEditor value="a" onChange={onChange} language="python" ariaLabel="Code" />);
    rerender(<CodeEditor value="reset" onChange={onChange} language="python" ariaLabel="Code" />);
    expect(viewOf(container).state.doc.toString()).toBe('reset');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('blocks editing when readOnly', () => {
    const onChange = vi.fn();
    const { container } = render(<CodeEditor value="ab" onChange={onChange} language="python" ariaLabel="Code" readOnly />);
    const view = viewOf(container);
    expect(container.querySelector('.cm-content')?.getAttribute('contenteditable')).toBe('false');
    view.dispatch({ selection: { anchor: 0 } });
    expect(indentMore(view)).toBe(false);
    expect(view.state.doc.toString()).toBe('ab');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('indents with Tab', () => {
    const { container } = render(<CodeEditor value="ab" onChange={() => {}} language="python" ariaLabel="Code" />);
    const content = container.querySelector<HTMLElement>('.cm-content')!;
    content.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9, bubbles: true, cancelable: true }));
    expect(viewOf(container).state.doc.toString()).not.toBe('ab');
  });

  it('keeps the same editor DOM node when the language changes', async () => {
    const { container, rerender } = render(<CodeEditor value="x" onChange={() => {}} language="python" ariaLabel="Code" />);
    const editor = container.querySelector('.cm-editor');
    await waitFor(() => expect(viewOf(container).state.facet(languageFacet)?.name).toBe('python'));
    rerender(<CodeEditor value="x" onChange={() => {}} language="javascript" ariaLabel="Code" />);
    await waitFor(() => expect(viewOf(container).state.facet(languageFacet)?.name).toBe('javascript'));
    expect(container.querySelector('.cm-editor')).toBe(editor);
  });

  it('destroys the view on unmount', () => {
    const { container, unmount } = render(<CodeEditor value="x" onChange={() => {}} language="python" ariaLabel="Code" />);
    const view = viewOf(container);
    unmount();
    expect(container.querySelector('.cm-editor')).toBeNull();
    expect(() => view.destroy()).not.toThrow();
  });

  it('builds its theme from CSS variables only, without hex colours', () => {
    // Lezer tags are cyclic objects, so only their style declarations are serialised.
    const css = JSON.stringify([editorThemeSpec(3), editorHighlightSpec.map(({ tag: _tag, ...style }) => style)]);
    expect(css).toContain('var(--code-background)');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|hsl)a?\(/);
  });
});

describe('editorLanguageExtension', () => {
  it.each(LANGUAGES)('resolves an extension for %s', async (language) => {
    expect(await editorLanguageExtension(language)).toBeTruthy();
  });
});
