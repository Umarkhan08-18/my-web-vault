'use client';

import { ArrowUpRight, Command, Download, Lock, Search, Sparkles, Zap } from 'lucide-react';

import { useVault } from '@/components/VaultProvider';

export function BentoStats() {
  const { hydrated, stats, websites } = useVault();
  const domains = new Set(websites.map((w) => w.domain)).size;

  const numbers = [
    { label: 'Websites saved', value: stats.total, tint: 'text-violet-brand' },
    { label: 'Favorites', value: stats.favorites, tint: 'text-amber-500' },
    { label: 'Categories in use', value: stats.categories, tint: 'text-blue-icon' },
  ];

  return (
    <section id="overview" className="relative scroll-mt-24 py-14 sm:py-16">
      <div className="section-shell">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" data-rv="up">
          <div>
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5 text-violet-brand" aria-hidden />
              At a glance
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-[2.5rem]">
              A tidy control room for your browser
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-ink-muted">
            Six small ideas, one calm surface — no clutter, no learning curve, no login wall.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {/* Big live-stats tile */}
          <article
            data-spot
            data-cursor
            className="spot group relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift lg:col-span-2 lg:row-span-2"
            data-rv="up"
          >
            <div className="rainbow-stripe absolute inset-x-0 top-0 h-[3px]" aria-hidden />
            <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
            <div className="orb -right-10 -top-10 h-40 w-40 bg-violet-brand/15" aria-hidden />

            <div className="relative flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">Your vault, in numbers</h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>

            <div className="relative mt-8 grid grid-cols-3 gap-4">
              {numbers.map((item) => (
                <div key={item.label}>
                  <p className={`font-display text-4xl font-semibold tracking-[-0.03em] ${item.tint}`}>
                    {hydrated ? item.value : '—'}
                  </p>
                  <p className="mt-1.5 text-[12.5px] font-medium leading-tight text-ink-muted">{item.label}</p>
                </div>
              ))}
            </div>

            <p className="relative mt-8 text-[14px] leading-relaxed text-ink-muted">
              {hydrated && stats.total > 0 ? (
                <>
                  Spread across <span className="font-semibold text-ink">{domains}</span> unique{' '}
                  {domains === 1 ? 'domain' : 'domains'} — and every one of them is a single click away.
                </>
              ) : (
                <>Add your first website below and these numbers start moving immediately.</>
              )}
            </p>

            <div className="relative mt-8 flex flex-wrap gap-2">
              {['AI', 'Design', 'Development', 'Shopify', 'Research', 'Tools'].map((tag) => (
                <span key={tag} className="chip bg-black/[0.04] text-ink-muted">
                  {tag}
                </span>
              ))}
            </div>
          </article>

          {/* Small tiles */}
          <article
            data-spot
            data-cursor
            className="spot group relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            data-rv="up"
          >
            <div className="rainbow-ring" aria-hidden />
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-icon ring-1 ring-inset ring-blue-100 transition-shadow duration-300 group-hover:shadow-[0_0_26px_-6px_rgba(34,211,238,0.85)]">
              <Search className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-base font-semibold">Instant search</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
              Names, domains and notes — filtered as you type.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-2 py-1 font-mono text-[11px] text-ink-muted">
              <Command className="h-3 w-3" aria-hidden />K to focus
            </span>
          </article>

          <article
            data-spot
            data-cursor
            className="spot group relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            data-rv="up"
          >
            <div className="rainbow-ring" aria-hidden />
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-icon ring-1 ring-inset ring-blue-100">
              <Zap className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <h3 className="mt-4 flex items-center gap-1.5 font-display text-base font-semibold">
              One-click launch
              <ArrowUpRight className="h-4 w-4 animate-arrow-nudge text-violet-brand" aria-hidden />
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
              Tap a card — the site opens in a new tab, your vault stays put.
            </p>
          </article>

          <article
            data-spot
            data-cursor
            className="spot group relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            data-rv="up"
          >
            <div className="rainbow-ring" aria-hidden />
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-icon ring-1 ring-inset ring-blue-100">
              <Download className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-base font-semibold">
              <span aria-hidden>📦</span> Import &amp; export
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
              Your list stays yours — take it anywhere as JSON.
            </p>
          </article>

          <article
            data-spot
            data-cursor
            className="spot group relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            data-rv="up"
          >
            <div className="rainbow-ring" aria-hidden />
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-icon ring-1 ring-inset ring-blue-100">
              <Lock className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-base font-semibold">Private by default</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
              Saved in this browser’s localStorage. No account, no server, no sync.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
