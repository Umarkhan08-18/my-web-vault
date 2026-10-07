import { Quote } from 'lucide-react';

const QUOTES = [
  {
    quote: 'I stopped keeping forty tabs open. Everything I use lives in one board now.',
    name: 'Placeholder Persona',
    role: 'Fictional · sample copy',
    emoji: '🧑‍💻',
  },
  {
    quote: 'The categories are the whole thing for me — AI tools, design, stores, all separate.',
    name: 'Placeholder Persona',
    role: 'Fictional · sample copy',
    emoji: '🎨',
  },
  {
    quote: 'Search plus favorites means my morning routine is three clicks, not thirty.',
    name: 'Placeholder Persona',
    role: 'Fictional · sample copy',
    emoji: '🚀',
  },
];

export function DemoTestimonials() {
  return (
    <section id="demo" className="relative scroll-mt-24 py-14 sm:py-16">
      <div className="section-shell">
        <div
          className="mx-auto mb-8 max-w-2xl rounded-2xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-center"
          data-rv="fade"
        >
          <p className="text-[13px] font-medium text-amber-800">
            <span aria-hidden>🚧</span> Demo content — the quotes below are fictional placeholders written for layout
            purposes. They are not real customer reviews.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {QUOTES.map((item) => (
            <figure
              key={item.quote}
              data-spot
              className="spot group relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              data-rv="up"
            >
              <div className="rainbow-ring" aria-hidden />
              <span className="chip mb-4 bg-black/[0.05] text-ink-muted">Placeholder</span>
              <Quote className="h-5 w-5 text-violet-brand/40" aria-hidden />
              <blockquote className="mt-3 text-[15px] leading-relaxed text-ink-soft">“{item.quote}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-black/[0.06] pt-4">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pastel-lavender to-pastel-sky text-base"
                  aria-hidden
                >
                  {item.emoji}
                </span>
                <span className="leading-tight">
                  <span className="block text-[14px] font-semibold">{item.name}</span>
                  <span className="block text-[12px] text-ink-muted">{item.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
