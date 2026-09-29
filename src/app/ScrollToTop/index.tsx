import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      let target = hash.slice(1);
      try { target = decodeURIComponent(target); } catch { /* Keep a malformed hash harmless. */ }
      const el = document.getElementById(target);
      if (el) {
        const scrollToTarget = () => el.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' as ScrollBehavior : 'smooth',
        });
        scrollToTarget();

        const main = el.closest('main');
        // Earlier async sections can move this anchor after its first scroll.
        const hasPendingContent = () => main && Array.from(main.querySelectorAll('[aria-busy="true"]'))
          .some(section => Boolean(section.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
        if (!main || !hasPendingContent()) return;

        let active = true;
        const stop = () => {
          active = false;
          observer.disconnect();
          window.removeEventListener('wheel', stop);
          window.removeEventListener('touchstart', stop);
          window.removeEventListener('pointerdown', stop);
          window.removeEventListener('keydown', onKeyDown);
        };
        const onKeyDown = (event: KeyboardEvent) => {
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
            stop();
          }
        };
        const observer = new MutationObserver(() => {
          if (!active) return;
          if (!main.contains(el)) {
            stop();
          } else if (!hasPendingContent()) {
            scrollToTarget();
            stop();
          }
        });
        observer.observe(main, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-busy'] });
        // Once the user starts navigating the page, never pull them back.
        window.addEventListener('wheel', stop, { passive: true });
        window.addEventListener('touchstart', stop, { passive: true });
        window.addEventListener('pointerdown', stop, { passive: true });
        window.addEventListener('keydown', onKeyDown);
        return stop;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);

  return null;
}
