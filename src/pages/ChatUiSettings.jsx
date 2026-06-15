import { useEffect, useState } from 'react';

import { Toggle } from '../components/common/Toggle';
import { fetchOverview, updateChatUiConfig } from '../api/client';

export function ChatUiSettings() {
  const [showDeleteUser, setShowDeleteUser] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const overview = await fetchOverview();
        if (!cancelled) {
          setShowDeleteUser(Boolean(overview.chatUiShowDeleteUser));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateChatUiConfig({ showDeleteUser });
      setMessage('Settings saved. Mobile app picks this up on next bootstrap.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400">Loading settings…</p>;
  }

  return (
    <div className="max-w-lg min-h-0 flex-1 overflow-y-auto">
      <h2 className="mb-2 text-2xl font-bold text-white">Mobile settings</h2>
      <p className="mb-8 text-sm text-slate-400">
        Control whether Delete account appears on the mobile Settings tab. Changes apply after the
        app refreshes bootstrap (launch or foreground).
      </p>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-emerald-400">{message}</p> : null}

      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <Toggle
          label="Delete account"
          description="Show Delete account on the mobile Settings tab."
          checked={showDeleteUser}
          onChange={setShowDeleteUser}
        />
      </div>

      <button
        type="button"
        onClick={() => void onSave()}
        disabled={saving}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
