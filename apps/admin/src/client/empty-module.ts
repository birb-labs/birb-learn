// Browser stand-in for Node built-ins that third-party code-runner engines
// import only inside Node-only branches (wasmoon, the Lua engine, runs
// `await import('module')` under Node). It is never evaluated for its exports.
// Aliased in `vite.config.ts`, like the site's `turbopack.resolveAlias`.
export {};
