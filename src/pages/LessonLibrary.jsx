import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createLesson,
  deleteLesson,
  fetchLessons,
  updateLesson,
  uploadLessonVideo,
} from '../api/client';
import {
  LESSON_LEVELS,
  LESSON_TOPICS,
  LEVEL_LABELS,
  PAGE_SIZE_OPTIONS,
} from '../constants/lessonLibrary';
import { playbackUrlFromFileName } from '../utils/introVideoPlayback';

const emptyQuiz = () => ({
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
});

const emptyForm = () => ({
  lessonCode: '',
  dayNumber: 1,
  title: '',
  description: '',
  level: 'A0',
  topic: 'conversation',
  videoFileName: '',
  externalVideoUrl: '',
  isActive: true,
  sortOrder: 1,
  quiz: [emptyQuiz(), emptyQuiz(), emptyQuiz()],
});

function videoPreviewUrl(lesson) {
  if (lesson?.videoUrl) return lesson.videoUrl;
  if (lesson?.externalVideoUrl) return lesson.externalVideoUrl;
  return playbackUrlFromFileName(lesson?.videoFileName ?? '');
}

function videoStatusLabel(lesson) {
  if (lesson?.videoFileName?.trim()) return 'S3';
  if (lesson?.externalVideoUrl?.trim()) return 'URL';
  return 'None';
}

function videoStatusClass(lesson) {
  if (lesson?.videoFileName?.trim() || lesson?.externalVideoUrl?.trim()) {
    return 'text-emerald-400';
  }
  return 'text-amber-400';
}

