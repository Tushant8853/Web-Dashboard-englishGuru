import { useEffect, useState } from 'react';

import { fetchOverview } from '../api/client';

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const overview = await fetchOverview();
        if (!cancelled) setData(overview);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-slate-400">Loading overview…</p>;
  }

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <h2 className="mb-6 text-2xl font-bold text-white">Overview</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total users" value={data?.totalUsers ?? 0} />
        <StatCard label="Active users" value={data?.activeUsers ?? 0} />
        <StatCard label="Deleted users" value={data?.deletedUsers ?? 0} />
        <StatCard label="Suspended users" value={data?.suspendedUsers ?? 0} />
        <StatCard
          label="Onboarding completed"
          value={data?.onboardingCompletedUsers ?? 0}
        />
      </div>
    </div>
  );
}
