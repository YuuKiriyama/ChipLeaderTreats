const KEY = 'clt-theme';

export function getInitialTheme() {
  try {
    const s = localStorage.getItem(KEY);
    if (s === 'dark' || s === 'light') return s;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function persistTheme(mode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}
