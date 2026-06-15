const DEFAULT_CDN = 'https://d1ta1qd8y4woyq.cloudfront.net';

export function assetBaseUrl() {
  const base = (import.meta.env.VITE_ASSET_BASE_URL || DEFAULT_CDN)
    .trim()
    .replace(/\/+$/, '');
  return base || DEFAULT_CDN;
}

export function playbackUrlFromFileName(fileName) {
  const f = String(fileName || '').trim().replace(/^\/+/, '');
  if (!f) return '';
  return `${assetBaseUrl()}/${encodeURIComponent(f)}`;
}
