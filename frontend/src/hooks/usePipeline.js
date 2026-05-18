/**
 * src/hooks/usePipeline.js
 * All Chandra OCR pipeline state + side-effects in one place.
 *
 * Features:
 *  - Upload → process → SSE stream
 *  - SSE auto-retry with exponential backoff (max SSE_MAX_RETRIES)
 *  - Per-step duration timer
 *  - Excel blob download
 *  - Toast notifications
 *  - Full reset on clear
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  uploadFile,
  triggerProcessing,
  fetchResults,
  downloadExcel,
  sseUrl,
} from '../lib/apiClient';
import {
  makeInitialSteps,
  PIPELINE_STEPS,
  SSE_MAX_RETRIES,
  SSE_BASE_DELAY_MS,
} from '../config/constants';

// ── Toast factory ─────────────────────────────────────────────────────────────
let _toastId = 0;
const makeToast = (variant, title, message) => ({
  id: ++_toastId,
  variant,
  title,
  message,
});

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePipeline() {
  // ── File / job state ────────────────────────────────────────────────────────
  const [file, setFile]                   = useState(null);
  const [jobId, setJobId]                 = useState(null);
  const [status, setStatus]               = useState('idle');     // idle | running | completed | failed
  const [steps, setSteps]                 = useState(makeInitialSteps);

  // ── Async flags ─────────────────────────────────────────────────────────────
  const [isProcessing, setIsProcessing]   = useState(false);
  const [isExcelReady, setIsExcelReady]   = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // ── Results ─────────────────────────────────────────────────────────────────
  const [ocrResults, setOcrResults]       = useState(null);

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const [toasts, setToasts]               = useState([]);

  // ── Internal refs ───────────────────────────────────────────────────────────
  const stepTimerRef    = useRef(null);   // interval for the active step's duration clock
  const activeStepRef   = useRef(null);   // key of the step whose timer is running
  const sseRef          = useRef(null);   // current EventSource instance
  const sseRetryRef     = useRef(0);      // retry counter
  const pendingJobRef   = useRef(null);   // job_id captured for SSE retry closure
  const isDoneRef       = useRef(false);  // prevents retry after intentional close/completion

  // Cleanup timers/streams on unmount
  useEffect(() => {
    return () => {
      _stopStepTimer();
      _closeSse();
    };
  }, []);

  // ── Private helpers ─────────────────────────────────────────────────────────
  function _stopStepTimer() {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  }

  function _startStepTimer(stepKey) {
    _stopStepTimer();
    activeStepRef.current = stepKey;
    let seconds = 0;
    stepTimerRef.current = setInterval(() => {
      seconds += 1;
      setSteps(prev =>
        prev.map(s => (s.key === stepKey ? { ...s, duration: seconds } : s)),
      );
    }, 1_000);
  }

  function _closeSse() {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }

  function _markActiveStepFailed(description) {
    setSteps(prev =>
      prev.map(s =>
        s.key === activeStepRef.current
          ? { ...s, status: 'failed', description }
          : s,
      ),
    );
  }

  // ── Toast helpers ───────────────────────────────────────────────────────────
  const pushToast = useCallback((variant, title, message) => {
    setToasts(prev => [...prev, makeToast(variant, title, message)]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── SSE connection (with retry) ─────────────────────────────────────────────
  const _connectSSE = useCallback(
    (jobId) => {
      _closeSse();
      const es = new EventSource(sseUrl(jobId));
      sseRef.current = es;

      es.onmessage = (event) => {
        // Successful message → reset retry counter
        sseRetryRef.current = 0;

        const { step, status: stepStatus, message } = JSON.parse(event.data);

        setSteps(prevSteps =>
          prevSteps.map(s => {
            if (s.key === step) {
              if (stepStatus === 'running'   && activeStepRef.current !== step) _startStepTimer(step);
              if (stepStatus === 'completed' && activeStepRef.current === step) _stopStepTimer();
              return { ...s, status: stepStatus, description: message };
            }
            // Mark all preceding steps completed if we skipped ahead
            const curIdx  = PIPELINE_STEPS.findIndex(x => x.key === step);
            const thisIdx = PIPELINE_STEPS.findIndex(x => x.key === s.key);
            if (thisIdx < curIdx && s.status !== 'completed') return { ...s, status: 'completed' };
            return s;
          }),
        );

        // Pipeline finished
        if (step === 'excel' && stepStatus === 'completed' && message.includes('Finished')) {
          isDoneRef.current = true;
          _stopStepTimer();
          _closeSse();
          setIsProcessing(false);
          setStatus('completed');
          setIsExcelReady(true);
          // Fetch results and ignore error (non-blocking)
          fetchResults(jobId)
            .then(data => setOcrResults(data))
            .catch(err  => console.warn('[pipeline] fetchResults failed:', err.reason));
          pushToast('success', 'Pipeline Complete', 'Workbook is ready — click Download to save.');
        }
      };

      es.onerror = () => {
        es.close();
        sseRef.current = null;

        if (isDoneRef.current) return;

        if (sseRetryRef.current < SSE_MAX_RETRIES) {
          sseRetryRef.current += 1;
          const delay = Math.min(SSE_BASE_DELAY_MS * 2 ** sseRetryRef.current, 8_000);
          console.warn(
            `[pipeline] SSE error — retry ${sseRetryRef.current}/${SSE_MAX_RETRIES} in ${delay}ms`,
          );
          pushToast(
            'info',
            'Reconnecting…',
            `SSE disconnected. Attempt ${sseRetryRef.current} of ${SSE_MAX_RETRIES}.`,
          );
          setTimeout(() => _connectSSE(jobId), delay);
        } else {
          _stopStepTimer();
          _markActiveStepFailed('SSE stream failed after max retries.');
          setIsProcessing(false);
          setStatus('failed');
          pushToast('error', 'Stream Error', 'Connection lost after max retries. Check backend.');
        }
      };
    },
    [pushToast], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Public actions ──────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    isDoneRef.current = true;
    _stopStepTimer();
    _closeSse();
    sseRetryRef.current   = 0;
    pendingJobRef.current = null;
    activeStepRef.current = null;
    setFile(null);
    setJobId(null);
    setStatus('idle');
    setSteps(makeInitialSteps());
    setIsProcessing(false);
    setIsExcelReady(false);
    setIsDownloading(false);
    setOcrResults(null);
  }, []);

  const selectFile = useCallback(
    (f) => {
      reset();
      setFile(f);
    },
    [reset],
  );

  const startProcessing = useCallback(async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setStatus('running');
    setIsExcelReady(false);
    setOcrResults(null);
    setSteps(makeInitialSteps());
    sseRetryRef.current = 0;
    isDoneRef.current = false;

    try {
      const { job_id } = await uploadFile(file);
      setJobId(job_id);
      pendingJobRef.current = job_id;
      await triggerProcessing(job_id);
      _connectSSE(job_id);
    } catch (err) {
      _stopStepTimer();
      setIsProcessing(false);
      setStatus('failed');
      setSteps(prev =>
        prev.map((s, i) =>
          i === 0 ? { ...s, status: 'failed', description: err.reason ?? err.message } : s,
        ),
      );
      pushToast('error', 'Connection Failed', err.reason ?? 'Backend unreachable.');
    }
  }, [file, isProcessing, _connectSSE, pushToast]);

  const handleDownloadExcel = useCallback(async () => {
    if (!jobId || isDownloading) return;
    setIsDownloading(true);
    try {
      const fname = await downloadExcel(jobId);
      pushToast('success', 'Excel Downloaded', `Workbook saved as "${fname}"`);
    } catch (err) {
      pushToast('error', 'Download Failed', err.reason ?? err.message ?? 'Unknown error');
    } finally {
      setIsDownloading(false);
    }
  }, [jobId, isDownloading, pushToast]);

  // ── Exposed interface ───────────────────────────────────────────────────────
  return {
    // State
    file,
    jobId,
    status,
    steps,
    isProcessing,
    isExcelReady,
    isDownloading,
    ocrResults,
    toasts,
    // Actions
    selectFile,
    clearFile: reset,
    startProcessing,
    handleDownloadExcel,
    pushToast,
    dismissToast,
  };
}
