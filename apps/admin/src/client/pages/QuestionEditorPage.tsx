import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { MdxEditor } from '../components/MdxEditor';
import { OptionsEditor, type EditableOption } from '../components/OptionsEditor';
import { OrderingItemsEditor } from '../components/OrderingItemsEditor';
import { AcceptedAnswersEditor } from '../components/AcceptedAnswersEditor';
import { MatchingPairsEditor, type EditableMatchingPair } from '../components/MatchingPairsEditor';
import { TagPicker, type TopicNode } from '../components/TagPicker';
import { CopyFromPtBrButton } from '../code/CopyFromPtBrButton';
import { CodeTaskForm } from '../code/CodeTaskForm';
import { adaptTaskPayload, parseTaskPayload, placeholderTask } from '../code/task-payload';
import { VerifyButton } from '../code/VerifyButton';
// Deep imports: the content-schema barrel also exports the Drizzle queries, which must stay out of the browser bundle.
import type { CodeKind, Language } from '@birb-learn/content-schema/src/code-languages';
import type { CodeTaskPayloadData } from '@birb-learn/content-schema/src/code-payloads';
import styles from './QuestionEditorPage.module.css';

type QuestionType =
  | 'multiple_choice'
  | 'multiple_response'
  | 'numeric'
  | 'true_false'
  | 'short_text'
  | 'ordering'
  | 'matching'
  | 'code';
type Difficulty = 'easy' | 'medium' | 'hard';

type Locale = 'pt-BR' | 'en-US' | 'es';
const LOCALES: Locale[] = ['pt-BR', 'en-US', 'es'];

interface QuestionTranslation {
  promptMdx: string;
  resolutionMdx: string;
  options: EditableOption[];
  matchingPairs: EditableMatchingPair[];
  /** JSON text of the task payload, as stored; only code questions have one. */
  codeJson?: string | null;
}

// The kind and language a new code question starts with: the ones `placeholderTask` is valid for.
const DEFAULT_CODE_KIND: CodeKind = 'write';
const DEFAULT_CODE_LANGUAGE: Language = 'python';

const DEFAULT_TRANSLATION: QuestionTranslation = {
  promptMdx: '',
  resolutionMdx: '',
  options: [
    { textMdx: '', isCorrect: false },
    { textMdx: '', isCorrect: false },
  ],
  matchingPairs: [
    { leftMdx: '', rightMdx: '' },
    { leftMdx: '', rightMdx: '' },
  ],
};

