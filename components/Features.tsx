import { Bookmark, Check, Rocket, Tag } from 'lucide-react';

import { MaskLine } from '@/components/RevealWords';

const FEATURES = [
  {
    icon: Bookmark,
    emoji: '💾',
    title: 'Save',
    body: 'Drop in a name and a URL. Bad links get caught, missing “https://” gets fixed — the rest is automatic.',
    points: ['Smart URL validation', 'Instant auto-normalisation'],
    float: 'float-a',
    delay: '0s',
    tint: 'from-violet-brand/20 to-blue-icon/10',
  },
  {
    icon: Tag,
    emoji: '🗂️',
    title: 'Organize',
    body: 'Search across names, domains and notes. Group everything into categories you can rename or invent yourself.',
    points: ['Live search', 'Editable categories'],
    float: 'float-b',
    delay: '1.4s',
    tint: 'from-blue-icon/20 to-neon-cyan/10',
  },
  {
    icon: Rocket,
    emoji: '🚀',
    title: 'Launch',
    body: 'One click on a card and the site opens in a new tab — your vault stays exactly where you left it.',
    points: ['One-click launch', 'Keyboard friendly'],
    float: 'float-c',
    delay: '2.6s',
    tint: 'from-neon-pink/20 to-amber-400/10',
  },
];

export function Features() {
  return (
    <section id="features" className="relative scroll-mt-24 py-16 sm:py-20">
      <div className="section-shell">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow" data-rv="fade">
            Three steps, forever
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-[2.6rem]">
            <MaskLine>Save it once.</MaskLine>
            <MaskLine delay={110}>
              <span className="rainbow-text">Launch it forever.</span>
            </MaskLine>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-ink-muted" data-rv="up">
            No folders to babysit, no extensions to install — just a fast, private dashboard for the web you use every
            day.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, emoji, title, body, points, float, delay, tint }) => (
            <div key={title} className={`${float} float-pause`} style={{ animationDelay: delay }} data-rv="up">
              <article
                data-spot
                data-cursor
                className="spot group card-surface relative h-full overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift"
              >
                <div className="rainbow-ring" aria-hidden />
                <div className="sheen" aria-hidden />
                <div
                  className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${tint} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
                  aria-hidden
                />

                <div className="relative flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-icon ring-1 ring-inset ring-blue-100 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-xl" aria-hidden>
                    {emoji}
                  </span>
                  <h3 className="font-display text-lg font-semibold tracking-[-0.02em]">{title}</h3>
                </div>

                <p className="relative mt-4 text-[15px] leading-relaxed text-ink-muted">{body}</p>

                <ul className="relative mt-5 space-y-2">
                  {points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-[13.5px] font-medium text-ink-soft">
                      <Check className="h-4 w-4 shrink-0 text-blue-icon" strokeWidth={3} aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
