import { useEffect, useState } from 'react';

import './onboarding-intake.css';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
];

function emptyLocale() {
  return { prompt: '', options: [] };
}

export function emptyPlacementQuestionForm(order = 1) {
  return {
    order,
    correctOptionId: 'a',
    isActive: true,
    content: {
      en: emptyLocale(),
      hi: emptyLocale(),
    },
  };
}

function optionId(label, index, existingId) {
  if (existingId && String(existingId).trim()) return existingId;
  const slug = String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return slug || `option_${index + 1}`;
}

function optionsToRows(options) {
  if (!Array.isArray(options) || !options.length) {
    return [
      { id: 'a', label: '' },
      { id: 'b', label: '' },
    ];
  }
  return options.map(o => ({ id: o.id ?? '', label: o.label ?? '' }));
}

export function PlacementQuestionEditorModal({ question, onChange, onCancel, onSave, saving }) {
  const isNew = !question.id;
  const [activeLocale, setActiveLocale] = useState('en');
  const locale = question.content?.[activeLocale] ?? emptyLocale();
  const [choiceRows, setChoiceRows] = useState(() => optionsToRows(locale.options));

  useEffect(() => {
    setChoiceRows(optionsToRows(locale.options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLocale, question.id]);

  const patchLocale = patch => {
    onChange({
      ...question,
      content: {
        ...question.content,
        [activeLocale]: { ...emptyLocale(), ...question.content?.[activeLocale], ...patch },
      },
    });
  };

  const copyEnglishToAll = () => {
    const en = question.content?.en ?? emptyLocale();
    onChange({
      ...question,
      content: {
        en,
        hi: { ...en, options: en.options?.map(o => ({ ...o })) ?? [] },
      },
    });
  };

  const persistChoiceRows = rows => {
    const options = rows
      .map((row, i) => ({
        id: optionId(row.label, i, row.id),
        label: row.label.trim(),
      }))
      .filter(o => o.label);
    patchLocale({ options });
  };

  const enOptions = question.content?.en?.options ?? [];

  return (
    <div className="intake-modal-backdrop">
      <div className="intake-modal">
        <h3 className="intake-modal__title">
          {isNew ? 'Add placement question' : 'Edit placement question'}
        </h3>

        <p className="intake-flow-rules">
          Multiple-choice placement questions shown after intake. Learners get a score out of 100
          based on correct answers. Mark the correct option id below.
        </p>

        <label className="intake-field">
          <span className="intake-field__label">Order</span>
          <input
            className="intake-field__input"
            type="number"
            min={1}
            value={question.order ?? 1}
            onChange={e => onChange({ ...question, order: Number(e.target.value) || 1 })}
          />
        </label>

        <label className="intake-field intake-field--row">
          <input
            type="checkbox"
            checked={Boolean(question.isActive)}
            onChange={e => onChange({ ...question, isActive: e.target.checked })}
          />
          <span className="intake-field__label">Active on mobile</span>
        </label>

        <label className="intake-field">
          <span className="intake-field__label">Correct option id</span>
          <select
            className="intake-field__input"
            value={question.correctOptionId ?? 'a'}
            onChange={e => onChange({ ...question, correctOptionId: e.target.value })}
          >
            {enOptions.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.id} — {opt.label || '(no label)'}
              </option>
            ))}
          </select>
        </label>

        <div className="intake-locale-tabs">
          {LOCALES.map(loc => (
            <button
              key={loc.code}
              type="button"
              className={`intake-locale-tab ${activeLocale === loc.code ? 'intake-locale-tab--active' : ''}`}
              onClick={() => setActiveLocale(loc.code)}
            >
              {loc.label}
            </button>
          ))}
          <button type="button" className="intake-btn intake-btn--ghost intake-locale-copy" onClick={copyEnglishToAll}>
            Copy English → Hindi
          </button>
        </div>

        <label className="intake-field">
          <span className="intake-field__label">Question prompt ({activeLocale})</span>
          <textarea
            className="intake-field__input intake-field__textarea"
            rows={3}
            value={locale.prompt ?? ''}
            onChange={e => patchLocale({ prompt: e.target.value })}
          />
        </label>

        <div className="intake-field">
          <span className="intake-field__label">Answer options ({activeLocale})</span>
          {choiceRows.map((row, index) => (
            <div key={index} className="intake-option-row">
              <input
                className="intake-field__input intake-option-id"
                placeholder="id"
                value={row.id}
                onChange={e => {
                  const next = [...choiceRows];
                  next[index] = { ...next[index], id: e.target.value };
                  setChoiceRows(next);
                }}
                onBlur={() => persistChoiceRows(choiceRows)}
              />
              <input
                className="intake-field__input"
                placeholder="Label"
                value={row.label}
                onChange={e => {
                  const next = [...choiceRows];
                  next[index] = { ...next[index], label: e.target.value };
                  setChoiceRows(next);
                }}
                onBlur={() => persistChoiceRows(choiceRows)}
              />
              <button
                type="button"
                className="intake-btn intake-btn--ghost"
                onClick={() => {
                  const next = choiceRows.filter((_, i) => i !== index);
                  setChoiceRows(next.length ? next : [{ id: '', label: '' }]);
                  persistChoiceRows(next.length ? next : [{ id: '', label: '' }]);
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="intake-btn intake-btn--ghost"
            onClick={() => setChoiceRows([...choiceRows, { id: '', label: '' }])}
          >
            + Add option
          </button>
        </div>

        <div className="intake-modal__actions">
          <button type="button" className="intake-btn intake-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="intake-btn intake-btn--primary"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save question'}
          </button>
        </div>
      </div>
    </div>
  );
}
