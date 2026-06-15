import { useEffect, useState } from 'react';

import { Toggle } from '../components/common/Toggle';
import { fetchOverview, updateChatUiConfig } from '../api/client';

export function ChatUiSettings() {
  const [showCall, setShowCall] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showMic, setShowMic] = useState(false);
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
          setShowCall(Boolean(overview.chatUiShowCall));
          setShowVoice(Boolean(overview.chatUiShowVoice));
          setShowMic(Boolean(overview.chatUiShowMic));
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
      await updateChatUiConfig({
        showCall,
        showVoice,
        showMic,
        showDeleteUser,
      });
      setMessage('Chat UI settings saved. Mobile app picks this up on next bootstrap.');
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
      <h2 className="mb-2 text-2xl font-bold text-white">Chat UI</h2>
      <p className="mb-8 text-sm text-slate-400">
        Remote flags for future chat features and Settings tab delete account. Changes apply after
        the app refreshes bootstrap (launch or foreground).
      </p>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-emerald-400">{message}</p> : null}

      <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/80">
        <div className="p-6">
          <Toggle
            label="Call icon"
            description="Reserved for future chat header."
            checked={showCall}
            onChange={setShowCall}
          />
        </div>
        <div className="p-6">
          <Toggle
            label="Voice / attach icon"
            description="Reserved for future message composer."
            checked={showVoice}
            onChange={setShowVoice}
          />
        </div>
        <div className="p-6">
          <Toggle
            label="Mic icon"
            description="Reserved for future message composer."
            checked={showMic}
            onChange={setShowMic}
          />
        </div>
        <div className="p-6">
          <Toggle
            label="Delete account (Settings)"
            description="Show Delete account on the mobile Settings tab."
            checked={showDeleteUser}
            onChange={setShowDeleteUser}
          />
        </div>
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
