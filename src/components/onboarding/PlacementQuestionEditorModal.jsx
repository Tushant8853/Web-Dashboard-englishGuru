import { useState } from 'react';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
];

const OPTION_IDS = ['A', 'B', 'C', 'D'];

function emptyLocale() {
  return { prompt: '', options: ['', '', '', ''] };
}

export function emptyPlacementQuestionForm(order = 1) {
  return {
    order,
    correctOptionId: 'A',
    isProfileQuestion: false,
    isActive: true,
    content: {
      en: emptyLocale(),
      hi: emptyLocale(),
    },
  };
}

function optionsToArray(options) {
  const byId = Object.fromEntries(
    (options ?? []).map(option => [String(option.id ?? '').toUpperCase(), option.label ?? '']),
  );
  return OPTION_IDS.map(id => byId[id] ?? '');
}

function arrayToOptions(labels) {
  return OPTION_IDS.map((id, index) => ({
    id,
    label: String(labels[index] ?? '').trim(),
  })).filter(option => option.label);
}

export function questionToPlacementForm(item) {
  const enOptions = optionsToArray(item.content?.en?.options);
  const hiOptions = optionsToArray(item.content?.hi?.options);
  const isProfile = !item.correctOptionId;
  return {
    id: item.id,
    questionKey: item.questionKey ?? '',
    order: item.order ?? 1,
    correctOptionId: isProfile ? 'A' : String(item.correctOptionId ?? 'A').toUpperCase(),
    isProfileQuestion: isProfile,
    isActive: Boolean(item.isActive),
    content: {
      en: {
        prompt: item.content?.en?.prompt ?? '',
        options: enOptions,
      },
      hi: {
        prompt: item.content?.hi?.prompt ?? '',
        options: hiOptions,
      },
    },
  };
}

export function PlacementQuestionEditorModal({
  question,
  onChange,
  onCancel,
  onSave,
  saving,
}) {
  const isNew = !question.id;
  const [activeLocale, setActiveLocale] = useState('en');
  const locale = question.content?.[activeLocale] ?? emptyLocale();

  const patchLocale = patch => {
    onChange({
      ...question,
      content: {
        ...question.content,
        [activeLocale]: {
          ...emptyLocale(),
          ...question.content?.[activeLocale],
          ...patch,
        },
      },
    });
  };

  const copyEnglishToHindi = () => {
    const en = question.content?.en ?? emptyLocale();
    onChange({
      ...question,
      content: {
        en,
        hi: {
          prompt: en.prompt,
          options: [...en.options],
        },
      },
    });
  };

  const setOption = (index, value) => {
    const next = [...locale.options];
    next[index] = value;
    patchLocale({ options: next });
  };

  const setCorrectOption = optionId => {
    onChange({
      ...question,
      correctOptionId: optionId,
      isProfileQuestion: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-white">
          {isNew ? 'New placement question' : 'Edit placement question'}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {!isNew && question.questionKey ? (
            <label className="col-span-2 block text-sm">
              <span className="text-slate-400">Question key</span>
              <input
                value={question.questionKey}
                readOnly
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-400"
              />
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="text-slate-400">Order</span>
            <input
              type="number"
              min={1}
              value={question.order ?? 1}
              onChange={e => onChange({ ...question, order: Number(e.target.value) || 1 })}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            />
          </label>

          <label className="flex items-center gap-2 self-end text-sm text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(question.isActive)}
              onChange={e => onChange({ ...question, isActive: e.target.checked })}
            />
            Active on mobile
          </label>

          <label className="col-span-2 flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={Boolean(question.isProfileQuestion)}
              onChange={e =>
                onChange({
                  ...question,
                  isProfileQuestion: e.target.checked,
                })
              }
            />
            Profile question (answered on mobile, not scored)
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {LOCALES.map(loc => (
            <button
              key={loc.code}
              type="button"
              onClick={() => setActiveLocale(loc.code)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                activeLocale === loc.code
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
              }`}
            >
              {loc.label}
            </button>
          ))}
          <button
            type="button"
            onClick={copyEnglishToHindi}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500"
          >
            Copy English → Hindi
          </button>
        </div>

        <div className="mt-6">
          <h4 className="mb-2 text-sm font-semibold text-white">
            MCQ ({activeLocale === 'en' ? 'English' : 'Hindi'})
          </h4>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <input
              value={locale.prompt ?? ''}
              onChange={e => patchLocale({ prompt: e.target.value })}
              placeholder="Question prompt"
              className="mb-3 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
            {OPTION_IDS.map((optionId, index) => (
              <div key={optionId} className="mb-1 flex items-center gap-2">
                <span className="w-6 text-center text-xs font-semibold text-slate-500">{optionId}</span>
                {!question.isProfileQuestion ? (
                  <input
                    type="radio"
                    name="placement-correct"
                    checked={question.correctOptionId === optionId}
                    onChange={() => setCorrectOption(optionId)}
                    title="Mark as correct answer"
                  />
                ) : (
                  <span className="w-4" />
                )}
                <input
                  value={locale.options[index] ?? ''}
                  onChange={e => setOption(index, e.target.value)}
                  placeholder={`Option ${optionId}`}
                  className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
                />
              </div>
            ))}
            {question.isProfileQuestion ? (
              <p className="mt-2 text-xs text-amber-400">
                Profile questions have no correct answer. Learners pick an option for personalization only.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Select the radio button next to the correct option (scored MCQs only).
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function placementFormToPayload(form) {
  const enOptions = arrayToOptions(form.content?.en?.options ?? []);
  const hiOptions = arrayToOptions(form.content?.hi?.options ?? []);
  return {
    order: Number(form.order) || 1,
    correctOptionId: form.isProfileQuestion ? null : form.correctOptionId,
    isActive: Boolean(form.isActive),
    content: {
      en: {
        prompt: String(form.content?.en?.prompt ?? '').trim(),
        options: enOptions,
      },
      hi: {
        prompt: String(form.content?.hi?.prompt ?? '').trim(),
        options: hiOptions,
      },
    },
  };
}
