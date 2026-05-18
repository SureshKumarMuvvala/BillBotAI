/**
 * src/lib/apiClient.js
 * Centralised Axios instance + all API method wrappers.
 * All components should import from here — never call axios directly.
 */

import axios from 'axios';
import { API_BASE_URL, DEMO_FILE_NAME, DEMO_FILE_SIZE } from '../config/constants';

// ── Axios instance ────────────────────────────────────────────────────────────
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
});

// Response interceptor — normalise error shape
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ??
      err.response?.data?.message ??
      err.message ??
      'An unexpected error occurred.';
    // Attach a normalised `.reason` so callers don't need to inspect shape
    err.reason = message;
    return Promise.reject(err);
  },
);

// ── Endpoint wrappers ─────────────────────────────────────────────────────────

/**
 * Upload an invoice file (or a demo blob) and receive a job_id.
 * @param {File} file
 * @returns {Promise<{ job_id: string, filename: string, status: string }>}
 */
export async function uploadFile(file) {
  const formData = new FormData();

  // Demo mode: file object is a sentinel without real bytes
  if (file.name === DEMO_FILE_NAME && file.size === DEMO_FILE_SIZE) {
    formData.append(
      'file',
      new Blob(['demo content'], { type: 'application/pdf' }),
      file.name,
    );
  } else {
    formData.append('file', file);
  }

  const { data } = await http.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/**
 * Transition a job into "processing" state.
 * @param {string} jobId
 */
export async function triggerProcessing(jobId) {
  const { data } = await http.post(`/process/${jobId}`);
  return data;
}

/**
 * Fetch structured OCR results for a completed job.
 * @param {string} jobId
 * @returns {Promise<object>}
 */
export async function fetchResults(jobId) {
  const { data } = await http.get(`/results/${jobId}`);
  return data;
}

/**
 * Download the openpyxl workbook as a Blob and trigger a browser save dialog.
 * @param {string} jobId
 * @returns {Promise<string>} resolved filename
 */
export async function downloadExcel(jobId) {
  const res = await http.get(`/download/${jobId}`, {
    responseType: 'blob',
    timeout: 60_000,
  });

  const disposition = res.headers['content-disposition'] ?? '';
  const match       = disposition.match(/filename=([^\s;]+)/);
  const fname       = match ? match[1] : `chandra_ocr_${jobId.slice(0, 8)}.xlsx`;

  const url  = URL.createObjectURL(
    new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', fname);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return fname;
}

/**
 * Build the SSE URL for a given job.
 * @param {string} jobId
 * @returns {string}
 */
export function sseUrl(jobId) {
  return `${API_BASE_URL}/progress/${jobId}`;
}

export default http;
