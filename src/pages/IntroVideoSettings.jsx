import { useEffect, useRef, useState } from 'react';

import { Toggle } from '../components/common/Toggle';
import {
  fetchOverview,
  updateIntroVideoConfig,
  uploadIntroVideoFile,
} from '../api/client';
import { playbackUrlFromFileName } from '../utils/introVideoPlayback';

export function IntroVideoSettings() {
  const [enabled, setEnabled] = useState(true);
  const [showEveryLaunch, setShowEveryLaunch] = useState(false);
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
          setEnabled(Boolean(overview.introVideoEnabled));
          setShowEveryLaunch(Boolean(overview.introVideoShowEveryLaunch));
          const fileName = String(overview.introVideoFileName ?? '').trim();
          setVideoFileName(fileName);
          setPlaybackUrl(
            String(overview.introVideoUrl ?? '').trim() ||
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
      const data = await updateIntroVideoConfig({
        enabled,
        showEveryLaunch,
      });
      const fileName = String(
        data?.appConfig?.introVideo?.videoFileName ?? videoFileName,
      ).trim();
      setVideoFileName(fileName);
      setPlaybackUrl(
        String(data?.appConfig?.introVideo?.videoUrl ?? '').trim() ||
          playbackUrlFromFileName(fileName),
      );
      setMessage('Intro video settings saved.');
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
      await updateIntroVideoConfig({
        enabled,
        showEveryLaunch,
        videoFileName: '',
      });
      setVideoFileName('');
      setPlaybackUrl('');
      setMessage('Intro video removed.');
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
      const data = await uploadIntroVideoFile(file);
      const fileName = String(
        data?.fileName ?? data?.appConfig?.introVideo?.videoFileName ?? '',
      ).trim();
      setVideoFileName(fileName);
      setPlaybackUrl(
        String(data?.publicUrl ?? data?.appConfig?.introVideo?.videoUrl ?? '').trim() ||
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
      <h2 className="mb-2 text-2xl font-bold text-white">Intro video</h2>
      <p className="mb-8 text-sm text-slate-400">
        Upload stores a UUID file name in MongoDB. Mobile plays via CloudFront + file name.
      </p>

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-emerald-400">{message}</p> : null}

      <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/80">
        <div className="p-6">
          <Toggle
            label="Intro screen enabled"
            description="When off, new users skip straight to login."
            checked={enabled}
            onChange={setEnabled}
          />
        </div>
        <div className="p-6">
          <Toggle
            label="Show on every launch"
            description="When on, intro plays each cold start until the user taps Get started."
            checked={showEveryLaunch}
            onChange={setShowEveryLaunch}
          />
        </div>
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
              style={{ marginLeft: 0 }}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-60"
            >
              Remove video
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-slate-500">MP4, WebM, or MOV.</p>
      </div>

      <button
        type="button"
        onClick={() => void onSaveSettings()}
        disabled={saving || uploading}
        className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save toggles'}
      </button>
    </div>
  );
}
