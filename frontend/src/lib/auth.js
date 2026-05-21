/**
 * Demo auth utilities — client-side session only.
 * Credentials come from Vite env vars at build time (Vercel).
 */

export const AUTH_SESSION_KEY = 'billbot_auth_session';

export function isLocalEnvironment() {
  if (import.meta.env.DEV) return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export function requiresAuth() {
  return !isLocalEnvironment();
}

export function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isSessionValid() {
  return getSession()?.authenticated === true;
}

export function setSession() {
  localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({ authenticated: true, at: Date.now() }),
  );
}

export function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

export function validateCredentials(username, password) {
  const expectedUser = import.meta.env.VITE_DEMO_USERNAME;
  const expectedPass = import.meta.env.VITE_DEMO_PASSWORD;
  if (!expectedUser || !expectedPass) return false;
  return username === expectedUser && password === expectedPass;
}
