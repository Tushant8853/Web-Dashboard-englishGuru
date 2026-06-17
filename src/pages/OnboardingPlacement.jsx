import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createPlacementQuestion,
  deletePlacementQuestion,
  fetchPlacementQuestions,
  updatePlacementQuestion,
} from '../api/client';
import {
  emptyPlacementQuestionForm,
  PlacementQuestionEditorModal,
  placementFormToPayload,
  questionToPlacementForm,
} from '../components/onboarding/PlacementQuestionEditorModal';

const PAGE_SIZE_OPTIONS = [20, 30, 50];

function questionTypeLabel(item) {
  return item.correctOptionId ? 'MCQ' : 'Profile';
}

function correctLabel(item) {
  if (!item.correctOptionId) return '—';
  return String(item.correctOptionId).toUpperCase();
}

export function OnboardingPlacement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyPlacementQuestionForm());

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

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (activeFilter === 'active' && !item.isActive) return false;
      if (activeFilter === 'inactive' && item.isActive) return false;
      if (typeFilter === 'mcq' && !item.correctOptionId) return false;
      if (typeFilter === 'profile' && item.correctOptionId) return false;
      return true;
    });
  }, [items, activeFilter, typeFilter]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = items.filter(q => q.isActive).length;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyPlacementQuestionForm(items.length + 1));
    setModalOpen(true);
    setMessage('');
    setError('');
  };

  const openEdit = item => {
    setEditingId(item.id);
    setForm(questionToPlacementForm(item));
    setModalOpen(true);
    setMessage('');
    setError('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const onSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = placementFormToPayload(form);
      if (editingId) {
        await updatePlacementQuestion(editingId, payload);
        setMessage('Question updated.');
      } else {
        await createPlacementQuestion(payload);
        setMessage('Question created.');
      }
      closeModal();
      await loadQuestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async item => {
    const preview = item.content?.en?.prompt || item.questionKey || 'this question';
    if (!window.confirm(`Delete "${preview}"?`)) return;
    setError('');
    try {
      await deletePlacementQuestion(item.id);
      setMessage('Question deleted.');
      await loadQuestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Placement test</h2>
          <p className="mt-1 text-sm text-slate-400">
            {items.length} questions · {activeCount} active · server scores 25 MCQs; Q26–30 are profile
            questions
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Add question
        </button>
      </div>

      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-emerald-400">{message}</p> : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={e => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="">All types</option>
          <option value="mcq">MCQ (scored)</option>
          <option value="profile">Profile (not scored)</option>
        </select>
        <select
          value={activeFilter}
          onChange={e => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="">All status</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading placement questions…</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 bg-slate-900 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Prompt</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Correct</th>
                <th className="px-4 py-3">Options</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No questions match these filters.
                  </td>
                </tr>
              ) : (
                pagedItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-900/60">
                    <td className="px-4 py-3">{item.order}</td>
                    <td className="px-4 py-3 font-mono text-xs">{item.questionKey}</td>
                    <td className="max-w-md truncate px-4 py-3" title={item.content?.en?.prompt}>
                      {item.content?.en?.prompt || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          item.correctOptionId ? 'text-blue-400' : 'text-amber-400'
                        }
                      >
                        {questionTypeLabel(item)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{correctLabel(item)}</td>
                    <td className="px-4 py-3">{item.content?.en?.options?.length ?? 0}</td>
                    <td className="px-4 py-3">{item.isActive ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(item)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>
          Page {page} of {totalPages} · {total} shown
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="rounded border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="rounded border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {modalOpen ? (
        <PlacementQuestionEditorModal
          question={form}
          onChange={setForm}
          onCancel={closeModal}
          onSave={() => void onSave()}
          saving={saving}
        />
      ) : null}
    </div>
  );
}
