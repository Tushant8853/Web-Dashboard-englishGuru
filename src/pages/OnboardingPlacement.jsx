import { useCallback, useEffect, useState } from 'react';

import {
  createPlacementQuestion,
  deletePlacementQuestion,
  fetchPlacementQuestions,
  reorderPlacementQuestions,
  updatePlacementQuestion,
} from '../api/client';
import { DraggablePlacementList } from '../components/onboarding/DraggablePlacementList';
import {
  emptyPlacementQuestionForm,
  PlacementQuestionEditorModal,
} from '../components/onboarding/PlacementQuestionEditorModal';
import '../components/onboarding/onboarding-intake.css';

function AlertBanner({ type, children }) {
  if (!children) return null;
  return <div className={`intake-banner intake-banner--${type}`}>{children}</div>;
}

function questionToForm(item) {
  return {
    id: item.id,
    order: item.order ?? 1,
    correctOptionId: item.correctOptionId ?? 'a',
    isActive: Boolean(item.isActive),
    content: {
      en: {
        prompt: item.content?.en?.prompt ?? '',
        options: item.content?.en?.options ?? [],
      },
      hi: {
        prompt: item.content?.hi?.prompt ?? '',
        options: item.content?.hi?.options ?? [],
      },
    },
  };
}

export function OnboardingPlacement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(null);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPlacementQuestions();
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
    setEditing(emptyPlacementQuestionForm(items.length + 1));
    setMessage('');
    setError('');
  };

  const openEdit = item => {
    setEditing(questionToForm(item));
    setMessage('');
    setError('');
  };

  const closeEditor = () => setEditing(null);

  const onSave = async () => {
    if (!editing) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        order: Number(editing.order) || 1,
        correctOptionId: editing.correctOptionId,
        isActive: Boolean(editing.isActive),
        content: editing.content,
      };
      if (editing.id) {
        await updatePlacementQuestion(editing.id, payload);
        setMessage('Question updated.');
      } else {
        await createPlacementQuestion(payload);
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
    if (!item || !window.confirm(`Remove "${item.content?.en?.prompt || 'this question'}"?`)) return;
    setError('');
    setMessage('');
    try {
      await deletePlacementQuestion(id);
      setMessage('Question removed.');
      await loadQuestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Remove failed');
    }
  };

  if (loading) {
    return (
      <div className="intake-page intake-page--loading">
        <p className="intake-loading">Loading placement questions…</p>
      </div>
    );
  }

  const activeCount = items.filter(q => q.isActive).length;

  return (
    <div className="intake-page">
      <header className="intake-top">
        <div>
          <h2 className="intake-page__title">Placement test</h2>
          <p className="intake-page__subtitle">
            Manage multiple-choice placement questions shown after intake. The server scores answers
            out of 100 and stores the learner level on their profile.
          </p>
        </div>
      </header>

      <div className="intake-banners">
        <AlertBanner type="error">{error}</AlertBanner>
        <AlertBanner type="ok">{message}</AlertBanner>
        {items.length > 0 && activeCount === 0 ? (
          <AlertBanner type="warn">
            All questions are <strong>inactive</strong> — learners will see an empty placement test.
          </AlertBanner>
        ) : null}
      </div>

      <div className="intake-layout">
        <section className="intake-main">
          <div className="intake-card intake-card--fill">
            <div className="intake-screens-head">
              <div>
                <h3 className="intake-card__title">Placement questions</h3>
                <p className="intake-card__desc">
                  {items.length} question{items.length === 1 ? '' : 's'} · {activeCount} active · drag
                  to reorder
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

            <div className="intake-list-panel" aria-label="Placement questions list">
              {items.length > 0 ? (
                <DraggablePlacementList
                  questions={items}
                  dragDisabled={Boolean(editing)}
                  onReorderEnd={async orderedIds => {
                    setError('');
                    try {
                      const data = await reorderPlacementQuestions(orderedIds);
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
        <PlacementQuestionEditorModal
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
