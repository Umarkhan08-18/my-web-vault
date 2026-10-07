import { Github, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative mt-8 border-t border-black/[0.06] bg-black/[0.015]">
      <div
        className="section-shell flex flex-col items-center gap-6 py-10 sm:flex-row sm:justify-between"
        data-rv="fade"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-brand via-violet-bright to-blue-icon text-white shadow-soft">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold">My Web Vault</p>
            <p className="text-[12.5px] text-ink-muted">Your internet — organized. Saved in this browser.</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13.5px] text-ink-muted" aria-label="Footer">
          <a href="#features" className="link-underline py-1.5 hover:text-ink">
            Features
          </a>
          <a href="#vault" className="link-underline py-1.5 hover:text-ink">
            Dashboard
          </a>
          <a href="#styles" className="link-underline py-1.5 hover:text-ink">
            Styles
          </a>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-medium ring-1 ring-black/[0.06]">
            <Github className="h-3.5 w-3.5" aria-hidden />
            Personal project
          </span>
        </nav>
      </div>
    </footer>
  );
}
