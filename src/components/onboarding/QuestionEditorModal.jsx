import { useEffect, useState } from 'react';

import './onboarding-intake.css';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
];

export const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Single choice' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'text', label: 'Text input' },
  { value: 'number', label: 'Number input' },
  { value: 'date', label: 'Date input' },
  { value: 'slider', label: 'Slider' },
  { value: 'rating', label: 'Rating' },
];

const CHOICE_TYPES = new Set(['single_choice', 'multiple_choice', 'dropdown']);
const RANGE_TYPES = new Set(['slider', 'rating', 'number']);

function emptyLocale() {
  return { title: '', body: '', placeholder: '', options: [], minValue: null, maxValue: null };
}

export function emptyQuestionForm(order = 1) {
  return {
    type: 'single_choice',
    order,
    required: true,
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
  if (!Array.isArray(options) || !options.length) return [{ id: '', label: '' }];
  return options.map(o => ({ id: o.id ?? '', label: o.label ?? '' }));
}

export function QuestionEditorModal({ question, onChange, onCancel, onSave, saving }) {
  const isNew = !question.id;
  const [activeLocale, setActiveLocale] = useState('en');
  const locale = question.content?.[activeLocale] ?? emptyLocale();
  const type = question.type ?? 'single_choice';
  const [choiceRows, setChoiceRows] = useState(() => optionsToRows(locale.options));

  useEffect(() => {
    setChoiceRows(optionsToRows(locale.options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLocale, question.id, type]);

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

  const showChoices = CHOICE_TYPES.has(type);
  const showRange = RANGE_TYPES.has(type);

  return (
    <div className="intake-modal-backdrop">
      <div className="intake-modal">
        <h3 className="intake-modal__title">
          {isNew ? 'Add intake question' : 'Edit intake question'}
        </h3>

        <p className="intake-flow-rules">
          Questions appear in the mobile app after basic profile onboarding. Drag cards on the main
          list to set order. The server assigns stable question IDs — you only edit copy and type.
        </p>

        <label className="intake-field">
          <span className="intake-field__label">Question type</span>
          <select
            className="intake-field__input"
            value={type}
            onChange={e => onChange({ ...question, type: e.target.value })}
          >
            {QUESTION_TYPES.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="intake-field-row">
          <label className="intake-field intake-field--row">
            <input
              type="checkbox"
              checked={Boolean(question.required)}
              onChange={e => onChange({ ...question, required: e.target.checked })}
            />
            <span className="intake-field__label intake-field__label--inline">Required</span>
          </label>
          <label className="intake-field intake-field--row">
            <input
              type="checkbox"
              checked={Boolean(question.isActive)}
              onChange={e => onChange({ ...question, isActive: e.target.checked })}
            />
            <span className="intake-field__label intake-field__label--inline">Active</span>
          </label>
        </div>

        <div className="intake-locale-tabs">
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              className={`intake-locale-tab ${activeLocale === code ? 'intake-locale-tab--active' : ''}`}
              onClick={() => setActiveLocale(code)}
            >
              {label}
            </button>
          ))}
          <button type="button" className="intake-copy-btn" onClick={copyEnglishToAll}>
            Copy English to Hindi
          </button>
        </div>

        <div className="intake-modal__body">
          <label className="intake-field">
            <span className="intake-field__label">Title / question</span>
            <input
              className="intake-field__input"
              value={locale.title}
              onChange={e => patchLocale({ title: e.target.value })}
            />
          </label>

          <label className="intake-field">
            <span className="intake-field__label">Body (optional)</span>
            <textarea
              className="intake-field__input intake-field__textarea"
              rows={2}
              value={locale.body}
              onChange={e => patchLocale({ body: e.target.value })}
            />
          </label>

          {type === 'text' || type === 'number' || type === 'date' ? (
            <label className="intake-field">
              <span className="intake-field__label">Placeholder</span>
              <input
                className="intake-field__input"
                value={locale.placeholder}
                onChange={e => patchLocale({ placeholder: e.target.value })}
              />
            </label>
          ) : null}

          {showChoices ? (
            <div className="intake-field">
              <span className="intake-field__label">Answer options</span>
              <ul className="intake-choice-list">
                {choiceRows.map((row, i) => (
                  <li key={i} className="intake-choice-row">
                    <input
                      className="intake-field__input"
                      value={row.label}
                      placeholder={`Option ${i + 1}`}
                      onChange={e => {
                        const next = [...choiceRows];
                        next[i] = { ...next[i], label: e.target.value };
                        setChoiceRows(next);
                        persistChoiceRows(next);
                      }}
                    />
                    {choiceRows.length > 1 ? (
                      <button
                        type="button"
                        className="intake-icon-btn intake-icon-btn--danger"
                        aria-label="Remove option"
                        onClick={() => {
                          const next = choiceRows.filter((_, j) => j !== i);
                          const normalized = next.length ? next : [{ id: '', label: '' }];
                          setChoiceRows(normalized);
                          persistChoiceRows(normalized);
                        }}
                      >
                        ×
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="intake-text-btn"
                onClick={() => setChoiceRows(prev => [...prev, { id: '', label: '' }])}
              >
                + Add option
              </button>
            </div>
          ) : null}

          {showRange ? (
            <div className="intake-field-row">
              <label className="intake-field">
                <span className="intake-field__label">Min value</span>
                <input
                  type="number"
                  className="intake-field__input"
                  value={locale.minValue ?? ''}
                  onChange={e =>
                    patchLocale({
                      minValue: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="intake-field">
                <span className="intake-field__label">Max value</span>
                <input
                  type="number"
                  className="intake-field__input"
                  value={locale.maxValue ?? ''}
                  onChange={e =>
                    patchLocale({
                      maxValue: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
          ) : null}
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
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
