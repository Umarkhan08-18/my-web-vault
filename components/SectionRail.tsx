'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'top', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'vault', label: 'Dashboard' },
  { id: 'overview', label: 'Insights' },
  { id: 'terminal', label: 'Shortcuts' },
  { id: 'styles', label: 'Styles' },
  { id: 'demo', label: 'Notes' },
];

/**
 * A fixed chapter rail. Deliberately desktop-only — on anything narrower the
 * right gutter belongs to the content, not to the furniture.
 */
export function SectionRail() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ratios = new Map<string, number>();
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => ratios.set(entry.target.id, entry.intersectionRatio));
        let best = 0;
        let bestRatio = -1;
        SECTIONS.forEach((section, index) => {
          const ratio = ratios.get(section.id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = index;
          }
        });
        if (bestRatio > 0) setActive(best);
      },
      { threshold: [0, 0.15, 0.35, 0.6, 0.85] },
    );

    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: el.offsetTop - 20, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <nav className="rail hidden xl:flex" aria-label="Sections">
      {SECTIONS.map((section, index) => (
        <button
          key={section.id}
          type="button"
          onClick={() => go(section.id)}
          title={section.label}
          aria-label={section.label}
          aria-current={active === index ? 'true' : undefined}
          className={active === index ? 'on' : undefined}
        >
          <i />
        </button>
      ))}
    </nav>
  );
}
