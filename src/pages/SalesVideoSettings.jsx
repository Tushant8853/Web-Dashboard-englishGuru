import { useEffect, useRef, useState } from 'react';

import { Toggle } from '../components/common/Toggle';
import {
  fetchOverview,
  updateSalesVideoConfig,
  uploadSalesVideoFile,
} from '../api/client';
import { playbackUrlFromFileName } from '../utils/introVideoPlayback';

export function SalesVideoSettings() {
  const [enabled, setEnabled] = useState(false);
  const [videoFileName, setVideoFileName] = useState('');
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const overview = await fetchOverview();
        if (!cancelled) {
          setEnabled(Boolean(overview.salesVideoEnabled));
          const fileName = String(overview.salesVideoFileName ?? '').trim();
          setVideoFileName(fileName);
          setPlaybackUrl(
            String(overview.salesVideoUrl ?? '').trim() ||
              playbackUrlFromFileName(fileName),
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Load failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSaveSettings = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const data = await updateSalesVideoConfig({ enabled });
      const fileName = String(
        data?.appConfig?.salesVideo?.videoFileName ?? videoFileName,
      ).trim();
      setVideoFileName(fileName);
      setPlaybackUrl(
        String(data?.appConfig?.salesVideo?.videoUrl ?? '').trim() ||
          playbackUrlFromFileName(fileName),
      );
      setMessage('Sales video settings saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onClearVideo = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateSalesVideoConfig({ enabled, videoFileName: '' });
      setVideoFileName('');
      setPlaybackUrl('');
      setMessage('Sales video removed.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Clear failed');
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setMessage('');
    setError('');
    try {
      const data = await uploadSalesVideoFile(file);
      const fileName = String(
        data?.fileName ?? data?.appConfig?.salesVideo?.videoFileName ?? '',
      ).trim();
      setVideoFileName(fileName);
      setPlaybackUrl(
        String(data?.publicUrl ?? data?.appConfig?.salesVideo?.videoUrl ?? '').trim() ||
          playbackUrlFromFileName(fileName),
      );
      setMessage('Video uploaded. Stored file name: ' + (fileName || '(none)'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400">Loading settings…</p>;
  }

  return (
    <div className="max-w-2xl min-h-0 flex-1 overflow-y-auto">
      <h2 className="mb-2 text-2xl font-bold text-white">Sales video</h2>
      <p className="mb-8 text-sm text-slate-400">
        Stored for future paywall use on mobile. Backend + dashboard only in this phase.
      </p>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-emerald-400">{message}</p> : null}

      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <Toggle
          label="Sales video enabled"
          description="When paywall ships, this controls whether the sales clip appears."
          checked={enabled}
          onChange={setEnabled}
        />
      </div>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <h3 className="mb-2 text-sm font-semibold text-white">Current video</h3>
        {videoFileName ? (
          <>
            <p className="mb-1 text-xs text-slate-500">
              File name (MongoDB): <span className="text-slate-300">{videoFileName}</span>
            </p>
            {playbackUrl ? (
              <video
                key={playbackUrl}
                src={playbackUrl}
                controls
                playsInline
                className="mb-4 max-h-64 w-full rounded-lg bg-black"
              />
            ) : null}
          </>
        ) : (
          <p className="mb-4 text-sm text-slate-500">No video configured.</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          className="hidden"
          onChange={e => void onFileChange(e)}
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onPickFile}
            disabled={uploading || saving}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Upload new video'}
          </button>
          {videoFileName ? (
            <button
              type="button"
              onClick={() => void onClearVideo()}
              disabled={uploading || saving}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-60"
            >
              Remove video
            </button>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void onSaveSettings()}
        disabled={saving || uploading}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  );
}
