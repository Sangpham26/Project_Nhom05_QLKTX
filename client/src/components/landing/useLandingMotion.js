import { useEffect, useState } from 'react';

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer;
    const setup = () => {
      observer?.disconnect();
      root.classList.remove('dl-motion-ready');
      if (media.matches) return;
      try {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08 });
        root.querySelectorAll('[data-dl-reveal]').forEach((target) => {
          if (target.getBoundingClientRect().top < window.innerHeight) target.classList.add('is-revealed');
          else observer.observe(target);
        });
        root.classList.add('dl-motion-ready');
      } catch {
        observer?.disconnect();
        root.classList.remove('dl-motion-ready');
      }
    };
    setup();
    media.addEventListener('change', setup);
    return () => { observer?.disconnect(); media.removeEventListener('change', setup); root.classList.remove('dl-motion-ready'); };
  }, [rootRef]);
}

// Schedule at most one frame per scroll event, with no continuous React updates.
export function observeScroll(update) {
  let frame = 0;
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  schedule();
  return () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    if (frame) cancelAnimationFrame(frame);
  };
}
