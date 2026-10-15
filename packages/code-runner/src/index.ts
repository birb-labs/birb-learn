export * from './protocol';
export * from './languages';
export * from './output';
export * from './grading';
export * from './run-code';
export { BrowserRunner } from './browser-runner';
export * from './remote/compiler-explorer';

// `./node` (worker_threads-based) is deliberately NOT re-exported from this
// barrel. It statically imports `node:worker_threads`, which does not exist
// in the browser, so a barrel `export *` would let any browser bundle (the
// site's code lab, the admin) pull it in just by importing anything else from
// this package. Node consumers (the tests, the content validation script)
// that genuinely need the Node runner import it directly:
//   import { createNodeRunner } from '@birb-learn/code-runner/src/node';
