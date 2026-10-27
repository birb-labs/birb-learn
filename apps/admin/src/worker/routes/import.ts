import { Hono } from 'hono';
import { checkPack } from '@birb-learn/content-schema/src/packs/check-pack';
import { ImportRequestSchema } from '@birb-learn/content-schema/src/packs/pack-schemas';
import {
  UnknownReplaceTargetError,
  existingStateFromRows,
  existingStateQueries,
  planImport,
  plannedRowSql,
  type ExistingState,
} from '@birb-learn/content-schema/src/packs/plan-import';
import type { Env } from '../env';

// `POST /api/import`: imports a content-pack bundle sent by
// `pnpm content:import --target admin`. Authenticated by its own Bearer-token
// check against IMPORT_SECRET (the caller is a CLI, not a logged-in admin), so
// it is mounted above requireSession, like /api/export.
export const importRoutes = new Hono<{ Bindings: Env }>();

const MAX_SHAPE_ISSUES = 10;

async function sha256(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

/**
 * Compares the Authorization header with `Bearer <secret>` in constant time:
 * both sides are hashed first, so the comparison neither short-circuits nor
 * depends on their lengths. An unset secret never matches.
 */
async function bearerMatches(header: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!secret) return false;
  const [actual, expected] = await Promise.all([sha256(header ?? ''), sha256(`Bearer ${secret}`)]);
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

async function readExistingState(db: D1Database): Promise<ExistingState> {
  // One batch, so every query sees the same snapshot.
  const results = await db.batch<Record<string, unknown>>(existingStateQueries().map((sql) => db.prepare(sql)));
  return existingStateFromRows(results.map((result) => result.results));
}

importRoutes.post('/', async (c) => {
  if (!(await bearerMatches(c.req.header('Authorization'), c.env.IMPORT_SECRET))) {
    return c.json({ error: 'Não autorizado.' }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'O corpo da requisição não é um JSON válido.' }, 400);
  }

  // checkPack assumes a well-formed bundle, so the shape is checked first.
  const parsed = ImportRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, MAX_SHAPE_ISSUES).map((issue) => {
      const at = issue.path.length > 0 ? issue.path.join('.') : '(raiz)';
      return `${at}: ${issue.message}`;
    });
    const more = parsed.error.issues.length > MAX_SHAPE_ISSUES ? ` (e mais ${parsed.error.issues.length - MAX_SHAPE_ISSUES})` : '';
    return c.json(
      { error: `Corpo da requisição inválido: esperado { bundle, replace }. ${issues.join('; ')}${more}` },
      400,
    );
  }
  const { bundle, replace } = parsed.data;

  const problems = checkPack(bundle);
  if (problems.length > 0) {
    return c.json({ error: 'O pacote tem problemas; nada foi importado.', problems }, 400);
  }

  let plan;
  try {
    plan = planImport(bundle, await readExistingState(c.env.DB), { replace });
  } catch (error) {
    if (error instanceof UnknownReplaceTargetError) {
      const targets = error.targets.map((target) => `"${target}"`).join(', ');
      return c.json(
        { error: `Alvo de substituição desconhecido: ${targets}. Use o slug de uma lição ou a chave de uma questão do pacote.` },
        400,
      );
    }
    throw error;
  }

  if (plan.statements.length > 0) {
    try {
      // One batch is one transaction in D1: every statement is written, or none.
      await c.env.DB.batch(
        plan.statements.map((row) => {
          const { sql, params } = plannedRowSql(row);
          return c.env.DB.prepare(sql).bind(...params);
        }),
      );
    } catch (error) {
      return c.json({ error: `A importação falhou e nada foi gravado: ${(error as Error).message}` }, 500);
    }
  }

  return c.json(plan.report);
});
