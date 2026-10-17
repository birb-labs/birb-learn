import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom has no layout engine; CodeMirror measures text through these Range APIs.
const emptyRect = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON: () => ({}) } as DOMRect;
const emptyRects = Object.assign([] as unknown as DOMRectList, { item: () => null });
if (typeof Range !== 'undefined') {
  Range.prototype.getBoundingClientRect = () => emptyRect;
  Range.prototype.getClientRects = () => emptyRects;
}

afterEach(() => {
  cleanup();
});
