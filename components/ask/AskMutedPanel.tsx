"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";

const GENERIC_SUGGESTIONS = ["How should I open on Tuesday?", "What might go wrong?", "Draft the one-pager"];

function suggestionsFor(personName: string | null): string[] {
  if (!personName) return GENERIC_SUGGESTIONS;
  return [
    `How should I approach my next meeting with ${personName}?`,
    `What might go wrong with ${personName}?`,
    `Draft a one-pager for working with ${personName}`,
  ];
}

type AssistantContent = {
  approach: string;
  expect: string[];
  avoid: string | null;
  watchYourself: string | null;
  basedOn: { noteId: string; createdAt: string; quote: string }[];
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string | AssistantContent;
};

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${expanded ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function parseAssistantContent(raw: string): string | AssistantContent {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.approach === "string") return parsed as AssistantContent;
  } catch {
    // older/plain-text message — render as-is
  }
  return raw;
}

function AssistantAnswer({ content }: { content: AssistantContent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-border-warm bg-cream-highlight p-4">
      <p className="text-[14.5px] leading-relaxed text-cocoa-body">{content.approach}</p>

      {content.expect.length > 0 && (
        <div className="mt-3">
          <p className="font-mono text-[10px] tracking-wide text-cocoa-quiet uppercase">Expect</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {content.expect.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-cocoa-body">
                <span aria-hidden className="mt-[8px] h-[4px] w-[4px] shrink-0 rounded-full bg-cocoa-faint" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.avoid && (
        <div className="mt-3">
          <p className="font-mono text-[10px] tracking-wide text-ochre uppercase">Avoid</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-cocoa-body">{content.avoid}</p>
        </div>
      )}

      {content.watchYourself && (
        <div className="mt-3">
          <p className="font-mono text-[10px] tracking-wide text-brass uppercase">Watch yourself</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-cocoa-body">{content.watchYourself}</p>
        </div>
      )}

      {content.basedOn.length > 0 && (
        <div className="mt-3 border-t border-border-warm pt-2.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 font-mono text-[10px] text-cocoa-quiet hover:text-cocoa-soft"
          >
            Based on {content.basedOn.length} note{content.basedOn.length === 1 ? "" : "s"}
            <ChevronIcon expanded={expanded} />
          </button>
          {expanded && (
            <div className="mt-2 flex flex-col gap-2">
              {content.basedOn.map((b) => (
                <div key={b.noteId} className="border-l border-border pl-3">
                  <p className="font-serif text-[13px] leading-relaxed text-cocoa-soft italic">&ldquo;{b.quote}&rdquo;</p>
                  <p className="mt-0.5 font-mono text-[10px] text-cocoa-quiet">
                    {new Date(b.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AskMutedPanel({
  onClose,
  personId = null,
}: {
  onClose?: () => void;
  /** The person whose profile this panel is currently scoped to, or null for
   * the general conversation shared by Lessons, /me, Home, and /ask. Passing
   * a different id (i.e. navigating to another person's page) resets the
   * panel to that person's own conversation — this is what stops Cayden's
   * thread from leaking onto Lydia's page or into Lessons. */
  personId?: string | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [personName, setPersonName] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Adjusting state during render (rather than in an effect body) when
  // personId changes — e.g. navigating from Cayden's page to Lydia's —
  // clears the previous person's messages immediately, before the fetch
  // below even starts, instead of briefly showing stale content.
  const [prevPersonId, setPrevPersonId] = useState(personId);
  if (personId !== prevPersonId) {
    setPrevPersonId(personId);
    setMessages([]);
    setPersonName(null);
    setLoadingHistory(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = personId ? `/api/ask?personId=${encodeURIComponent(personId)}` : "/api/ask";
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setPersonName(typeof data.personName === "string" ? data.personName : null);
          if (Array.isArray(data.messages)) {
            setMessages(
              data.messages.map((m: { id: string; role: "user" | "assistant"; content: string }) => ({
                id: m.id,
                role: m.role,
                content: m.role === "assistant" ? parseAssistantContent(m.content) : m.content,
              }))
            );
          }
        }
      } catch {
        // silent — the panel still works for sending a first message
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [personId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    setSending(true);
    setInput("");
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content: trimmed }]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, personId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.warning) {
        setError(data.warning);
        return;
      }
      if (data.message) {
        setMessages((prev) => [...prev, { id: data.message.id, role: "assistant", content: data.message.content }]);
      }
    } catch {
      setError("Couldn't reach Muted. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  async function startNewConversation() {
    if (sending) return;
    setError(null);
    setMessages([]);
    try {
      await fetch("/api/ask/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId }),
      });
    } catch {
      setError("Couldn't reach Muted. Check your connection and try again.");
    }
  }

  return (
    <div className="flex h-full flex-col bg-cream p-6">
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-cedar">
          <Logo size={18} />
        </span>
        <p className="font-mono text-[11px] tracking-[0.15em] text-cocoa-soft uppercase">
          Ask Muted{personName && <span className="normal-case tracking-normal"> · {personName}</span>}
        </p>
        <div className="ml-auto flex items-center gap-3">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={startNewConversation}
              className="font-mono text-[10px] tracking-wide text-cocoa-faint uppercase hover:text-cocoa-soft"
            >
              New conversation
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close" className="text-cocoa-faint hover:text-cocoa">
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="mt-5 flex-1 overflow-y-auto">
        {messages.length === 0 && !loadingHistory && (
          <p className="font-serif text-2xl leading-snug text-cocoa-body">
            {personName
              ? `Ask me anything about ${personName} — I only know what you have told me.`
              : "Ask me anything about the people you work with — I only know what you have told me."}
          </p>
        )}

        <div className="flex flex-col gap-4">
          {messages.map((m) =>
            m.role === "user" ? (
              <p key={m.id} className="self-end rounded-2xl bg-sage px-4 py-2.5 text-[14px] text-cedar-deep">
                {m.content as string}
              </p>
            ) : typeof m.content === "string" ? (
              <p key={m.id} className="text-[14.5px] leading-relaxed text-cocoa-body">
                {m.content}
              </p>
            ) : (
              <AssistantAnswer key={m.id} content={m.content} />
            )
          )}
          {sending && <p className="font-mono text-[11px] text-cocoa-faint">Muted is thinking…</p>}
        </div>
      </div>

      {error && <p className="mt-2 shrink-0 text-[13px] text-ochre">{error}</p>}

      {messages.length === 0 && (
        <div className="mt-4 flex shrink-0 flex-col gap-2.5">
          {suggestionsFor(personName).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={sending}
              className="w-fit rounded-full border border-border px-4 py-2 text-left text-[13.5px] text-cocoa-soft transition-colors hover:border-cedar hover:text-cocoa disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex shrink-0 items-end gap-2 rounded-2xl bg-sand px-4 py-2.5"
      >
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          disabled={sending}
          placeholder="Ask Muted anything…"
          rows={1}
          className="max-h-40 flex-1 resize-none bg-transparent py-1 text-sm text-cocoa placeholder:text-cocoa-faint disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cedar text-cream disabled:opacity-40"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
