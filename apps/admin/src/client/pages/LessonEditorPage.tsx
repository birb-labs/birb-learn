import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { MdxEditor } from '../components/MdxEditor';
import styles from './LessonEditorPage.module.css';

type Locale = 'pt-BR' | 'en-US' | 'es';
const LOCALES: Locale[] = ['pt-BR', 'en-US', 'es'];

type BlockType = 'text' | 'curiosity' | 'real_world_application' | 'solved_exercise' | 'simulator';
const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'curiosity', label: 'Curiosidade' },
  { value: 'real_world_application', label: 'Aplicação real' },
  { value: 'solved_exercise', label: 'Exercício resolvido' },
  { value: 'simulator', label: 'Simulador' },
];

interface BlockTranslation {
  title?: string;
  bodyMdx?: string;
  promptMdx?: string;
  resolutionMdx?: string;
  caption?: string;
}

interface Block {
  id: number;
  order: number;
  type: BlockType;
  simulatorKey: string | null;
  simulatorParams: string | null;
  translations: Partial<Record<Locale, BlockTranslation>>;
}

interface Lesson {
  translations: Partial<Record<Locale, { title: string }>>;
  blocks: Block[];
}

// Non-blank placeholder content: the server rejects blank required fields
// (see `validateLessonBlockTranslation` in the worker's lessons routes), so
// a brand-new block needs a starting value the author edits into real
// content, not an empty string that would fail validation silently.
function emptyTranslationFor(type: BlockType): BlockTranslation {
  if (type === 'text') return { bodyMdx: 'Novo bloco de texto.' };
  if (type === 'curiosity' || type === 'real_world_application') return { title: 'Novo título', bodyMdx: 'Novo conteúdo.' };
  if (type === 'solved_exercise') return { promptMdx: 'Novo enunciado.', resolutionMdx: 'Nova resolução.' };
  return { caption: '' };
}

// The one simulator this project will eventually have (built in a later
// task). If/when other simulators exist, the admin should change this after
// adding the block -- there's no picker yet.
const DEFAULT_SIMULATOR_KEY = 'function-approach-grapher';

