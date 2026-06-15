import axios from 'axios';

import { clearAdminToken, getAdminToken } from '../utils/storage';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      clearAdminToken();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export async function adminLogin(username, password) {
  const res = await api.post('/api/web-admin/login', { username, password });
  const json = res.data;
  if (!json?.success || !json.data?.token) {
    throw new Error(json?.message || 'Login failed');
  }
  return json.data.token;
}

export async function fetchOverview() {
  const res = await api.get('/api/web-admin/overview');
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to load overview');
  }
  return json.data;
}

export async function updateChatUiConfig({
  showCall,
  showVoice,
  showMic,
  showDeleteUser,
}) {
  const res = await api.put('/api/web-admin/chat-ui-config', {
    showCall,
    showVoice,
    showMic,
    showDeleteUser,
  });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to update chat UI');
  }
  return json.data;
}

export async function updateIntroVideoConfig({
  enabled,
  showEveryLaunch,
  videoFileName,
}) {
  const res = await api.put('/api/web-admin/intro-video-config', {
    enabled,
    showEveryLaunch,
    videoFileName,
  });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to update intro video');
  }
  return json.data;
}

export async function uploadIntroVideoFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/api/web-admin/upload-intro-video', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Upload failed');
  }
  return json.data;
}

export async function updateSalesVideoConfig({ enabled, videoFileName }) {
  const res = await api.put('/api/web-admin/sales-video-config', {
    enabled,
    videoFileName,
  });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to update sales video');
  }
  return json.data;
}

export async function uploadSalesVideoFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/api/web-admin/upload-sales-video', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Upload failed');
  }
  return json.data;
}