export function LessonLibrary() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [levelFilter, setLevelFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const fileInputRef = useRef(null);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchLessons({
        page,
        pageSize,
        level: levelFilter || undefined,
        topic: topicFilter || undefined,
      });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, levelFilter, topicFilter]);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
    setMessage('');
    setError('');
  };

  const openEdit = lesson => {
    setEditingId(lesson.id);
    setForm({
      lessonCode: lesson.lessonCode ?? '',
      dayNumber: lesson.dayNumber ?? 1,
      title: lesson.title ?? '',
      description: lesson.description ?? '',
      level: lesson.level ?? 'A0',
      topic: lesson.topic ?? 'conversation',
      videoFileName: lesson.videoFileName ?? '',
      externalVideoUrl: lesson.externalVideoUrl ?? '',
      isActive: Boolean(lesson.isActive),
      sortOrder: lesson.sortOrder ?? lesson.dayNumber ?? 1,
      quiz:
        Array.isArray(lesson.quiz) && lesson.quiz.length > 0
          ? lesson.quiz.map(q => ({
              question: q.question ?? '',
              options: [...(q.options ?? ['', '', '', ''])].slice(0, 4).concat(
                Array(Math.max(0, 4 - (q.options?.length ?? 0))).fill(''),
              ),
              correctIndex: q.correctIndex ?? 0,
            }))
          : [emptyQuiz(), emptyQuiz(), emptyQuiz()],
    });
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
      const payload = {
        lessonCode: form.lessonCode.trim(),
        dayNumber: Number(form.dayNumber),
        title: form.title.trim(),
        description: form.description.trim(),
        level: form.level,
        topic: form.topic,
        videoFileName: form.videoFileName.trim(),
        externalVideoUrl: form.externalVideoUrl.trim(),
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder),
        quiz: form.quiz
          .filter(q => q.question.trim())
          .map(q => ({
            question: q.question.trim(),
            options: q.options.map(o => o.trim()).filter(Boolean),
            correctIndex: Number(q.correctIndex),
          })),
      };

      if (editingId) {
        await updateLesson(editingId, payload);
        setMessage('Lesson updated.');
      } else {
        await createLesson(payload);
        setMessage('Lesson created.');
      }
      closeModal();
      await loadLessons();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async lesson => {
    if (!window.confirm(`Delete lesson ${lesson.lessonCode} — ${lesson.title}?`)) return;
    setError('');
    try {
      await deleteLesson(lesson.id);
      setMessage('Lesson deleted.');
      await loadLessons();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const onPickVideo = () => fileInputRef.current?.click();

  const onVideoChange = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !editingId) return;

    setUploading(true);
    setError('');
    try {
      const data = await uploadLessonVideo(editingId, file);
      const fileName = String(data?.fileName ?? data?.lesson?.videoFileName ?? '').trim();
      setForm(prev => ({
        ...prev,
        videoFileName: fileName,
        externalVideoUrl: '',
      }));
      setMessage('Video uploaded to S3.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const previewUrl = videoPreviewUrl(form);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Lesson library</h2>
          <p className="mt-1 text-sm text-slate-400">
            {total} lessons in catalog (A0–C1). Edit content, quizzes, and upload videos per lesson.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Add lesson
        </button>
      </div>

      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mb-3 text-sm text-emerald-400">{message}</p> : null}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={levelFilter}
          onChange={e => {
            setLevelFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="">All levels</option>
          {LESSON_LEVELS.map(l => (
            <option key={l} value={l}>
              {l} — {LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
        <select
          value={topicFilter}
          onChange={e => {
            setTopicFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="">All topics</option>
          {LESSON_TOPICS.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
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
        <p className="text-slate-400">Loading lessons…</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="sticky top-0 bg-slate-900 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Quiz</th>
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No lessons match these filters.
                  </td>
                </tr>
              ) : (
                items.map(lesson => (
                  <tr key={lesson.id} className="hover:bg-slate-900/60">
                    <td className="px-4 py-3">{lesson.dayNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs">{lesson.lessonCode}</td>
                    <td className="max-w-xs truncate px-4 py-3">{lesson.title}</td>
                    <td className="px-4 py-3">{lesson.level}</td>
                    <td className="px-4 py-3 capitalize">{lesson.topic}</td>
                    <td className="px-4 py-3">{lesson.quiz?.length ?? 0}</td>
                    <td className={`px-4 py-3 text-xs font-medium ${videoStatusClass(lesson)}`}>
                      {videoStatusLabel(lesson)}
                    </td>
                    <td className="px-4 py-3">{lesson.isActive ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(lesson)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(lesson)}
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
          Page {page} of {totalPages}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-white">
              {editingId ? 'Edit lesson' : 'New lesson'}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-slate-400">Lesson code</span>
                <input
                  value={form.lessonCode}
                  onChange={e => setForm(f => ({ ...f, lessonCode: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="L001"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-400">Catalog order</span>
                <input
                  type="number"
                  min={1}
                  value={form.dayNumber}
                  onChange={e => setForm(f => ({ ...f, dayNumber: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
              </label>
              <label className="col-span-2 block text-sm">
                <span className="text-slate-400">Title</span>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
              </label>
              <label className="col-span-2 block text-sm">
                <span className="text-slate-400">Description</span>
                <textarea
                  rows={8}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs leading-relaxed text-white"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-400">Level</span>
                <select
                  value={form.level}
                  onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {LESSON_LEVELS.map(l => (
                    <option key={l} value={l}>
                      {l} — {LEVEL_LABELS[l]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-400">Topic</span>
                <select
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                >
                  {LESSON_TOPICS.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-400">Sort order</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
              </label>
              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                />
                Active (visible in app when lessons ship)
              </label>
              <label className="col-span-2 block text-sm">
                <span className="text-slate-400">External video URL (optional CDN link)</span>
                <input
                  value={form.externalVideoUrl}
                  onChange={e => setForm(f => ({ ...f, externalVideoUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="https://..."
                />
              </label>
              {form.videoFileName ? (
                <p className="col-span-2 text-xs text-slate-500">
                  S3 file: <span className="text-slate-300">{form.videoFileName}</span>
                </p>
              ) : null}
              {previewUrl ? (
                <div className="col-span-2">
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className="max-h-40 w-full rounded-lg bg-black"
                  />
                </div>
              ) : null}
              {editingId ? (
                <div className="col-span-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    className="hidden"
                    onChange={e => void onVideoChange(e)}
                  />
                  <button
                    type="button"
                    onClick={onPickVideo}
                    disabled={uploading}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600 disabled:opacity-60"
                  >
                    {uploading ? 'Uploading…' : 'Upload video to S3'}
                  </button>
                </div>
              ) : (
                <p className="col-span-2 text-xs text-slate-500">
                  Save the lesson first, then edit to upload an S3 video.
                </p>
              )}
            </div>

            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-white">Quiz (up to 3 questions)</h4>
              {form.quiz.map((q, qi) => (
                <div
                  key={qi}
                  className="mb-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4"
                >
                  <input
                    value={q.question}
                    onChange={e => {
                      const quiz = [...form.quiz];
                      quiz[qi] = { ...quiz[qi], question: e.target.value };
                      setForm(f => ({ ...f, quiz }));
                    }}
                    placeholder={`Question ${qi + 1}`}
                    className="mb-2 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  />
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="mb-1 flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctIndex === oi}
                        onChange={() => {
                          const quiz = [...form.quiz];
                          quiz[qi] = { ...quiz[qi], correctIndex: oi };
                          setForm(f => ({ ...f, quiz }));
                        }}
                      />
                      <input
                        value={opt}
                        onChange={e => {
                          const quiz = [...form.quiz];
                          const options = [...quiz[qi].options];
                          options[oi] = e.target.value;
                          quiz[qi] = { ...quiz[qi], options };
                          setForm(f => ({ ...f, quiz }));
                        }}
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onSave()}
                disabled={saving || uploading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