export function LessonEditorPage({ lessonId, onDone }: { lessonId: number; onDone: () => void }) {
  const [activeLocale, setActiveLocale] = useState<Locale>('pt-BR');
  const [lesson, setLesson] = useState<Lesson>({ translations: {}, blocks: [] });
  const [error, setError] = useState<string | null>(null);

  function reload() {
    apiFetch(`/api/lessons/lessons/${lessonId}`)
      .then((response) => response.json<Lesson>())
      .then(setLesson);
  }

  useEffect(reload, [lessonId]);

  const title = lesson.translations[activeLocale]?.title ?? '';

  async function handleSaveTitle() {
    await apiFetch(`/api/lessons/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ translations: { [activeLocale]: { title } } }),
    });
  }

  function updateTitle(value: string) {
    setLesson((prev) => ({ ...prev, translations: { ...prev.translations, [activeLocale]: { title: value } } }));
  }

  async function handleAddBlock(type: BlockType) {
    const response = await apiFetch(`/api/lessons/lessons/${lessonId}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        // simulatorKey is required by the server unconditionally for
        // `type: 'simulator'` (not gated behind translations), so it must be
        // sent on creation -- defaulted here since there's no picker yet.
        ...(type === 'simulator' ? { simulatorKey: DEFAULT_SIMULATOR_KEY } : {}),
        translations: { 'pt-BR': emptyTranslationFor(type) },
      }),
    });
    if (!response.ok) {
      const data = await response.json<{ error: string }>();
      setError(data.error);
      return;
    }
    setError(null);
    reload();
  }

  async function handleRemoveBlock(blockId: number) {
    const response = await apiFetch(`/api/lessons/lessons/${lessonId}/blocks/${blockId}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json<{ error: string }>();
      setError(data.error);
      return;
    }
    setError(null);
    reload();
  }

  async function handleMoveBlock(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lesson.blocks.length) return;
    const reordered = [...lesson.blocks];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const response = await apiFetch(`/api/lessons/lessons/${lessonId}/blocks/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockIds: reordered.map((b) => b.id) }),
    });
    if (!response.ok) {
      const data = await response.json<{ error: string }>();
      setError(data.error);
      return;
    }
    setError(null);
    reload();
  }

  async function handleSaveBlock(block: Block, patch: Partial<{ simulatorKey: string; simulatorParams: string }>) {
    const response = await apiFetch(`/api/lessons/lessons/${lessonId}/blocks/${block.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      const data = await response.json<{ error: string }>();
      setError(data.error);
      return;
    }
    setError(null);
    reload();
  }

  // Every keystroke in the MdxEditor's fully-controlled textarea fires an
  // independent call here, each with its own in-flight PATCH. Applying the
  // optimistic update synchronously -- before the network call -- means
  // typing never waits on (or gets clobbered by) a response: if an older
  // keystroke's PATCH resolves after a newer one's, there is no stale
  // response handler left that could overwrite the latest local state.
  // The response is used only to surface failures; on success there is
  // nothing new to apply since the optimistic update already reflects the
  // correct value, and on failure we deliberately do not revert or reload,
  // since either would risk clobbering newer edits made after the failed one.
  async function handleSaveBlockContent(block: Block, content: BlockTranslation) {
    setLesson((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === block.id ? { ...b, translations: { ...b.translations, [activeLocale]: content } } : b)),
    }));
    const response = await apiFetch(`/api/lessons/lessons/${lessonId}/blocks/${block.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ translations: { [activeLocale]: content } }),
    });
    if (!response.ok) {
      const data = await response.json<{ error: string }>();
      setError(data.error);
      return;
    }
    setError(null);
  }

  return (
    <div className={styles.form}>
      <div className={styles.localeTabs}>
        {LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            className={locale === activeLocale ? styles.localeTabActive : styles.localeTab}
            onClick={() => setActiveLocale(locale)}
          >
            {locale}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <input className={styles.titleInput} value={title} onChange={(event) => updateTitle(event.target.value)} onBlur={handleSaveTitle} />

      <div className={styles.blockList}>
        {lesson.blocks.map((block, index) => {
          const content = block.translations[activeLocale] ?? emptyTranslationFor(block.type);
          return (
            <div key={block.id} className={styles.blockCard}>
              <div className={styles.blockHeader}>
                <span className={styles.blockType}>{BLOCK_TYPES.find((t) => t.value === block.type)?.label}</span>
                <button type="button" onClick={() => handleMoveBlock(index, -1)} disabled={index === 0}>
                  ↑
                </button>
                <button type="button" onClick={() => handleMoveBlock(index, 1)} disabled={index === lesson.blocks.length - 1}>
                  ↓
                </button>
                <button type="button" onClick={() => handleRemoveBlock(block.id)}>
                  Remover
                </button>
              </div>

              {block.type === 'simulator' ? (
                <>
                  <input
                    className={styles.titleInput}
                    placeholder="simulatorKey"
                    value={block.simulatorKey ?? ''}
                    onChange={(event) => handleSaveBlock(block, { simulatorKey: event.target.value })}
                  />
                  <textarea
                    className={styles.paramsTextarea}
                    placeholder="simulatorParams (JSON)"
                    value={block.simulatorParams ?? ''}
                    onChange={(event) => handleSaveBlock(block, { simulatorParams: event.target.value })}
                  />
                  <input
                    className={styles.titleInput}
                    placeholder="Legenda (opcional)"
                    value={content.caption ?? ''}
                    onChange={(event) => handleSaveBlockContent(block, { ...content, caption: event.target.value })}
                  />
                </>
              ) : (
                <>
                  {(block.type === 'curiosity' || block.type === 'real_world_application') && (
                    <input
                      className={styles.titleInput}
                      placeholder="Título"
                      value={content.title ?? ''}
                      onChange={(event) => handleSaveBlockContent(block, { ...content, title: event.target.value })}
                    />
                  )}
                  {block.type === 'solved_exercise' ? (
                    <>
                      <MdxEditor
                        label="Enunciado"
                        value={content.promptMdx ?? ''}
                        onChange={(promptMdx) => handleSaveBlockContent(block, { ...content, promptMdx })}
                      />
                      <MdxEditor
                        label="Resolução"
                        value={content.resolutionMdx ?? ''}
                        onChange={(resolutionMdx) => handleSaveBlockContent(block, { ...content, resolutionMdx })}
                      />
                    </>
                  ) : (
                    <MdxEditor
                      value={content.bodyMdx ?? ''}
                      onChange={(bodyMdx) => handleSaveBlockContent(block, { ...content, bodyMdx })}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.addBlockRow}>
        {BLOCK_TYPES.map((t) => (
          <button key={t.value} type="button" onClick={() => handleAddBlock(t.value)}>
            + {t.label}
          </button>
        ))}
      </div>

      <button type="button" className={styles.saveButton} onClick={onDone}>
        Concluído
      </button>
    </div>
  );
}
