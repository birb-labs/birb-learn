// Fakes shared by the tests that render the code forms. jsdom has no layout engine,
// so the real CodeMirror editor cannot be typed into; these stand in for it.
import type { Runner, RunResult } from '@birb-learn/code-runner/src/protocol';

/** Stands in for `CodeEditor` from `@birb-learn/code-ui/editor`: a plain textarea with the same name. */
export function FakeCodeEditor({ value, onChange, ariaLabel }: { value: string; onChange: (value: string) => void; ariaLabel: string }) {
  return <textarea aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} />;
}

/** Stands in for `MdxEditor`: no preview request, just the textarea. */
export function FakeMdxEditor({ value, onChange, label }: { value: string; onChange: (value: string) => void; label?: string }) {
  return <textarea aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />;
}

export const OK_RUN: RunResult = {
  status: 'ok',
  cases: [{ status: 'ok', stdout: 'Hello, world!\n', stderr: '', exitCode: 0, durationMs: 1 }],
};

/** A runner that answers every run with `result` and records the requests. */
export function fakeRunner(result: RunResult | ((index: number) => RunResult) = OK_RUN) {
  const requests: Parameters<Runner['runCode']>[0][] = [];
  const runner: Runner = {
    runCode: async (request) => {
      requests.push(request);
      return typeof result === 'function' ? result(requests.length - 1) : result;
    },
  };
  return { runner, requests };
}
