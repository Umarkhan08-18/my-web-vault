'use client';

import { useState } from 'react';
import { ArrowUpRight, Pencil, Star, Trash2 } from 'lucide-react';

import type { Website } from '@/lib/types';
import { faviconUrl } from '@/lib/url';

const GRADIENTS = [
  'from-violet-brand to-blue-icon',
  'from-blue-icon to-neon-cyan',
  'from-fuchsia-500 to-neon-pink',
  'from-emerald-500 to-neon-lime',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-fuchsia-500',
];

function gradientFor(seed: string): string {
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return GRADIENTS[sum % GRADIENTS.length];
}

function Favicon({ domain, name }: { domain: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const letter = (name.trim()[0] ?? domain[0] ?? '?').toUpperCase();

  if (failed || !domain) {
    return (
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradientFor(
          name || domain,
        )} font-display text-base font-bold text-white shadow-soft`}
        aria-hidden
      >
        {letter}
      </span>
    );
  }

  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-soft">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconUrl(domain)}
        alt=""
        width={28}
        height={28}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-7 w-7 object-contain"
      />
    </span>
  );
}

export interface WebsiteCardProps {
  website: Website;
  onEdit: (website: Website) => void;
  onDelete: (website: Website) => void;
  onToggleFavorite: (id: string) => void;
}

export function WebsiteCard({ website, onEdit, onDelete, onToggleFavorite }: WebsiteCardProps) {
  return (
    <article className="group relative h-full animate-pop-in">
      <div
        data-spot
        data-cursor
        className="spot card-surface relative flex h-full flex-col overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift"
      >
        <div className="rainbow-ring" aria-hidden />
        <div className="sheen" aria-hidden />
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-brand/15 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
        />

        {/* Card-wide link: makes the whole card clickable + keyboard focusable */}
        <a
          href={website.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-0 rounded-3xl"
          aria-label={`Open ${website.name} (${website.domain}) in a new tab`}
        />

        <div className="relative flex items-start gap-3.5">
          <Favicon domain={website.domain} name={website.name} />

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-[17px] font-semibold leading-tight tracking-[-0.01em]">
              {website.name}
            </h3>
            <p className="mt-1 truncate font-mono text-[12px] text-ink-muted">{website.domain}</p>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(website.id)}
            aria-pressed={website.favorite}
            aria-label={website.favorite ? `Remove ${website.name} from favorites` : `Add ${website.name} to favorites`}
            title={website.favorite ? 'Remove from favorites' : 'Add to favorites'}
            className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-white text-ink-muted transition-all duration-200 hover:scale-105 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
          >
            <Star
              className={`h-4 w-4 transition-transform duration-200 ${website.favorite ? 'scale-110' : ''}`}
              fill={website.favorite ? 'currentColor' : 'none'}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </div>

        {website.description ? (
          <p className="relative mt-4 line-clamp-2 text-[13.5px] leading-relaxed text-ink-muted">
            {website.description}
          </p>
        ) : null}

        <div className="relative mt-4 flex items-center gap-2">
          <span className="chip bg-pastel-lavender text-violet-brand">
            <span aria-hidden>#</span>
            {website.category}
          </span>
          {website.favorite ? <span className="chip bg-pastel-butter text-amber-700">Favorite</span> : null}
        </div>

        <div className="relative mt-auto flex items-center justify-between gap-2 pt-5">
          <a
            href={website.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[13.5px] font-semibold text-violet-brand transition-colors duration-200 hover:bg-violet-brand/[0.07]"
          >
            Open Website
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </a>

          <div className="relative z-10 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(website)}
              aria-label={`Edit ${website.name}`}
              title="Edit"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/[0.06] bg-white text-ink-muted transition-all duration-200 hover:border-black/15 hover:text-ink hover:shadow-soft"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDelete(website)}
              aria-label={`Delete ${website.name}`}
              title="Delete"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/[0.06] bg-white text-ink-muted transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:shadow-soft"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
