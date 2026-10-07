'use client';

import { useEffect } from 'react';

/**
 * One place for every decorative behaviour on the page:
 *
 *   · scroll reveals            [data-rv]  → .rv-in
 *   · pointer parallax          [data-parallax="0…2"]
 *   · magnetic controls         [data-magnet]
 *   · cursor spotlight          [data-spot]
 *   · the cursor                follows the pointer, grows over anything
 *                               matching a, button, [data-cursor]
 *   · hero stand-down           [data-hero-fade="0…1"]
 *
 * All of it is additive: nothing is required for the page to work, and
 * everything is skipped under prefers-reduced-motion.
 */
export function MotionLayer() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const teardown: Array<() => void> = [];

    /* ---------------------------------------------------- scroll reveals */
    const revealables = Array.from(document.querySelectorAll<HTMLElement>('[data-rv]'));

    // stagger siblings so a row of cards arrives as a row, not as a block
    const seen = new Map<Element, number>();
    revealables.forEach((el) => {
      const key = el.parentElement ?? el;
      const n = seen.get(key) ?? 0;
      seen.set(key, n + 1);
      if (n > 0) el.style.transitionDelay = `${Math.min(n, 6) * 85}ms`;
    });

    if (reduce) {
      revealables.forEach((el) => el.classList.add('rv-in'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('rv-in');
            io.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
      );
      revealables.forEach((el) => io.observe(el));
      teardown.push(() => io.disconnect());
    }

    /* --------------------------------------- pointer: cursor, parallax, magnets */
    if (fine && !reduce) {
      const dot = document.getElementById('cursor');
      const layers = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
      const heroes = Array.from(document.querySelectorAll<HTMLElement>('[data-hero-fade]'));

      let magnet: HTMLElement | null = null;
      const release = () => {
        if (!magnet) return;
        magnet.style.setProperty('--gx', '0px');
        magnet.style.setProperty('--gy', '0px');
        magnet = null;
      };

      let cx = window.innerWidth / 2;
      let cy = window.innerHeight / 2;
      let tx = cx;
      let ty = cy;
      let raf = 0;

      const tick = () => {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        if (dot) dot.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      teardown.push(() => cancelAnimationFrame(raf));

      const onMove = (event: PointerEvent) => {
        tx = event.clientX;
        ty = event.clientY;

        const nx = (event.clientX / window.innerWidth) * 2 - 1;
        const ny = (event.clientY / window.innerHeight) * 2 - 1;

        for (const el of layers) {
          const depth = parseFloat(el.dataset.parallax || '0') || 0;
          el.style.setProperty('--px', `${(-nx * 18 * depth).toFixed(2)}px`);
          el.style.setProperty('--py', `${(-ny * 13 * depth).toFixed(2)}px`);
        }

        const target = event.target as Element | null;
        if (dot) dot.classList.toggle('act', Boolean(target?.closest?.('a,button,[data-cursor]')));

        // a light source that follows the pointer across any [data-spot] surface
        const spot = target?.closest?.('[data-spot]') as HTMLElement | null;
        if (spot) {
          const r = spot.getBoundingClientRect();
          spot.style.setProperty('--mx', `${(event.clientX - r.left).toFixed(1)}px`);
          spot.style.setProperty('--my', `${(event.clientY - r.top).toFixed(1)}px`);
        }

        const next = (target?.closest?.('[data-magnet]') as HTMLElement | null) ?? null;
        if (next !== magnet) {
          release();
          magnet = next;
        }
        if (magnet) {
          const r = magnet.getBoundingClientRect();
          const gx = (event.clientX - (r.left + r.width / 2)) / (r.width / 2 || 1);
          const gy = (event.clientY - (r.top + r.height / 2)) / (r.height / 2 || 1);
          magnet.style.setProperty('--gx', `${(gx * 4).toFixed(2)}px`);
          magnet.style.setProperty('--gy', `${(gy * 3).toFixed(2)}px`);
        }
      };

      window.addEventListener('pointermove', onMove, { passive: true });
      teardown.push(() => window.removeEventListener('pointermove', onMove));
      teardown.push(release);

      /* ------------------------------------------------ hero stand-down */
      if (heroes.length) {
        let queued = false;
        const apply = () => {
          queued = false;
          const vh = window.innerHeight || 1;
          const t = Math.min(1, Math.max(0, window.scrollY / (vh * 0.62)));
          for (const el of heroes) {
            const depth = parseFloat(el.dataset.heroFade || '1') || 0;
            const local = Math.min(1, t * depth);
            el.style.opacity = (1 - local).toFixed(3);
            el.style.transform = `translate3d(0,${(-local * 44).toFixed(1)}px,0) scale(${(
              1 - local * 0.05
            ).toFixed(4)})`;
          }
        };
        const onScroll = () => {
          if (queued) return;
          queued = true;
          requestAnimationFrame(apply);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        apply();
        teardown.push(() => window.removeEventListener('scroll', onScroll));
        teardown.push(() => window.removeEventListener('resize', onScroll));
      }
    }

    return () => teardown.forEach((fn) => fn());
  }, []);

  return null;
}
