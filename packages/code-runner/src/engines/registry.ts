import type { Language } from '@birb-learn/content-schema';
import type { EngineFactory } from './types';

// Lazy loaders, so a worker only downloads the engine of its own language.
// A language missing here makes the worker answer `failed/engine_load`.
export const ENGINE_LOADERS: Partial<Record<Language, () => Promise<EngineFactory>>> = {
  javascript: () => import('./javascript').then((m) => m.createJavaScriptEngine),
  typescript: () => import('./typescript').then((m) => m.createTypeScriptEngine),
  python: () => import('./python').then((m) => m.createPythonEngine),
  lua: () => import('./lua').then((m) => m.createLuaEngine),
};
