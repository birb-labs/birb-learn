import type { ReactElement } from 'react';
import { evaluate } from 'next-mdx-remote-client/rsc';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

interface HastNode {
  type: string;
  tagName?: string;
  children?: HastNode[];
}

/**
 * rehype-katex's default output embeds the raw LaTeX source inside a
 * hidden `<annotation encoding="application/x-tex">` element (part of the
 * MathML accessibility tree) — that raw source leaks into `textContent`
 * (and whatever a screen reader does with it), which is exactly the bug
 * already found and fixed once for student-typed math answers (see
 * apps/site/src/lib/render-math-answer.ts). This does the same thing for
 * build-time-compiled MDX (lessons, question prompts/resolutions): strip
 * only the `<annotation>` node, keeping the rest of the `<math>` tree
 * (the part a screen reader actually reads) intact.
 */
function stripKatexAnnotations() {
  return (tree: HastNode) => {
    function walk(node: HastNode) {
      if (!node.children) return;
      node.children = node.children.filter(
        (child) => !(child.type === 'element' && child.tagName === 'annotation'),
      );
      for (const child of node.children) walk(child);
    }
    walk(tree);
  };
}

interface MdastNode {
  type: string;
  value?: string;
  children?: MdastNode[];
  position?: { start: { offset?: number } };
  data?: Record<string, unknown>;
}

/**
 * remark-math only treats `$$` as display math when the delimiters sit on
 * their own lines; `$$x$$` written on a single line becomes inline math.
 * Authors (and the admin editor) routinely write a whole-paragraph
 * `$$…$$` on one line and expect a centered display equation, so a
 * paragraph whose only content is one `$$`-delimited inline math node is
 * turned into the same display-math node remark-math builds for a fenced
 * block. `$$x$$` inside a sentence stays inline.
 */
function promoteDoubleDollarParagraphs() {
  return (tree: MdastNode, file: { value?: unknown }) => {
    const source = typeof file.value === 'string' ? file.value : String(file.value ?? '');
    function walk(node: MdastNode) {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type !== 'paragraph' || !child.children) return child;
        const content = child.children.filter((part) => !(part.type === 'text' && part.value?.trim() === ''));
        const [only] = content;
        const offset = only?.position?.start.offset;
        if (content.length !== 1 || only.type !== 'inlineMath' || offset === undefined) return child;
        if (source.slice(offset, offset + 2) !== '$$') return child;
        const value = only.value ?? '';
        return {
          type: 'math',
          value,
          meta: null,
          position: child.position,
          data: {
            hName: 'pre',
            hChildren: [
              {
                type: 'element',
                tagName: 'code',
                properties: { className: ['language-math', 'math-display'] },
                children: [{ type: 'text', value }],
              },
            ],
          },
        } as MdastNode;
      });
      for (const child of node.children) walk(child);
    }
    walk(tree);
  };
}

/**
 * Compiles Markdown/MDX lesson source (with inline LaTeX math support via
 * remark-math + rehype-katex) into a React element ready to render inside a
 * Server Component.
 *
 * Note: `next-mdx-remote-client`'s `evaluate` does NOT throw on malformed
 * MDX — it catches the compile/run error internally and resolves with an
 * `error` field plus an empty placeholder `content`. We rethrow that error
 * here so callers can rely on rejection (via try/catch or a React error
 * boundary) instead of silently rendering empty output.
 */
export async function compileLessonMdx(source: string): Promise<ReactElement> {
  const { content, error } = await evaluate({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkMath, promoteDoubleDollarParagraphs],
        rehypePlugins: [rehypeKatex, stripKatexAnnotations],
      },
    },
  });

  if (error) {
    throw error;
  }

  return content;
}
