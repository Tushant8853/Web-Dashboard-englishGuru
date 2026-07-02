import { useCallback, useEffect, useState } from 'react';

import {
  createGoalIntakeQuestion,
  createLearningGoal,
  deleteGoalIntakeQuestion,
  deleteLearningGoal,
  fetchGoalIntakeQuestions,
  fetchLearningGoals,
  fetchOverview,
  reorderGoalIntakeQuestions,
  updateGoalIntakeQuestion,
  updateIntakeOnboardingConfig,
  updateLearningGoal,
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

function emptyGoalForm(order = 1) {
  return {
    goalKey: '',
    backendValue: '',
    emoji: '🎯',
    order,
    isActive: true,
    content: {
      en: { title: '', subtitle: '', description: '' },
      hi: { title: '', subtitle: '', description: '' },
    },
  };
}

function goalToForm(item) {
  return {
    id: item.id,
    goalKey: item.goalKey ?? '',
    backendValue: item.backendValue ?? '',
    emoji: item.emoji ?? '🎯',
    order: item.order ?? 1,
    isActive: Boolean(item.isActive),
    content: {
      en: {
        title: item.content?.en?.title ?? '',
        subtitle: item.content?.en?.subtitle ?? '',
        description: item.content?.en?.description ?? '',
      },
      hi: {
        title: item.content?.hi?.title ?? '',
        subtitle: item.content?.hi?.subtitle ?? '',
        description: item.content?.hi?.description ?? '',
      },
    },
  };
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

function GoalEditorModal({ goal, onChange, onCancel, onSave, saving }) {
  const isCreate = !goal.id;

  const setLocaleField = (lang, field, value) => {
    onChange({
      ...goal,
      content: {
        ...goal.content,
        [lang]: { ...goal.content[lang], [field]: value },
      },
    });
  };

  return (
    <div className="intake-modal-backdrop">
      <div className="intake-modal">
        <h3 className="intake-modal__title">{isCreate ? 'Add learning goal' : 'Edit learning goal'}</h3>

        <div className="intake-modal__body">
          {isCreate ? (
            <label className="intake-field">
              <span className="intake-field__label">Goal key (slug)</span>
              <input
                className="intake-field__input"
                value={goal.goalKey}
                onChange={e => onChange({ ...goal, goalKey: e.target.value })}
                placeholder="e.g. parent"
              />
            </label>
          ) : (
            <p className="intake-muted">Goal key: {goal.goalKey}</p>
          )}
          <label className="intake-field">
            <span className="intake-field__label">Backend value (saved on user profile)</span>
            <input
              className="intake-field__input"
              value={goal.backendValue}
              onChange={e => onChange({ ...goal, backendValue: e.target.value })}
            />
          </label>
          <label className="intake-field">
            <span className="intake-field__label">Emoji</span>
            <input
              className="intake-field__input"
              value={goal.emoji}
              onChange={e => onChange({ ...goal, emoji: e.target.value })}
            />
          </label>
          {['en', 'hi'].map(lang => (
            <div key={lang} className="intake-locale-block">
              <h4 className="intake-card__title">{lang === 'en' ? 'English' : 'Hindi'}</h4>
              <label className="intake-field">
                <span className="intake-field__label">Title</span>
                <input
                  className="intake-field__input"
                  value={goal.content[lang].title}
                  onChange={e => setLocaleField(lang, 'title', e.target.value)}
                />
              </label>
              <label className="intake-field">
                <span className="intake-field__label">Subtitle</span>
                <input
                  className="intake-field__input"
                  value={goal.content[lang].subtitle}
                  onChange={e => setLocaleField(lang, 'subtitle', e.target.value)}
                />
              </label>
              <label className="intake-field">
                <span className="intake-field__label">Description</span>
                <textarea
                  className="intake-field__input intake-field__textarea"
                  rows={3}
                  value={goal.content[lang].description}
                  onChange={e => setLocaleField(lang, 'description', e.target.value)}
                />
              </label>
            </div>
          ))}
          <label className="intake-field intake-field--row">
            <input
              type="checkbox"
              checked={goal.isActive}
              onChange={e => onChange({ ...goal, isActive: e.target.checked })}
            />
            <span className="intake-field__label intake-field__label--inline">Active on mobile</span>
          </label>
        </div>

        <div className="intake-modal__actions">
          <button type="button" className="intake-btn intake-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="intake-btn intake-btn--primary" disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save goal'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingIntake() {
  const [goals, setGoals] = useState([]);
  const [selectedGoalKey, setSelectedGoalKey] = useState('');
  const [questions, setQuestions] = useState([]);
  const [intakeEnabled, setIntakeEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingIntake, setTogglingIntake] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overview, data] = await Promise.all([fetchOverview(), fetchLearningGoals()]);
      setIntakeEnabled(Boolean(overview.intakeOnboardingEnabled));
      const list = [...(data.items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setGoals(list);
      setSelectedGoalKey(prev => {
        if (prev && list.some(g => g.goalKey === prev)) return prev;
        return list[0]?.goalKey || '';
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQuestions = useCallback(async goalKey => {
    if (!goalKey) {
      setQuestions([]);
      return;
    }
    setQuestionsLoading(true);
    setError('');
    try {
      const data = await fetchGoalIntakeQuestions(goalKey);
      const list = [...(data.items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setQuestions(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    void loadQuestions(selectedGoalKey);
  }, [loadQuestions, selectedGoalKey]);

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
          ? 'Goal intake enabled on mobile.'
          : 'Goal intake disabled — mobile skips the question modal.',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update intake status');
    } finally {
      setTogglingIntake(false);
    }
  };

  const onSaveGoal = async () => {
    if (!editingGoal) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        goalKey: editingGoal.goalKey,
        backendValue: editingGoal.backendValue,
        emoji: editingGoal.emoji,
        order: editingGoal.order,
        isActive: editingGoal.isActive,
        content: editingGoal.content,
      };
      const createdKey = editingGoal.goalKey.trim();
      if (editingGoal.id) {
        await updateLearningGoal(editingGoal.id, payload);
      } else {
        await createLearningGoal(payload);
      }
      setEditingGoal(null);
      setMessage('Learning goal saved.');
      await loadGoals();
      if (createdKey) {
        setSelectedGoalKey(createdKey);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDeleteGoal = async goal => {
    if (!window.confirm(`Delete goal "${goal.content?.en?.title || goal.goalKey}"?`)) return;
    setError('');
    try {
      await deleteLearningGoal(goal.id);
      if (selectedGoalKey === goal.goalKey) {
        setSelectedGoalKey('');
      }
      setMessage('Goal deleted.');
      await loadGoals();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const onSaveQuestion = async () => {
    if (!editingQuestion || !selectedGoalKey) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        goalKey: selectedGoalKey,
        type: editingQuestion.type,
        order: Number(editingQuestion.order) || 1,
        required: Boolean(editingQuestion.required),
        isActive: Boolean(editingQuestion.isActive),
        content: editingQuestion.content,
      };
      if (editingQuestion.id) {
        await updateGoalIntakeQuestion(editingQuestion.id, payload);
      } else {
        await createGoalIntakeQuestion(payload);
      }
      setEditingQuestion(null);
      setMessage('Question saved.');
      await loadQuestions(selectedGoalKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDeleteQuestion = async id => {
    const item = questions.find(q => q.id === id);
    if (!item || !window.confirm(`Remove "${item.content?.en?.title || 'this question'}"?`)) return;
    setError('');
    try {
      await deleteGoalIntakeQuestion(id);
      setMessage('Question removed.');
      await loadQuestions(selectedGoalKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const openAddQuestion = () => {
    if (!selectedGoalKey) {
      setError('Select a goal first, then add questions.');
      return;
    }
    setEditingQuestion(emptyQuestionForm(questions.length + 1));
    setMessage('');
    setError('');
  };

  const selectedGoal = goals.find(g => g.goalKey === selectedGoalKey);
  const activeCount = questions.filter(q => q.isActive).length;
  const modalOpen = Boolean(editingGoal || editingQuestion);

  if (loading) {
    return (
      <div className="intake-page intake-page--loading">
        <p className="intake-loading">Loading onboarding intake…</p>
      </div>
    );
  }

  return (
    <div className="intake-page">
      <header className="intake-top">
        <div className="intake-top__intro">
          <div className="intake-page__title-row">
            <h2 className="intake-page__title">Onboarding intake</h2>
            <span
              className={`intake-flow-status intake-flow-status--${intakeEnabled ? 'on' : 'off'}`}
            >
              {intakeEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="intake-page__subtitle">
            Add learning goals and intake questions on this screen. Select a goal on the left, then
            manage its questions on the right. Mobile shows these after the user picks a goal.
          </p>
        </div>
        <div className="intake-top__actions">
          <button
            type="button"
            className="intake-btn intake-btn--primary"
            onClick={() => {
              setEditingGoal(emptyGoalForm(goals.length + 1));
              setMessage('');
              setError('');
            }}
            disabled={modalOpen}
          >
            + Add goal
          </button>
          <button
            type="button"
            className="intake-btn intake-btn--primary"
            disabled={!selectedGoalKey || modalOpen}
            onClick={openAddQuestion}
          >
            + Add question
          </button>
          <div className="intake-flow-toggle" role="group" aria-label="Intake onboarding visibility">
            <button
              type="button"
              className={`intake-btn intake-btn--ghost${intakeEnabled ? ' intake-btn--active' : ''}`}
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
        </div>
      </header>

      <div className="intake-banners">
        <AlertBanner type="error">{error}</AlertBanner>
        <AlertBanner type="ok">{message}</AlertBanner>
        {!intakeEnabled ? (
          <AlertBanner type="warn">
            Intake is <strong>disabled</strong> — mobile skips the question modal after goal selection.
          </AlertBanner>
        ) : null}
      </div>

      <div className="intake-goals-layout">
        <section className="intake-goals-sidebar">
          <div className="intake-card intake-card--fill">
            <div className="intake-screens-head">
              <div>
                <h3 className="intake-card__title">Goals</h3>
                <p className="intake-card__desc">
                  {goals.length} goal{goals.length === 1 ? '' : 's'} · tap to select
                </p>
              </div>
            </div>
            <ul className="intake-goal-list">
              {goals.length > 0 ? (
                goals.map(goal => (
                  <li
                    key={goal.id}
                    className={`intake-goal-item ${selectedGoalKey === goal.goalKey ? 'intake-goal-item--active' : ''}`}
                  >
                    <button
                      type="button"
                      className="intake-goal-item__select"
                      onClick={() => setSelectedGoalKey(goal.goalKey)}
                    >
                      <span className="intake-goal-item__emoji">{goal.emoji}</span>
                      <span className="intake-goal-item__text">
                        <span className="intake-goal-item__title">
                          {goal.content?.en?.title || goal.goalKey}
                        </span>
                        <span className="intake-goal-item__meta">
                          {goal.goalKey} · {goal.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </span>
                    </button>
                    <div className="intake-goal-item__actions">
                      <button
                        type="button"
                        className="intake-text-btn"
                        onClick={() => setEditingGoal(goalToForm(goal))}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="intake-text-btn intake-text-btn--danger"
                        onClick={() => void onDeleteGoal(goal)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="intake-empty">No goals yet. Use Add goal above.</li>
              )}
            </ul>
          </div>
        </section>

        <section className="intake-main">
          <div className="intake-card intake-card--fill">
            <div className="intake-screens-head">
              <div>
                <h3 className="intake-card__title">
                  Questions
                  {selectedGoal ? ` · ${selectedGoal.content?.en?.title || selectedGoal.goalKey}` : ''}
                </h3>
                <p className="intake-card__desc">
                  {selectedGoalKey
                    ? `${questions.length} question${questions.length === 1 ? '' : 's'} · ${activeCount} active · drag to reorder`
                    : 'Select a goal on the left to manage its questions.'}
                </p>
              </div>
            </div>

            <div className="intake-list-panel">
              {questionsLoading ? (
                <p className="intake-empty">Loading questions…</p>
              ) : selectedGoalKey && questions.length > 0 ? (
                <DraggableQuestionList
                  questions={questions}
                  dragDisabled={modalOpen}
                  onReorderEnd={async orderedIds => {
                    setError('');
                    try {
                      const data = await reorderGoalIntakeQuestions(selectedGoalKey, orderedIds);
                      setQuestions(
                        [...(data.items ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
                      );
                      setMessage('Order saved.');
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : 'Could not save order';
                      setError(msg);
                      throw e;
                    }
                  }}
                  onEdit={item => setEditingQuestion(questionToForm(item))}
                  onDelete={onDeleteQuestion}
                />
              ) : selectedGoalKey ? (
                <p className="intake-empty">
                  No questions for this goal yet. Click <strong>Add question</strong> in the header.
                </p>
              ) : (
                <p className="intake-empty">Select a goal on the left, then add questions.</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {editingGoal ? (
        <GoalEditorModal
          key={editingGoal.id ?? 'new-goal'}
          goal={editingGoal}
          onChange={setEditingGoal}
          onCancel={() => setEditingGoal(null)}
          onSave={() => void onSaveGoal()}
          saving={saving}
        />
      ) : null}

      {editingQuestion ? (
        <QuestionEditorModal
          key={editingQuestion.id ?? 'new-question'}
          question={editingQuestion}
          onChange={setEditingQuestion}
          onCancel={() => setEditingQuestion(null)}
          onSave={() => void onSaveQuestion()}
          saving={saving}
        />
      ) : null}
    </div>
  );
}
