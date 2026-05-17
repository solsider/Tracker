import client from './client';
import type { Attachment } from '../types';

export const attachmentsApi = {
  list: (projectId: string, issueNumber: number) =>
    client
      .get<Attachment[]>(`/projects/${projectId}/issues/${issueNumber}/attachments`)
      .then((r) => r.data),

  upload: (
    projectId: string,
    issueNumber: number,
    file: File,
    onProgress?: (pct: number) => void,
  ) => {
    const form = new FormData();
    form.append('file', file);
    return client
      .post<Attachment>(
        `/projects/${projectId}/issues/${issueNumber}/attachments`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
          },
        },
      )
      .then((r) => r.data);
  },

  uploadMany: (
    projectId: string,
    issueNumber: number,
    files: File[],
    onProgress?: (pct: number) => void,
  ) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return client
      .post<Attachment[]>(
        `/projects/${projectId}/issues/${issueNumber}/attachments/multi`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
          },
        },
      )
      .then((r) => r.data);
  },

  delete: (id: string) => client.delete(`/attachments/${id}`).then((r) => r.data),

  downloadUrl: (id: string) => `/api/attachments/${id}/download`,

  triggerDownload: (id: string, filename: string) => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '';
    client
      .get(`/attachments/${id}/download`, {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((r) => {
        const url = URL.createObjectURL(r.data as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        // fallback: open in new tab
        window.open(`/attachments/${id}/download`, '_blank');
      });
  },
};
