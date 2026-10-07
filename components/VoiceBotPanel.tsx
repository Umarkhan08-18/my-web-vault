'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ArrowUpRight, BookmarkCheck, Bot, ChevronDown, Sparkles, Volume2, VolumeX, X } from 'lucide-react';

import { PromptInput } from '@/components/ui/ai-chat-input';
import {
  LIMITS,
  SCOPES,
  buildReply,
  starterPrompts,
  type BotReply,
  type Limit,
  type Scope,
  type Suggestion,
} from '@/lib/recommend';
import type { Website } from '@/lib/types';

/**
 * The open assistant: header, transcript and the prompt composer.
 *
 * It lives in its own module so `VoiceBot` can import it lazily — the curated
 * catalogue and the prompt composer only load once someone actually opens the
 * assistant, which keeps the landing page's first load small.
 */

export type BotMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'bot'; reply: BotReply };

export interface VoiceBotPanelProps {
  websites: Website[];
  messages: BotMessage[];
  muted: boolean;
  speaking: boolean;
  recordSignal: number;
  onCommit: (query: string, reply: BotReply) => void;
  onSpeak: (text: string) => void;
  onSave: (item: Suggestion) => void;
  isSaved: (item: Suggestion) => boolean;
  onMinimize: () => void;
  onClose: () => void;
  onToggleMuted: () => void;
  onVoiceUnavailable: (reason: string) => void;
}

export default function VoiceBotPanel({
  websites,
  messages,
  muted,
  speaking,
  recordSignal,
  onCommit,
  onSpeak,
  onSave,
  isSaved,
  onMinimize,
  onClose,
  onToggleMuted,
  onVoiceUnavailable,
}: VoiceBotPanelProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const starters = useMemo(() => starterPrompts(websites), [websites]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  const ask = (query: string, scope: Scope, limit: Limit) => {
    if (!query.trim()) return;
    // the answer is computed here, in the lazily-loaded chunk
    onCommit(query.trim(), buildReply(query, { websites, scope, limit }));
  };

  const handleSubmit = (value: string, meta: { model: string; effort: string; attachments: File[] }) => {
    const scope = (SCOPES as readonly string[]).includes(meta.model) ? (meta.model as Scope) : 'My Vault';
    const limit = (LIMITS as readonly string[]).includes(meta.effort) ? (meta.effort as Limit) : 'Top 3';
    ask(value, scope, limit);
  };

  const renderSuggestion = (item: Suggestion) => {
    const saved = isSaved(item);
    return (
      <article
        key={item.key}
        className="rounded-2xl border border-black/[0.07] bg-white p-3 shadow-soft transition-shadow duration-300 hover:shadow-lift"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-display text-[13px] font-semibold text-ink">{item.name}</h4>
            <p className="truncate text-[11px] text-ink-muted">{item.domain}</p>
          </div>
          <span className="chip shrink-0 border-violet-200/70 bg-pastel-lavender/70 text-[11px] text-violet-brand">
            {item.category}
          </span>
        </div>

        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{item.description}</p>

        {item.reasons.length > 0 && (
          <p className="mt-1.5 text-[11px] font-medium text-violet-brand">Why: {item.reasons.join(' · ')}</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor
            className="inline-flex h-7 items-center gap-1 rounded-full bg-ink px-2.5 text-[11px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
          >
            Open
            <ArrowUpRight className="h-3 w-3" aria-hidden />
          </a>

          {saved ? (
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-pastel-mint/70 px-2.5 text-[11px] font-semibold text-emerald-700">
              <BookmarkCheck className="h-3 w-3" aria-hidden />
              In your vault
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onSave(item)}
              data-cursor
              className="inline-flex h-7 items-center gap-1 rounded-full border border-violet-200 bg-white px-2.5 text-[11px] font-semibold text-violet-brand transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-brand hover:text-white"
            >
              <Sparkles className="h-3 w-3" aria-hidden />
              Save to vault
            </button>
          )}

          <button
            type="button"
            onClick={() => onSpeak(`${item.name}. ${item.category}. ${item.description}`)}
            data-cursor
            className="inline-flex h-7 items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 text-[11px] font-semibold text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:text-ink"
            aria-label={`Listen to a description of ${item.name}`}
          >
            <Volume2 className="h-3 w-3" aria-hidden />
            Listen
          </button>
        </div>
      </article>
    );
  };

  const renderMessage = (message: BotMessage) => {
    if (message.role === 'user') {
      return (
        <div key={message.id} className="flex justify-end">
          <p className="max-w-[85%] animate-pop-in rounded-2xl rounded-br-md bg-ink px-3 py-2 text-[13px] leading-relaxed text-white">
            {message.text}
          </p>
        </div>
      );
    }

    const { reply } = message;
    return (
      <div key={message.id} data-bot-reply={reply.kind} className="animate-pop-in space-y-2">
        <p className="font-display text-[13px] font-semibold text-ink">{reply.title}</p>
        <p className="text-[12px] leading-relaxed text-ink-muted">{reply.text}</p>
        {reply.verdict && (
          <p className="rounded-xl border border-violet-100 bg-pastel-lavender/50 px-2.5 py-2 text-[12px] font-medium text-violet-brand">
            {reply.verdict}
          </p>
        )}
        {reply.items.length > 0 && <div className="space-y-2 pt-0.5">{reply.items.map(renderSuggestion)}</div>}
      </div>
    );
  };

  return (
    <section
      role="region"
      aria-label="Vault Voice assistant"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && (event.target as HTMLElement)?.tagName !== 'TEXTAREA') onMinimize();
      }}
      className="fixed bottom-4 right-4 z-[85] flex max-h-[min(78vh,620px)] w-[min(92vw,380px)] animate-pop-in flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white/95 shadow-float backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 border-b border-black/[0.06] px-3 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-brand to-blue-icon text-white">
          <Bot className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[13px] font-semibold leading-tight text-ink">Vault Voice</p>
          <p className="truncate text-[11px] leading-tight text-ink-muted">
            {speaking ? 'Speaking…' : 'Ask for a site — I will recommend one'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleMuted}
          data-cursor
          aria-label={muted ? 'Turn voice replies on' : 'Turn voice replies off'}
          title={muted ? 'Voice replies off' : 'Voice replies on'}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 ${
            muted ? 'bg-black/5 text-ink-muted' : 'bg-pastel-lavender text-violet-brand'
          }`}
        >
          {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
        </button>

        <button
          type="button"
          onClick={onMinimize}
          data-cursor
          aria-label="Minimise assistant"
          title="Minimise"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-black/5 hover:text-ink"
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={onClose}
          data-cursor
          aria-label="Close assistant"
          title="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-black/5 hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div ref={logRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-black/[0.06] bg-pastel-lavender/40 p-3">
              <p className="font-display text-[13px] font-semibold text-ink">Ask me for a website</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                Name a site and I will tell you what it is. Describe what you need — “best design tools”,
                “something for SEO” — and I will recommend the strongest match, looking in your vault first.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {starters.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => ask(starter, 'My Vault', 'Top 3')}
                  data-cursor
                  className="rounded-full border border-black/10 bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-brand"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
      </div>

      <div className="border-t border-black/[0.06] bg-white/70 px-3 py-3">
        <PromptInput
          onSubmit={handleSubmit}
          onVoiceUnavailable={onVoiceUnavailable}
          startRecordingSignal={recordSignal}
          showAttachments={false}
          placeholder="Ask for a website…"
          models={[...SCOPES]}
          efforts={[...LIMITS]}
        />
      </div>
    </section>
  );
}
