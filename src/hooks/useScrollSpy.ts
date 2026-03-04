import { useState, useEffect, useCallback } from 'react';

interface UseScrollSpyOptions {
  sectionIds: string[];
  offset?: number;
}

export function useScrollSpy({ sectionIds, offset = 300 }: UseScrollSpyOptions): string {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] || '');

  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY + offset;

    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const element = document.getElementById(sectionIds[i]);
      if (element && element.offsetTop <= scrollPosition) {
        setActiveId(sectionIds[i]);
        return;
      }
    }

    setActiveId(sectionIds[0] || '');
  }, [sectionIds, offset]);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return activeId;
}
