import { ArrowRight, Check, Sparkles } from 'lucide-react';

import { MaskLine } from '@/components/RevealWords';

const TIERS = [
  {
    name: 'Minimal',
    emoji: '🗂️',
    label: 'Just the essentials',
    blurb: 'A single board of the sites you open every single day.',
    points: ['Name + URL only', 'Instant search', 'Favorites at the top'],
    featured: false,
  },
  {
    name: 'Curator',
    emoji: '⭐',
    label: 'Most used',
    blurb: 'Categories everywhere, with notes so future-you remembers why.',
    points: ['Editable categories', 'Descriptions & notes', 'Import / export JSON'],
    featured: true,
  },
  {
    name: 'Command Center',
    emoji: '🚀',
    label: 'Everything on',
    blurb: 'Keyboard-first, sorted by mood, ready to move between machines.',
    points: ['⌘K quick launch', 'Four sort modes', 'Portable JSON backup'],
    featured: false,
  },
];

export function WorkspaceTiers() {
  return (
    <section id="styles" className="relative scroll-mt-24 py-14 sm:py-16">
      <div className="dot-grid dot-grid-fade pointer-events-none absolute inset-x-0 top-0 h-72 opacity-40" aria-hidden />
      <div className="section-shell relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow" data-rv="fade">
            <Sparkles className="h-3.5 w-3.5 text-violet-brand" aria-hidden />
            Design demo
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-[2.5rem]">
            <MaskLine>Choose Your</MaskLine>
            <MaskLine delay={110}>
              <span className="rainbow-text">Workspace Style</span>
            </MaskLine>
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-muted">
            Three ways people keep a vault — this is a layout demo, not a checkout. My Web Vault is a personal tool and
            every feature below is already switched on.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TIERS.map((tier, index) => (
            <div
              key={tier.name}
              className={`${['float-a', 'float-b', 'float-c'][index]} float-pause`}
              style={{ animationDelay: `${index * 1.5}s` }}
              data-rv="up"
            >
            <article
              data-spot
              data-cursor
              className={`spot group relative h-full overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 ${
                tier.featured
                  ? 'bg-ink text-white shadow-float lg:-mt-4 lg:mb-[-1rem]'
                  : 'border border-black/[0.06] bg-white text-ink shadow-soft hover:shadow-lift'
              }`}
            >
              {tier.featured ? (
                <>
                  <div className="rainbow-stripe absolute inset-x-0 top-0 h-[3px]" aria-hidden />
                  <div className="orb -right-12 -top-12 h-40 w-40 bg-violet-bright/30" aria-hidden />
                </>
              ) : (
                <div className="rainbow-ring" aria-hidden />
              )}
              <div className="sheen" aria-hidden />

              <div className="relative flex items-center justify-between">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${
                    tier.featured ? 'bg-white/10 ring-1 ring-inset ring-white/15' : 'bg-blue-50 ring-1 ring-inset ring-blue-100'
                  }`}
                  aria-hidden
                >
                  {tier.emoji}
                </span>
                <span
                  className={`chip ${
                    tier.featured ? 'bg-white/15 text-white' : 'bg-pastel-lavender text-violet-brand'
                  }`}
                >
                  {tier.label}
                </span>
              </div>

              <h3 className="relative mt-5 font-display text-xl font-semibold tracking-[-0.02em]">{tier.name}</h3>
              <p className={`relative mt-2 text-[14.5px] leading-relaxed ${tier.featured ? 'text-white/65' : 'text-ink-muted'}`}>
                {tier.blurb}
              </p>

              <ul className="relative mt-6 space-y-2.5">
                {tier.points.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-[14px]">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        tier.featured ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-icon'
                      }`}
                    >
                      <Check className="h-3 w-3" strokeWidth={3.5} aria-hidden />
                    </span>
                    <span className={tier.featured ? 'text-white/85' : 'text-ink-soft'}>{point}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#vault"
                className={`relative mt-7 inline-flex items-center gap-1.5 py-1.5 text-[14px] font-semibold ${
                  tier.featured ? 'text-white' : 'text-violet-brand'
                }`}
              >
                Open the vault
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </a>
            </article>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-ink-muted" data-rv="fade">
          Illustrative section — nothing is for sale and no plan is required.
        </p>
      </div>
    </section>
  );
}