export function QuestionEditorPage({ questionId, onDone }: { questionId: number | null; onDone: () => void }) {
  const [activeLocale, setActiveLocale] = useState<Locale>('pt-BR');
  const [type, setType] = useState<QuestionType>('multiple_choice');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [answerFormat, setAnswerFormat] = useState<'text' | 'math'>('text');
  const [translations, setTranslations] = useState<Partial<Record<Locale, QuestionTranslation>>>({});
  const [acceptedAnswersShared, setAcceptedAnswersShared] = useState<string[]>(['']);
  const [acceptedAnswersByLocale, setAcceptedAnswersByLocale] = useState<Partial<Record<Locale, string[]>>>({});
  const [tagTree, setTagTree] = useState<TopicNode[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [codeKind, setCodeKind] = useState<CodeKind>(DEFAULT_CODE_KIND);
  const [codeLanguage, setCodeLanguage] = useState<Language>(DEFAULT_CODE_LANGUAGE);
  const [questionKey, setQuestionKey] = useState('');
  // The task payload of a code question, per locale tab.
  const [codePayloads, setCodePayloads] = useState<Partial<Record<Locale, CodeTaskPayloadData>>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/tags')
      .then((response) => response.json<TopicNode[]>())
      .then(setTagTree);
  }, []);

  useEffect(() => {
    if (questionId === null) return;
    apiFetch(`/api/questions/${questionId}`)
      .then((response) =>
        response.json<{
          type: QuestionType;
          difficulty: Difficulty;
          correctAnswer: string | null;
          answerFormat: 'text' | 'math';
          codeKind?: CodeKind | null;
          codeLanguage?: Language | null;
          key?: string | null;
          tagIds: number[];
          translations: Partial<Record<Locale, QuestionTranslation>>;
          acceptedAnswersShared: string[];
          acceptedAnswersByLocale: Partial<Record<Locale, string[]>>;
        }>(),
      )
      .then((question) => {
        setType(question.type);
        setDifficulty(question.difficulty);
        setCorrectAnswer(question.correctAnswer ?? '');
        setAnswerFormat(question.answerFormat);
        setSelectedTagIds(question.tagIds);
        setTranslations(question.translations);
        setCodeKind(question.codeKind ?? DEFAULT_CODE_KIND);
        setCodeLanguage(question.codeLanguage ?? DEFAULT_CODE_LANGUAGE);
        setQuestionKey(question.key ?? '');
        const loadedPayloads: Partial<Record<Locale, CodeTaskPayloadData>> = {};
        for (const locale of LOCALES) {
          const payload = parseTaskPayload(question.translations[locale]?.codeJson);
          if (payload) loadedPayloads[locale] = payload;
        }
        setCodePayloads(loadedPayloads);
        setAcceptedAnswersShared(question.acceptedAnswersShared.length > 0 ? question.acceptedAnswersShared : ['']);
        setAcceptedAnswersByLocale(question.acceptedAnswersByLocale);
      });
  }, [questionId]);

  const current: QuestionTranslation = translations[activeLocale] ?? DEFAULT_TRANSLATION;

  function updateCurrent(patch: Partial<QuestionTranslation>) {
    setTranslations((prev) => ({ ...prev, [activeLocale]: { ...current, ...patch } }));
  }

  // pt-BR always has a payload to edit (a placeholder until the author changes it); the other
  // locales have one only once the author wrote it or copied the pt-BR one.
  function codePayloadFor(locale: Locale): CodeTaskPayloadData | undefined {
    return codePayloads[locale] ?? (locale === 'pt-BR' ? placeholderTask() : undefined);
  }

  const currentCodePayload = codePayloadFor(activeLocale);

  function setCurrentCodePayload(payload: CodeTaskPayloadData) {
    setCodePayloads((prev) => ({ ...prev, [activeLocale]: payload }));
  }

  // The kind and the language are shared by every locale, and a change can invalidate a payload
  // (a predict_output task has no tests, SQL tests differ from stdout tests), so every locale is reshaped.
  function retargetCode(kind: CodeKind, language: Language) {
    setCodeKind(kind);
    setCodeLanguage(language);
    const reshaped: Partial<Record<Locale, CodeTaskPayloadData>> = {};
    for (const locale of LOCALES) {
      const payload = codePayloadFor(locale);
      if (payload) reshaped[locale] = adaptTaskPayload(payload, kind, language);
    }
    setCodePayloads(reshaped);
  }

  function copyCodeFromPtBr() {
    const source = codePayloadFor('pt-BR');
    if (source) setCurrentCodePayload(structuredClone(source));
  }

  const currentAcceptedAnswers = answerFormat === 'math' ? acceptedAnswersShared : (acceptedAnswersByLocale[activeLocale] ?? ['']);

  function setCurrentAcceptedAnswers(answers: string[]) {
    if (answerFormat === 'math') {
      setAcceptedAnswersShared(answers);
    } else {
      setAcceptedAnswersByLocale((prev) => ({ ...prev, [activeLocale]: answers }));
    }
  }

  async function handleSave() {
    setError(null);

    // Merge the active locale's in-progress accepted-answers draft back into the full
    // per-locale map before sending: the backend's writeAcceptedAnswers deletes ALL
    // questionAcceptedAnswers rows for the question before reinserting only what it's
    // given, so sending just `{ [activeLocale]: ... }` here would silently wipe out
    // every other locale's accepted answers on save.
    const fullAcceptedAnswersByLocale: Partial<Record<Locale, string[]>> = {
      ...acceptedAnswersByLocale,
      ...(type === 'short_text' && answerFormat === 'text'
        ? { [activeLocale]: acceptedAnswersByLocale[activeLocale] ?? [''] }
        : {}),
    };

    // Same reasoning as `fullAcceptedAnswersByLocale` above, one level deeper: the
    // backend rebuilds the shared question option/matching-pair rows from scratch
    // (with new ids) whenever `translations` is present, so any locale missing from
    // the request loses its option/pair text — and a missing `pt-BR` breaks every
    // later read of the question, including the site build. Send every locale the
    // component holds, with the active tab's in-progress edits merged in.
    //
    // Option/pair *structure* (how many there are, which are correct) is shared
    // across locales rather than translated, so the active tab's structure is
    // applied to every locale and only the text stays per-locale — that way the
    // backend gets the same shape no matter which locale it reads structure from.
    const usesOptions = type === 'multiple_choice' || type === 'multiple_response' || type === 'ordering';
    const fullTranslations: Partial<Record<Locale, QuestionTranslation>> = {};
    for (const locale of LOCALES) {
      const codePayload = type === 'code' ? codePayloadFor(locale) : undefined;
      const translation = locale === activeLocale ? current : translations[locale];
      if (!translation) continue;
      // A locale tab the author never filled in is left out, so it is not rejected as an empty translation.
      if (
        type === 'code' &&
        locale !== 'pt-BR' &&
        !codePayloads[locale] &&
        translation.promptMdx.trim() === '' &&
        translation.resolutionMdx.trim() === ''
      ) {
        continue;
      }
      fullTranslations[locale] = {
        promptMdx: translation.promptMdx,
        resolutionMdx: translation.resolutionMdx,
        ...(codePayload ? { codeJson: JSON.stringify(codePayload) } : {}),
        options: usesOptions
          ? current.options.map((option, index) => ({
              textMdx: (translation.options[index] ?? option).textMdx,
              isCorrect: option.isCorrect,
            }))
          : [],
        matchingPairs:
          type === 'matching'
            ? current.matchingPairs.map((pair, index) => ({
                leftMdx: (translation.matchingPairs[index] ?? pair).leftMdx,
                rightMdx: (translation.matchingPairs[index] ?? pair).rightMdx,
              }))
            : [],
      };
    }

    const body = {
      type,
      difficulty,
      correctAnswer: type === 'numeric' || type === 'true_false' ? correctAnswer : null,
      answerFormat: type === 'short_text' ? answerFormat : 'text',
      tagIds: selectedTagIds,
      translations: fullTranslations,
      acceptedAnswersShared: type === 'short_text' && answerFormat === 'math' ? acceptedAnswersShared : [],
      acceptedAnswersByLocale: type === 'short_text' && answerFormat === 'text' ? fullAcceptedAnswersByLocale : {},
      ...(type === 'code' ? { codeKind, codeLanguage, key: questionKey.trim() === '' ? null : questionKey.trim() } : {}),
    };

    const response =
      questionId === null
        ? await apiFetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await apiFetch(`/api/questions/${questionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

    if (!response.ok) {
      const data = await response.json<{ error: string }>();
      setError(data.error);
      return;
    }

    onDone();
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

      <label htmlFor="type">Tipo</label>
      <select
        id="type"
        className={styles.select}
        value={type}
        onChange={(event) => setType(event.target.value as QuestionType)}
      >
        <option value="multiple_choice">Múltipla escolha (uma correta)</option>
        <option value="multiple_response">Múltipla resposta (várias corretas)</option>
        <option value="numeric">Numérica</option>
        <option value="true_false">Verdadeiro ou falso</option>
        <option value="short_text">Texto curto</option>
        <option value="ordering">Ordenação</option>
        <option value="matching">Associação</option>
        <option value="code">Código</option>
      </select>

      <label htmlFor="difficulty">Dificuldade</label>
      <select
        id="difficulty"
        className={styles.select}
        value={difficulty}
        onChange={(event) => setDifficulty(event.target.value as Difficulty)}
      >
        <option value="easy">Fácil</option>
        <option value="medium">Médio</option>
        <option value="hard">Difícil</option>
      </select>

      {type === 'code' && (
        <>
          <label htmlFor="question-key">Chave (opcional)</label>
          <input
            id="question-key"
            className={styles.textInput}
            placeholder="letras minúsculas, números e hifens"
            value={questionKey}
            onChange={(event) => setQuestionKey(event.target.value)}
          />
        </>
      )}

      <MdxEditor label="Enunciado" value={current.promptMdx} onChange={(promptMdx) => updateCurrent({ promptMdx })} />

      {type === 'code' &&
        (currentCodePayload ? (
          <>
            {activeLocale !== 'pt-BR' && <CopyFromPtBrButton disabled={false} onCopy={copyCodeFromPtBr} />}
            <CodeTaskForm
              kind={codeKind}
              language={codeLanguage}
              value={currentCodePayload}
              onChange={setCurrentCodePayload}
              onKindChange={(kind) => retargetCode(kind, codeLanguage)}
              onLanguageChange={(language) => retargetCode(codeKind, language)}
            />
            <VerifyButton kind="task" taskKind={codeKind} language={codeLanguage} payload={currentCodePayload} />
          </>
        ) : (
          <>
            <p>Este idioma ainda não tem código.</p>
            <CopyFromPtBrButton disabled={false} onCopy={copyCodeFromPtBr} />
          </>
        ))}

      {(type === 'multiple_choice' || type === 'multiple_response') && (
        <OptionsEditor type={type} options={current.options} onChange={(options) => updateCurrent({ options })} />
      )}

      {type === 'ordering' && (
        <OrderingItemsEditor items={current.options} onChange={(options) => updateCurrent({ options })} />
      )}

      {(type === 'numeric' || type === 'true_false') && (
        <>
          <label htmlFor="correct-answer">Resposta correta</label>
          {type === 'true_false' ? (
            <select
              id="correct-answer"
              className={styles.select}
              value={correctAnswer}
              onChange={(event) => setCorrectAnswer(event.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="true">Verdadeiro</option>
              <option value="false">Falso</option>
            </select>
          ) : (
            <input
              id="correct-answer"
              className={styles.textInput}
              value={correctAnswer}
              onChange={(event) => setCorrectAnswer(event.target.value)}
            />
          )}
        </>
      )}

      {type === 'short_text' && (
        <>
          <label htmlFor="answer-format">Modo de resposta</label>
          <select
            id="answer-format"
            className={styles.select}
            value={answerFormat}
            onChange={(event) => setAnswerFormat(event.target.value as 'text' | 'math')}
          >
            <option value="text">Texto</option>
            <option value="math">Matemática</option>
          </select>
          <AcceptedAnswersEditor
            answers={currentAcceptedAnswers}
            onChange={setCurrentAcceptedAnswers}
            answerFormat={answerFormat}
          />
        </>
      )}

      {type === 'matching' && (
        <MatchingPairsEditor pairs={current.matchingPairs} onChange={(matchingPairs) => updateCurrent({ matchingPairs })} />
      )}

      <TagPicker tagTree={tagTree} selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />

      <MdxEditor
        label="Resolução"
        value={current.resolutionMdx}
        onChange={(resolutionMdx) => updateCurrent({ resolutionMdx })}
      />

      {error && <p className={styles.error}>{error}</p>}

      <button type="button" className={styles.saveButton} onClick={handleSave}>
        Salvar
      </button>
    </div>
  );
}
