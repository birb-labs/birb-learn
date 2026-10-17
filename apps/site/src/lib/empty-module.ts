// Browser stand-in for Node built-ins that third-party code-runner engines
// import only inside Node-only branches (see `turbopack.resolveAlias` in
// `next.config.ts`). It is never evaluated for its exports.
export {};
