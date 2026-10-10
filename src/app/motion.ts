export interface MotionSnapshot {
  paused: boolean;
  reducedMotion: boolean;
  hidden: boolean;
  motionEnabled: boolean;
}

const storageKey = 'blog-motion';
const listeners = new Set<() => void>();
const serverSnapshot: MotionSnapshot = { paused: false, reducedMotion: false, hidden: false, motionEnabled: false };
let hasSessionChoice = false;
let preference: MediaQueryList | undefined;

function readPreference(fallback = false): boolean {
  try { return window.localStorage.getItem(storageKey) === 'paused'; }
  catch { return fallback; }
}

let current: MotionSnapshot = { ...serverSnapshot, paused: typeof window === 'undefined' ? false : readPreference() };

function applyMotion(paused = current.paused) {
  const reducedMotion = preference?.matches ?? false;
  const hidden = document.visibilityState === 'hidden';
  const next = { paused, reducedMotion, hidden, motionEnabled: !paused && !reducedMotion && !hidden };
  document.documentElement.dataset.motion = next.motionEnabled ? 'playing' : 'paused';
  document.documentElement.dataset.motionHidden = String(hidden);
  if (Object.keys(next).every(key => current[key as keyof MotionSnapshot] === next[key as keyof MotionSnapshot])) return;
  current = next;
  listeners.forEach(listener => listener());
}

// Main pages and independent tool documents share the same persisted choice.
// System preferences and background visibility pause rendering without changing it.
if (typeof window !== 'undefined') {
  if (typeof window.matchMedia === 'function') {
    preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    preference.addEventListener('change', () => applyMotion());
  }
  applyMotion();
  document.addEventListener('visibilitychange', () => applyMotion());
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {
      hasSessionChoice = false;
      applyMotion(readPreference(current.paused));
    }
  });
  window.addEventListener('pageshow', () => applyMotion(hasSessionChoice ? current.paused : readPreference(current.paused)));
}

export function getMotionSnapshot(): MotionSnapshot { return current; }
export function getServerMotionSnapshot(): MotionSnapshot { return serverSnapshot; }
export function subscribeMotion(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function setMotionPaused(paused: boolean) {
  try {
    window.localStorage.setItem(storageKey, paused ? 'paused' : 'playing');
    hasSessionChoice = false;
  } catch { hasSessionChoice = true; }
  applyMotion(paused);
}
export function toggleMotion() { setMotionPaused(!current.paused); }
