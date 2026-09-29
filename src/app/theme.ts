export type Theme = 'dark' | 'light';
const storageKey = 'blog-theme';
const listeners = new Set<() => void>();

function readPreference(fallback: Theme = 'light'): Theme {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  }
  catch { return fallback; }
}

let current: Theme = typeof window === 'undefined' ? 'light' : readPreference();
let hasSessionChoice = false;

function applyTheme(theme: Theme) {
  const changed = current !== theme;
  current = theme;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#080b0c' : '#f7f8f3');
  if (changed) listeners.forEach(listener => listener());
}

// One store serves both React pages and the independent tool documents.
if (typeof window !== 'undefined') {
  applyTheme(current);
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {
      hasSessionChoice = false;
      applyTheme(readPreference(current));
    }
  });
  window.addEventListener('pageshow', () => applyTheme(hasSessionChoice ? current : readPreference(current)));
}

export function getTheme(): Theme { return current; }
export function getServerTheme(): Theme { return 'light'; }
export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function setTheme(theme: Theme) {
  // Persist first so another tab and back/forward navigation see the same choice.
  try {
    window.localStorage.setItem(storageKey, theme);
    hasSessionChoice = false;
  } catch { hasSessionChoice = true; }
  applyTheme(theme);
}
export function toggleTheme() { setTheme(current === 'dark' ? 'light' : 'dark'); }
