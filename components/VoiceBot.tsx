'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Bot, ChevronDown, Mic, Sparkles } from 'lucide-react';

import { useVault } from '@/components/VaultProvider';
import type { BotMessage } from '@/components/VoiceBotPanel';
import type { BotReply, Suggestion } from '@/lib/recommend';

/**
 * Vault Voice — the assistant that lives in the corner of the page.
 *
 * Three shapes, exactly as asked for:
 *   bar  → a docked “need help?” strip that appears once you start scrolling
 *   min  → shrinks to a single floating icon
 *   open → the composer plus a running conversation of recommendations
 *
 * The launcher stays tiny: the panel (and with it the curated catalogue and the
 * prompt composer) is imported only when someone opens the assistant.
 */

const VoiceBotPanel = dynamic(() => import('@/components/VoiceBotPanel'));

type Mode = 'bar' | 'min' | 'open';

const STORAGE_KEY = 'my-web-vault:voicebot';
const SCROLL_GATE = 480;

interface StoredBotState {
  mode: 'bar' | 'min';
  muted: boolean;
}

function readStored(): StoredBotState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mode: 'bar', muted: false };
    const parsed = JSON.parse(raw) as Partial<StoredBotState>;
    return { mode: parsed.mode === 'min' ? 'min' : 'bar', muted: parsed.muted === true };
  } catch {
    return { mode: 'bar', muted: false };
  }
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.03;
    utterance.pitch = 1;
    utterance.onerror = () => undefined;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* speaking is a nicety — never let it break the reply */
  }
}

function sameDomain(a: string, b: string): boolean {
  const clean = (value: string) =>
    value
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  return clean(a) === clean(b);
}

export function VoiceBot() {
  const { websites, addWebsite, notify } = useVault();

  // The server renders the docked shape; the saved shape is applied after
  // mount so the first client render still matches the server's HTML.
  const [mode, setMode] = useState<Mode>('bar');
  const [muted, setMuted] = useState(false);
  const [restored, setRestored] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [recordSignal, setRecordSignal] = useState(0);

  useEffect(() => {
    const stored = readStored();
    setMode(stored.mode);
    setMuted(stored.muted);
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return; // never clobber the saved value before it is read
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mode: mode === 'open' ? 'bar' : mode, muted }),
      );
    } catch {
      /* private mode — the bot still works, it just forgets its shape */
    }
  }, [mode, muted, restored]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setScrolled(window.scrollY > SCROLL_GATE);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(
    () => () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    [],
  );

  const isSaved = useCallback(
    (item: Suggestion) =>
      item.source === 'vault' || websites.some((website) => sameDomain(website.url, item.url)),
    [websites],
  );

  const commit = useCallback(
    (query: string, reply: BotReply) => {
      const at = Date.now();
      setMessages((prev) => [
        ...prev,
        { id: `u-${at}`, role: 'user', text: query },
        { id: `b-${at}`, role: 'bot', reply },
      ]);
      if (!muted) {
        setSpeaking(true);
        speakText(reply.spoken);
        window.setTimeout(() => setSpeaking(false), 1200);
      }
    },
    [muted],
  );

  const handleVoiceUnavailable = useCallback(
    (reason: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: 'bot',
          reply: { kind: 'empty', title: 'Voice input unavailable', text: reason, spoken: '', items: [] },
        },
      ]);
      notify(reason, 'info');
    },
    [notify],
  );

  const saveSuggestion = useCallback(
    (item: Suggestion) => {
      const result = addWebsite({
        name: item.name,
        url: item.url,
        category: item.category,
        description: item.description,
      });
      notify(result.ok ? `${item.name} saved to your vault` : result.error, result.ok ? 'success' : 'danger');
    },
    [addWebsite, notify],
  );

  const openPanel = useCallback((withVoice: boolean) => {
    setMode('open');
    if (withVoice) setRecordSignal((n) => n + 1);
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      if (!prev && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeaking(false);
      return !prev;
    });
  }, []);

  return (
    <>
      {mode === 'bar' && (
        <div
          className={`fixed bottom-4 right-4 z-[75] flex items-center gap-1 rounded-full border border-black/[0.06] bg-white/95 py-1 pl-2 pr-1 shadow-float backdrop-blur-xl transition-all duration-500 ${
            scrolled ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={() => openPanel(false)}
            data-cursor
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-left transition-colors duration-200 hover:bg-pastel-lavender/50"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-brand to-blue-icon text-white shadow-glow">
              <Bot className="h-4 w-4" aria-hidden />
              <span className="absolute inset-0 animate-pulse-ring rounded-full ring-2 ring-violet-brand/40" />
            </span>
            <span className="hidden sm:block">
              <span className="block text-[13px] font-semibold leading-tight text-ink">Need a hand?</span>
              <span className="block text-[11px] leading-tight text-ink-muted">Ask Vault Voice — type or speak</span>
            </span>
            <span className="block text-[13px] font-semibold leading-tight text-ink sm:hidden">Ask Vault Voice</span>
          </button>

          <button
            type="button"
            onClick={() => openPanel(true)}
            data-cursor
            aria-label="Ask by voice"
            title="Ask by voice"
            className="flex h-8 w-8 items-center justify-center rounded-full text-violet-brand transition-all duration-200 hover:bg-pastel-lavender hover:scale-105"
          >
            <Mic className="h-4 w-4" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => setMode('min')}
            data-cursor
            aria-label="Collapse assistant to an icon"
            title="Collapse to an icon"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-all duration-200 hover:bg-black/5 hover:text-ink"
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      {mode === 'min' && (
        <button
          type="button"
          onClick={() => setMode('open')}
          data-cursor
          aria-label="Open Vault Voice assistant"
          title="Open Vault Voice"
          className="group fixed bottom-4 right-4 z-[75] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-brand to-blue-icon text-white shadow-float transition-transform duration-300 ease-out hover:scale-105 active:scale-95"
        >
          <span className="absolute inset-0 animate-pulse-ring rounded-full ring-2 ring-violet-brand/40" />
          <Sparkles className="h-5 w-5" aria-hidden />
        </button>
      )}

      {mode === 'open' && (
        <VoiceBotPanel
          websites={websites}
          messages={messages}
          muted={muted}
          speaking={speaking}
          recordSignal={recordSignal}
          onCommit={commit}
          onSpeak={speakText}
          onSave={saveSuggestion}
          isSaved={isSaved}
          onMinimize={() => setMode('min')}
          onClose={() => setMode('bar')}
          onToggleMuted={toggleMuted}
          onVoiceUnavailable={handleVoiceUnavailable}
        />
      )}
    </>
  );
}
