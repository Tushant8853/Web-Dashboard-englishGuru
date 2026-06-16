import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Draggable from 'react-draggable';

import './onboarding-intake.css';

const SLOT_HEIGHT = 78;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function reorderList(list, fromIndex, toIndex) {
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((question, i) => ({ ...question, order: i + 1 }));
}

export function DraggablePlacementList({
  questions,
  onReorderEnd,
  onEdit,
  onDelete,
  dragDisabled = false,
}) {
  const [ordered, setOrdered] = useState(questions);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [dragResetKeys, setDragResetKeys] = useState({});
  const skipSyncRef = useRef(false);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    if (dragId || saving) return;
    setOrdered(questions);
  }, [questions, dragId, saving]);

  const dragIndex = dragId != null ? ordered.findIndex(q => q.id === dragId) : -1;

  const hoverIndex = useMemo(() => {
    if (dragIndex < 0) return -1;
    const shift = Math.round(dragY / SLOT_HEIGHT);
    return clamp(dragIndex + shift, 0, ordered.length - 1);
  }, [dragIndex, dragY, ordered.length]);

  const getSlotOffset = useCallback(
    index => {
      if (dragIndex < 0 || hoverIndex < 0 || dragIndex === hoverIndex) return 0;
      if (dragIndex < hoverIndex) {
        if (index > dragIndex && index <= hoverIndex) return -SLOT_HEIGHT;
      } else if (dragIndex > hoverIndex) {
        if (index >= hoverIndex && index < dragIndex) return SLOT_HEIGHT;
      }
      return 0;
    },
    [dragIndex, hoverIndex],
  );

  const bumpDragReset = id => {
    setDragResetKeys(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const persistReorder = async (nextOrder, previousOrder) => {
    setSaving(true);
    skipSyncRef.current = true;
    try {
      await onReorderEnd(nextOrder.map(q => q.id));
    } catch {
      setOrdered(previousOrder);
      skipSyncRef.current = false;
    } finally {
      setSaving(false);
    }
  };

  const onDragStart = id => {
    setDragId(id);
    setDragY(0);
  };

  const onDrag = (_e, data) => {
    setDragY(data.y);
  };

  const onDragStop = (_e, data) => {
    const from = dragIndex;
    const shift = Math.round(data.y / SLOT_HEIGHT);
    const to = from >= 0 ? clamp(from + shift, 0, ordered.length - 1) : from;
    const draggedId = dragId;

    setDragId(null);
    setDragY(0);

    if (draggedId) {
      bumpDragReset(draggedId);
    }

    if (from >= 0 && to >= 0 && from !== to) {
      const previous = ordered;
      const next = reorderList(ordered, from, to);
      setOrdered(next);
      persistReorder(next, previous);
    }
  };

  return (
    <div
      className={`intake-step-list ${saving || dragDisabled ? 'intake-list--locked' : ''}`}
      aria-busy={saving}
    >
      {ordered.map((question, index) => (
        <QuestionSlot
          key={question.id}
          question={question}
          index={index}
          dragKey={dragResetKeys[question.id] ?? 0}
          isDragging={dragId === question.id}
          isPlaceholder={dragId === question.id}
          slotOffset={dragId === question.id ? 0 : getSlotOffset(index)}
          disableDrag={saving || dragDisabled}
          onDragStart={() => onDragStart(question.id)}
          onDrag={onDrag}
          onDragStop={onDragStop}
          onEdit={() => onEdit(question)}
          onDelete={() => onDelete(question.id)}
        />
      ))}
    </div>
  );
}

function QuestionSlot({
  question,
  index,
  dragKey,
  isDragging,
  isPlaceholder,
  slotOffset,
  disableDrag,
  onDragStart,
  onDrag,
  onDragStop,
  onEdit,
  onDelete,
}) {
  const nodeRef = useRef(null);
  const preview = question.content?.en?.prompt?.trim() || '(empty)';
  const correct = question.correctOptionId ? `Answer: ${question.correctOptionId}` : null;
  const animateSlot = !isDragging && slotOffset === 0;

  return (
    <div
      className={`intake-step-slot ${isPlaceholder ? 'intake-step-slot--placeholder' : ''} ${
        animateSlot ? '' : 'intake-step-slot--no-transition'
      }`}
      style={{
        transform: slotOffset ? `translateY(${slotOffset}px)` : undefined,
      }}
    >
      <Draggable
        key={`${question.id}-${dragKey}`}
        nodeRef={nodeRef}
        axis="y"
        handle=".intake-drag-handle"
        cancel=".no-drag"
        disabled={disableDrag}
        defaultPosition={{ x: 0, y: 0 }}
        position={null}
        scale={1}
        onStart={onDragStart}
        onDrag={onDrag}
        onStop={onDragStop}
      >
        <div
          ref={nodeRef}
          className={`intake-step-card ${isDragging ? 'intake-step-card--dragging' : ''} ${
            !question.isActive ? 'intake-step-card--inactive' : ''
          }`}
        >
          <button
            type="button"
            className="intake-drag-handle"
            aria-label={`Drag question ${index + 1}`}
            tabIndex={disableDrag ? -1 : 0}
          >
            <span className="intake-drag-dot" />
            <span className="intake-drag-dot" />
            <span className="intake-drag-dot" />
          </button>

          <div className="intake-step-body">
            <div className="intake-step-meta">
              <span className="intake-step-num">{index + 1}</span>
              <span className="intake-type-pill">MCQ</span>
              {!question.isActive ? (
                <span className="intake-badge intake-badge--inactive">Inactive</span>
              ) : null}
            </div>
            <p className="intake-step-preview" title={preview}>
              {preview}
            </p>
            {correct ? (
              <p className="intake-step-snippet" title={correct}>
                {correct}
              </p>
            ) : null}
          </div>

          <div className="no-drag intake-step-actions">
            <button
              type="button"
              className="intake-btn intake-btn--small"
              onClick={onEdit}
              disabled={disableDrag}
            >
              Edit
            </button>
            <button
              type="button"
              className="intake-btn intake-btn--small intake-btn--danger"
              onClick={onDelete}
              disabled={disableDrag}
            >
              Remove
            </button>
          </div>
        </div>
      </Draggable>
    </div>
  );
}
