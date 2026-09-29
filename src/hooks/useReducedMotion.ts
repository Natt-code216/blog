import { useEffect, useState } from 'react';

const query = '(prefers-reduced-motion: reduce)';

/** Follow system motion preferences, including changes while the page is open. */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const preference = window.matchMedia(query);
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener('change', updatePreference);

    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  return reducedMotion;
}
