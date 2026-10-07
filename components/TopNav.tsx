'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#vault', label: 'Dashboard' },
  { href: '#styles', label: 'Styles' },
];

export function TopNav() {
  const [stuck, setStuck] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastY = useRef(0);

  useEffect(() => {
    let queued = false;

    const apply = () => {
      queued = false;
      const y = window.scrollY;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);

      setStuck(y > 32);
      setProgress(Math.min(100, Math.max(0, (y / max) * 100)));
      // step out of the way on the way down, come straight back on the way up
      setHidden(y > lastY.current + 4 && y > window.innerHeight * 0.9);
      lastY.current = y;
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`nav-shell sticky top-0 z-50 ${hidden ? 'hide' : ''} ${stuck ? 'stuck' : ''}`}>
      <div className="glass-strong border-x-0 border-t-0">
        <nav className="section-shell flex h-16 items-center justify-between gap-4" aria-label="Main">
          <a href="#top" className="group flex items-center gap-3" data-cursor>
            <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-brand via-violet-bright to-blue-icon text-white shadow-glow">
              <span
                className="absolute -inset-1.5 animate-flash rounded-3xl bg-gradient-to-br from-violet-brand/40 to-blue-icon/20 blur-lg"
                aria-hidden
              />
              <Sparkles className="relative h-[18px] w-[18px]" aria-hidden />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[17px] font-semibold tracking-[-0.02em]">My Web Vault</span>
              <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                Web command center
              </span>
            </span>
          </a>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                data-cursor
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-ink-muted transition-all duration-200 hover:bg-black/[0.04] hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </div>

          <a href="#vault" className="btn-primary btn-liquid group" data-magnet data-cursor>
            Open Vault
            <ArrowDown className="h-4 w-4 animate-arrow-down" aria-hidden />
          </a>
        </nav>
        <span className="nav-progress" style={{ ['--sp' as string]: `${progress}%` }} aria-hidden />
      </div>
    </header>
  );
}
