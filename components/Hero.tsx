import { ArrowDown, Check, Command, Lock, Sparkles } from 'lucide-react';

import { AddWebsiteTrigger } from '@/components/AddWebsiteTrigger';
import { RevealWords } from '@/components/RevealWords';

const BULLETS = [
  'Save any site with a name and a URL — nothing else',
  'Search, filter and star your everyday tools in milliseconds',
  'Stored privately in your browser — no account, no tracking',
];

const PREVIEW_ROWS = [
  { letter: 'O', name: 'OpenAI', domain: 'openai.com', tag: 'AI', tint: 'from-emerald-400 to-teal-500' },
  { letter: 'F', name: 'Figma', domain: 'figma.com', tag: 'Design', tint: 'from-violet-brand to-fuchsia-500' },
  { letter: 'S', name: 'Shopify', domain: 'shopify.com', tag: 'Shopify', tint: 'from-lime-500 to-emerald-500' },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-14 sm:pt-20">
      {/* Background: dot grid + radial orbs */}
      <div className="dot-grid dot-grid-fade pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="orb -left-24 top-0 h-[380px] w-[380px] bg-violet-brand/20" aria-hidden />
      <div className="orb -right-16 top-24 h-[320px] w-[320px] bg-blue-icon/15" aria-hidden />
      <div className="orb bottom-0 left-1/3 h-[260px] w-[260px] bg-neon-pink/15" aria-hidden />

      <div className="section-shell relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        {/* ---------------- Left: messaging ---------------- */}
        <div>
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium text-ink" data-rv="fade">
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inset-0 animate-flash rounded-full bg-violet-brand/40 blur-[6px]" aria-hidden />
              <Sparkles className="relative h-4 w-4 text-violet-brand" aria-hidden />
            </span>
            Personal web command center
            <span className="ml-1 hidden items-center gap-1 rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-ink-muted sm:inline-flex">
              <Command className="h-3 w-3" aria-hidden />K
            </span>
          </span>

          <h1 className="mt-6 font-display text-[2.7rem] font-semibold leading-[1.03] tracking-[-0.035em] sm:text-6xl lg:text-[4.1rem]">
            <RevealWords text="Your Internet —" delayBase={140} />
            <br className="hidden sm:block" />{' '}
            <RevealWords text="Organized." className="rainbow-text" delayBase={420} step={90} />
          </h1>

          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-muted sm:text-lg" data-rv="up">
            <span className="text-ink/40 line-through decoration-ink/20 decoration-[1.5px]">
              It’s not another bookmark page.
            </span>{' '}
            <span className="font-semibold text-ink">It’s your personal web command center</span> — every site you
            actually use, one click away.
          </p>

          <ul className="mt-8 space-y-3">
            {BULLETS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] text-ink-soft" data-rv="up">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-icon ring-1 ring-inset ring-blue-100">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-3" data-rv="up">
            <a href="#vault" className="btn-gradient btn-liquid group px-5 py-3 text-[15px]" data-magnet data-cursor>
              Open My Vault
              <ArrowDown className="h-4 w-4 animate-arrow-down" aria-hidden />
            </a>
            <AddWebsiteTrigger label="Add your first site" className="btn-ghost btn-liquid px-5 py-3 text-[15px]" />
          </div>

          <p className="mt-6 flex items-center gap-2 text-[13px] text-ink-muted" data-rv="fade">
            <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            Everything stays on this device — no sign-up, no server, no sync surprises.
          </p>
        </div>

        {/* ---------------- Right: interface preview ---------------- */}
        <div className="relative" data-hero-fade="0.85">
          <div className="float-b float-pause">
            <div
              data-parallax="1.1"
              className="liquid relative overflow-hidden rounded-4xl border border-white/80 bg-gradient-to-br from-pastel-lavender/80 via-white to-pastel-sky/70 p-5 shadow-float"
            >
              <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
              <div className="relative">
                <div className="flex items-center justify-between pb-4">
                  <span className="font-display text-sm font-semibold">Your Web Vault</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted ring-1 ring-black/5">
                    Preview
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-white px-3 py-2.5 shadow-soft">
                  <Sparkles className="h-4 w-4 text-violet-brand" aria-hidden />
                  <span className="flex-1 truncate text-sm text-black/35">Search websites…</span>
                  <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
                    ⌘K
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {PREVIEW_ROWS.map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center gap-3 rounded-2xl border border-black/[0.05] bg-white/90 px-3 py-3 shadow-soft transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${row.tint} font-display text-sm font-bold text-white shadow-soft`}
                        aria-hidden
                      >
                        {row.letter}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{row.name}</span>
                        <span className="block truncate text-[12px] text-ink-muted">{row.domain}</span>
                      </span>
                      <span className="hidden rounded-full bg-pastel-lavender px-2.5 py-1 text-[11px] font-semibold text-violet-brand sm:block">
                        {row.tag}
                      </span>
                      <span className="text-ink/30">↗</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating glass chips — each one drifts on its own clock */}
          <div
            className="float-a float-pause absolute -bottom-6 -left-4 hidden sm:block"
            style={{ animationDelay: '1.1s' }}
            aria-hidden
          >
            <div
              data-parallax="1.9"
              className="glass flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] font-medium shadow-lift"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Opens in a new tab
            </div>
          </div>

          <div
            className="float-c float-pause absolute -right-3 top-8 hidden lg:block"
            style={{ animationDelay: '2.3s' }}
            aria-hidden
          >
            <div data-parallax="2.3" className="glass flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] font-medium shadow-lift">
              <span aria-hidden>⭐</span> Favorites first
            </div>
          </div>

          <div
            className="float-a float-pause absolute -left-8 top-1/2 hidden xl:block"
            style={{ animationDelay: '3.1s' }}
            aria-hidden
          >
            <div data-parallax="2.6" className="glass flex items-center gap-2 rounded-2xl px-3 py-2 text-[12px] font-medium shadow-lift">
              <span aria-hidden>⚡</span> One click
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
