import { Terminal } from 'lucide-react';

import { MaskLine } from '@/components/RevealWords';

const LINES: Array<{ text: string; tone: 'command' | 'output' | 'accent' }> = [
  { text: 'add --name "OpenAI" --url "https://openai.com" --category "AI"', tone: 'command' },
  { text: '✓ saved · normalized to https://openai.com/ · id 8f2a', tone: 'output' },
  { text: 'search "design"', tone: 'command' },
  { text: '✓ 3 results in 2ms — Figma, Dribbble, Coolors', tone: 'output' },
  { text: 'favorite --name "Figma"', tone: 'command' },
  { text: '★ moved to the top of your vault', tone: 'output' },
  { text: 'launch --name "OpenAI"', tone: 'command' },
  { text: '✓ opening https://openai.com in a new tab…', tone: 'accent' },
];

export function TerminalShowcase() {
  return (
    <section id="terminal" className="relative overflow-hidden scroll-mt-24 py-14 sm:py-16">
      <div className="section-shell grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div data-rv="up">
          <span className="eyebrow">
            <Terminal className="h-3.5 w-3.5 text-blue-icon" aria-hidden />
            Keyboard-first
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] sm:text-[2.5rem]">
            <MaskLine>Built for people who</MaskLine>
            <MaskLine delay={110}>
              <span className="rainbow-text">type faster than they click</span>
            </MaskLine>
          </h2>
          <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-ink-muted">
            Search is one keystroke away (<span className="font-mono text-[14px] text-ink">⌘K</span>), forms submit on
            Enter, and every dialog closes with Esc. The vault keeps up with your hands — no mouse marathon required.
          </p>
          <ul className="mt-6 space-y-2.5">
            {['⌘K / Ctrl+K — jump to search', 'Enter — save the form', 'Esc — close any dialog'].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[14.5px] text-ink-soft">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-icon ring-1 ring-inset ring-blue-100">
                  <span className="font-mono text-[11px] font-bold">⌘</span>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative terminal window */}
        <div className="relative" data-rv="up">
          <div className="orb -right-6 -top-6 h-32 w-32 bg-blue-icon/15" aria-hidden />
          <div
            data-parallax="0.5"
            className="relative overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-float"
          >
            <div className="rainbow-stripe h-[3px] w-full" aria-hidden />
            <div className="flex items-center gap-2 border-b border-black/[0.06] bg-black/[0.015] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-rose-400" aria-hidden />
              <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden />
              <span className="h-3 w-3 rounded-full bg-emerald-400" aria-hidden />
              <span className="ml-2 font-mono text-[12px] text-ink-muted">my-web-vault — zsh</span>
              <span className="ml-auto rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Preview
              </span>
            </div>

            <div className="space-y-2.5 px-5 py-6 font-mono text-[13.5px] leading-relaxed">
              {LINES.map((line, index) => (
                <p key={line.text} className="flex gap-2.5">
                  {line.tone === 'command' ? (
                    <>
                      <span className="shrink-0 text-blue-icon">➜</span>
                      <span className="text-ink">vault {line.text}</span>
                    </>
                  ) : (
                    <span
                      className={
                        line.tone === 'accent' ? 'text-violet-brand' : 'text-emerald-600'
                      }
                    >
                      {line.text}
                    </span>
                  )}
                  {index === LINES.length - 1 ? (
                    <span className="inline-block h-4 w-2 animate-blink bg-ink/70" aria-hidden />
                  ) : null}
                </p>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-[12.5px] text-ink-muted">
            Decorative preview — these commands illustrate the flow, they aren’t a real CLI.
          </p>
        </div>
      </div>
    </section>
  );
}
