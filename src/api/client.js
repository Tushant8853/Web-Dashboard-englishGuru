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

export async function updateChatUiConfig({ showDeleteUser }) {
  const res = await api.put('/api/web-admin/chat-ui-config', {
    showDeleteUser,
  });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to update chat UI');
  }
  return json.data;
}

export async function updateIntakeOnboardingConfig({ enabled }) {
  const res = await api.put('/api/web-admin/intake-onboarding-config', { enabled });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to update intake onboarding');
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

export async function fetchLessons({ page = 1, pageSize = 20, level, topic, isActive } = {}) {
  const params = { page, pageSize };
  if (level) params.level = level;
  if (topic) params.topic = topic;
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    params.is_active = isActive;
  }
  const res = await api.get('/api/web-admin/lessons', { params });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to load lessons');
  }
  return json.data;
}

export async function fetchLesson(lessonId) {
  const res = await api.get(`/api/web-admin/lessons/${lessonId}`);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to load lesson');
  }
  return json.data.lesson;
}

export async function createLesson(payload) {
  const res = await api.post('/api/web-admin/lessons', payload);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to create lesson');
  }
  return json.data.lesson;
}

export async function updateLesson(lessonId, payload) {
  const res = await api.put(`/api/web-admin/lessons/${lessonId}`, payload);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to update lesson');
  }
  return json.data.lesson;
}

export async function deleteLesson(lessonId) {
  const res = await api.delete(`/api/web-admin/lessons/${lessonId}`);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to delete lesson');
  }
  return true;
}

export async function uploadLessonVideo(lessonId, file) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post(`/api/web-admin/lessons/${lessonId}/upload-video`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Upload failed');
  }
  return json.data;
}

export async function fetchIntakeQuestions() {
  const res = await api.get('/api/web-admin/intake-questions');
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to load intake questions');
  }
  return json.data;
}

export async function fetchIntakeQuestion(questionId) {
  const res = await api.get(`/api/web-admin/intake-questions/${questionId}`);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to load intake question');
  }
  return json.data.question;
}

export async function createIntakeQuestion(payload) {
  const res = await api.post('/api/web-admin/intake-questions', payload);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to create intake question');
  }
  return json.data.question;
}

export async function updateIntakeQuestion(questionId, payload) {
  const res = await api.put(`/api/web-admin/intake-questions/${questionId}`, payload);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to update intake question');
  }
  return json.data.question;
}

export async function deleteIntakeQuestion(questionId) {
  const res = await api.delete(`/api/web-admin/intake-questions/${questionId}`);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to delete intake question');
  }
  return true;
}

export async function reorderIntakeQuestions(orderedIds) {
  const res = await api.put('/api/web-admin/intake-questions/reorder', { orderedIds });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to reorder intake questions');
  }
  return json.data;
}

export async function fetchPlacementQuestions() {
  const res = await api.get('/api/web-admin/placement-questions');
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to load placement questions');
  }
  return json.data;
}

export async function createPlacementQuestion(payload) {
  const res = await api.post('/api/web-admin/placement-questions', payload);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to create placement question');
  }
  return json.data.question;
}

export async function updatePlacementQuestion(questionId, payload) {
  const res = await api.put(`/api/web-admin/placement-questions/${questionId}`, payload);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to update placement question');
  }
  return json.data.question;
}

export async function deletePlacementQuestion(questionId) {
  const res = await api.delete(`/api/web-admin/placement-questions/${questionId}`);
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to delete placement question');
  }
  return true;
}

export async function reorderPlacementQuestions(orderedIds) {
  const res = await api.put('/api/web-admin/placement-questions/reorder', { orderedIds });
  const json = res.data;
  if (!json?.success) {
    throw new Error(json?.message || 'Failed to reorder placement questions');
  }
  return json.data;
}
