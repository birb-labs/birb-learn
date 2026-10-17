import type { ReactNode } from 'react';
import type { HighlightedLine, HighlightedToken } from './highlight';
import styles from './code-lines.module.css';

export interface CodeLinesProps {
  lines: HighlightedLine[];
  lineNumbers?: boolean;
  /** Inclusive, 1-based. */
  highlightedRange?: { start: number; end: number };
  /** Fades the lines outside `highlightedRange`. */
  dimOutside?: boolean;
  /** Replaces the default token rendering (e.g. to put inputs in fill-blank gaps). */
  renderToken?: (token: HighlightedToken, lineIndex: number, tokenIndex: number) => ReactNode;
  /** Turns every line into a button that reports its 1-based number. */
  onLineClick?: (lineNumber: number) => void;
  selectedLine?: number;
  /** Accessible name of each line button (only used with `onLineClick`); the caller supplies the translated text. */
  lineLabel?: (lineNumber: number) => string;
}

export function CodeLines({
  lines,
  lineNumbers = false,
  highlightedRange,
  dimOutside = false,
  renderToken,
  onLineClick,
  selectedLine,
  lineLabel,
}: CodeLinesProps) {
  return (
    <pre className={styles.code}>
      <code>
        {lines.map((line, lineIndex) => {
          const lineNumber = lineIndex + 1;
          const highlighted = highlightedRange !== undefined && lineNumber >= highlightedRange.start && lineNumber <= highlightedRange.end;
          const dimmed = dimOutside && highlightedRange !== undefined && !highlighted;
          const content = (
            <>
              {lineNumbers && (
                <span className={styles.number} data-line-number aria-hidden="true">
                  {lineNumber}
                </span>
              )}
              <span className={styles.content}>
                {line.map((token, tokenIndex) =>
                  renderToken ? (
                    renderToken(token, lineIndex, tokenIndex)
                  ) : (
                    <span key={tokenIndex} style={{ color: token.color, fontStyle: token.fontStyle === 'italic' ? 'italic' : undefined, fontWeight: token.fontStyle === 'bold' ? 'bold' : undefined }}>
                      {token.text}
                    </span>
                  ),
                )}
                {/* Keeps blank lines at full height. */}
                {line.length === 0 && ' '}
              </span>
            </>
          );
          const stateProps = {
            'data-line': lineNumber,
            'data-highlighted': highlighted ? '' : undefined,
            'data-dimmed': dimmed ? '' : undefined,
          };
          if (onLineClick) {
            return (
              <button
                key={lineIndex}
                type="button"
                className={`${styles.line} ${styles.clickable}`}
                aria-pressed={selectedLine === lineNumber}
                aria-label={lineLabel?.(lineNumber)}
                onClick={() => onLineClick(lineNumber)}
                {...stateProps}
              >
                {content}
              </button>
            );
          }
          return (
            <div key={lineIndex} className={styles.line} {...stateProps}>
              {content}
            </div>
          );
        })}
      </code>
    </pre>
  );
}
