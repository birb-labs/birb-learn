import { render, waitFor } from '@testing-library/react';
import { language as languageFacet } from '@codemirror/language';
import { indentMore, undo } from '@codemirror/commands';
import { EditorView } from '@codemirror/view';
import { describe, expect, it, vi } from 'vitest';
import { LANGUAGES } from '@birb-learn/content-schema/src/code-languages';
import { CodeEditor } from './code-editor';
import { editorLanguageExtension } from './editor-languages';
import { editorHighlightSpec, editorThemeSpec } from './editor-theme';

// Passes through to the real loaders; a test can make the next load fail.
vi.mock('./editor-languages', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./editor-languages')>();
  return { ...actual, editorLanguageExtension: vi.fn(actual.editorLanguageExtension) };
});

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

  it('blocks editing when readOnly but stays focusable and selectable', async () => {
    const onChange = vi.fn();
    const { container } = render(<CodeEditor value="ab" onChange={onChange} language="python" ariaLabel="Code" readOnly />);
    const view = viewOf(container);
    const content = container.querySelector<HTMLElement>('.cm-content')!;
    // Not `contenteditable=false`: that would take the editor out of the tab order and selection.
    expect(content.getAttribute('contenteditable')).not.toBe('false');
    content.focus();
    expect(document.activeElement).toBe(content);
    view.dispatch({ selection: { anchor: 0, head: 2 } });
    expect(view.state.selection.main.empty).toBe(false);

    expect(indentMore(view)).toBe(false);
    // A browser-style DOM edit is reverted instead of reaching the document.
    const text = content.querySelector('.cm-line')!.firstChild as Text;
    text.data = 'abc';
    document.getSelection()!.collapse(text, 3);
    await waitFor(() => expect(content.querySelector('.cm-line')?.textContent).toBe('ab'));
    expect(view.state.doc.toString()).toBe('ab');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps external value changes out of the undo history', () => {
    const { container, rerender } = render(<CodeEditor value="old" onChange={() => {}} language="python" ariaLabel="Code" />);
    rerender(<CodeEditor value="new" onChange={() => {}} language="python" ariaLabel="Code" />);
    const view = viewOf(container);
    expect(view.state.doc.toString()).toBe('new');
    expect(undo(view)).toBe(false);
    expect(view.state.doc.toString()).toBe('new');
  });

  it('does not dispatch a replacement for a CRLF value that already matches the document', () => {
    const dispatch = vi.spyOn(EditorView.prototype, 'dispatch');
    const onChange = vi.fn();
    const replacements = () => dispatch.mock.calls.filter(([spec]) => typeof spec === 'object' && spec !== null && 'changes' in spec).length;
    const { container, rerender } = render(<CodeEditor value={'a\r\nb'} onChange={onChange} language="python" ariaLabel="Code" />);
    expect(viewOf(container).state.doc.toString()).toBe('a\nb');
    expect(replacements()).toBe(0);
    rerender(<CodeEditor value={'a\r\nb'} onChange={onChange} language="python" ariaLabel="Code" />);
    expect(replacements()).toBe(0);
    rerender(<CodeEditor value={'x\r\ny'} onChange={onChange} language="python" ariaLabel="Code" />);
    expect(replacements()).toBe(1);
    expect(viewOf(container).state.doc.toString()).toBe('x\ny');
    expect(onChange).not.toHaveBeenCalled();
    dispatch.mockRestore();
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

  it('drops the previous grammar when the new one fails to load', async () => {
    const { container, rerender } = render(<CodeEditor value="x" onChange={() => {}} language="python" ariaLabel="Code" />);
    await waitFor(() => expect(viewOf(container).state.facet(languageFacet)?.name).toBe('python'));
    vi.mocked(editorLanguageExtension).mockRejectedValueOnce(new Error('chunk failed'));
    rerender(<CodeEditor value="x" onChange={() => {}} language="javascript" ariaLabel="Code" />);
    await waitFor(() => expect(viewOf(container).state.facet(languageFacet)).toBeNull());
    expect(viewOf(container).state.doc.toString()).toBe('x');
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
