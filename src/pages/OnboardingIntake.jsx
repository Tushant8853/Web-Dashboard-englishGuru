import { useCallback, useEffect, useState } from 'react';

import {
  createIntakeQuestion,
  deleteIntakeQuestion,
  fetchIntakeQuestions,
  fetchOverview,
  reorderIntakeQuestions,
  updateIntakeOnboardingConfig,
  updateIntakeQuestion,
} from '../api/client';
import { DraggableQuestionList } from '../components/onboarding/DraggableQuestionList';
import {
  emptyQuestionForm,
  QuestionEditorModal,
} from '../components/onboarding/QuestionEditorModal';
import '../components/onboarding/onboarding-intake.css';

function AlertBanner({ type, children }) {
  if (!children) return null;
  return <div className={`intake-banner intake-banner--${type}`}>{children}</div>;
}

function questionToForm(item) {
  return {
    id: item.id,
    type: item.type ?? 'single_choice',
    order: item.order ?? 1,
    required: Boolean(item.required),
    isActive: Boolean(item.isActive),
    content: {
      en: {
        title: item.content?.en?.title ?? '',
        body: item.content?.en?.body ?? '',
        placeholder: item.content?.en?.placeholder ?? '',
        options: item.content?.en?.options ?? [],
        minValue: item.content?.en?.minValue ?? null,
        maxValue: item.content?.en?.maxValue ?? null,
      },
      hi: {
        title: item.content?.hi?.title ?? '',
        body: item.content?.hi?.body ?? '',
        placeholder: item.content?.hi?.placeholder ?? '',
        options: item.content?.hi?.options ?? [],
        minValue: item.content?.hi?.minValue ?? null,
        maxValue: item.content?.hi?.maxValue ?? null,
      },
    },
  };
}

export function OnboardingIntake() {
  const [items, setItems] = useState([]);
  const [intakeEnabled, setIntakeEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingIntake, setTogglingIntake] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overview, data] = await Promise.all([fetchOverview(), fetchIntakeQuestions()]);
      setIntakeEnabled(Boolean(overview.intakeOnboardingEnabled));
      const list = [...(data.items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const openCreate = () => {
    setEditing(emptyQuestionForm(items.length + 1));
    setMessage('');
    setError('');
  };

  const openEdit = item => {
    setEditing(questionToForm(item));
    setMessage('');
    setError('');
  };

  const closeEditor = () => setEditing(null);

  const onSetIntakeEnabled = async enabled => {
    if (enabled === intakeEnabled || togglingIntake) return;
    setTogglingIntake(true);
    setError('');
    setMessage('');
    try {
      await updateIntakeOnboardingConfig({ enabled });
      setIntakeEnabled(enabled);
      setMessage(
        enabled
          ? 'Intake onboarding enabled. Learners will see the intake screen after basic onboarding.'
          : 'Intake onboarding disabled. Learners skip intake and go to placement.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update intake status');
    } finally {
      setTogglingIntake(false);
    }
  };

  const onSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        type: editing.type,
        order: Number(editing.order) || 1,
        required: Boolean(editing.required),
        isActive: Boolean(editing.isActive),
        content: editing.content,
      };
      if (editing.id) {
        await updateIntakeQuestion(editing.id, payload);
        setMessage('Question updated.');
      } else {
        await createIntakeQuestion(payload);
        setMessage('Question created.');
      }
      closeEditor();
      await loadQuestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async id => {
    const item = items.find(q => q.id === id);
    if (!item || !window.confirm(`Remove "${item.content?.en?.title || 'this question'}"?`)) return;
    setError('');
    setMessage('');
    try {
      await deleteIntakeQuestion(id);
      setMessage('Question removed.');
      await loadQuestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Remove failed');
    }
  };

  if (loading) {
    return (
      <div className="intake-page intake-page--loading">
        <p className="intake-loading">Loading intake questions…</p>
      </div>
    );
  }

  const activeCount = items.filter(q => q.isActive).length;

  return (
    <div className="intake-page">
      <header className="intake-top">
        <div className="intake-top__intro">
          <div className="intake-page__title-row">
            <h2 className="intake-page__title">Onboarding intake</h2>
            <span
              className={`intake-flow-status intake-flow-status--${
                intakeEnabled ? 'on' : 'off'
              }`}
            >
              {intakeEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="intake-page__subtitle">
            Edit question copy and types for the mobile intake flow. Drag cards to reorder — order
            is saved automatically. English and Hindi content is shown based on the user&apos;s app
            language.
          </p>
        </div>
        <div className="intake-flow-toggle" role="group" aria-label="Intake onboarding visibility">
          <button
            type="button"
            className={`intake-btn intake-btn--primary${intakeEnabled ? ' intake-btn--active' : ''}`}
            onClick={() => void onSetIntakeEnabled(true)}
            disabled={togglingIntake || intakeEnabled}
          >
            Enable
          </button>
          <button
            type="button"
            className={`intake-btn intake-btn--ghost${!intakeEnabled ? ' intake-btn--active-off' : ''}`}
            onClick={() => void onSetIntakeEnabled(false)}
            disabled={togglingIntake || !intakeEnabled}
          >
            Disable
          </button>
        </div>
      </header>

      <div className="intake-banners">
        <AlertBanner type="error">{error}</AlertBanner>
        <AlertBanner type="ok">{message}</AlertBanner>
        {items.length > 0 && activeCount === 0 && intakeEnabled ? (
          <AlertBanner type="warn">
            All questions are <strong>inactive</strong> — learners will see an empty intake screen.
          </AlertBanner>
        ) : null}
        {!intakeEnabled ? (
          <AlertBanner type="warn">
            Intake is <strong>disabled</strong> — the mobile app skips this step. Existing learners
            pick up the change on their next app refresh.
          </AlertBanner>
        ) : null}
      </div>

      <div className="intake-layout">
        <section className="intake-main">
          <div className="intake-card intake-card--fill">
            <div className="intake-screens-head">
              <div>
                <h3 className="intake-card__title">Intake questions</h3>
                <p className="intake-card__desc">
                  {items.length} question{items.length === 1 ? '' : 's'} · {activeCount} active ·
                  drag to reorder
                </p>
              </div>
              <button
                type="button"
                className="intake-btn intake-btn--primary"
                onClick={openCreate}
                disabled={Boolean(editing)}
              >
                + Add question
              </button>
            </div>

            <div className="intake-list-panel" aria-label="Intake questions list">
              {items.length > 0 ? (
                <DraggableQuestionList
                  questions={items}
                  dragDisabled={Boolean(editing)}
                  onReorderEnd={async orderedIds => {
                    setError('');
                    try {
                      const data = await reorderIntakeQuestions(orderedIds);
                      setItems(
                        [...(data.items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
                      );
                      setMessage('Order saved.');
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : 'Could not save order';
                      setError(msg);
                      throw e;
                    }
                  }}
                  onEdit={openEdit}
                  onDelete={onDelete}
                />
              ) : (
                <p className="intake-empty">
                  No questions yet. Use <strong>Add question</strong> or restart the API to seed
                  defaults.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {editing ? (
        <QuestionEditorModal
          key={editing.id ?? 'new'}
          question={editing}
          onChange={setEditing}
          onCancel={closeEditor}
          onSave={() => void onSave()}
          saving={saving}
        />
      ) : null}
    </div>
  );
}
