"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { findBestTopic, FALLBACK_HTML } from "./grh-topics";

/**
 * GRH chat widget — ported from parkhouse.wales's vanilla JS into a React
 * client component with Tailwind styling.
 *
 * Architecture (mirrors parkhouse):
 *  - Floating action button bottom-right
 *  - Slide-up panel with header / messages / input / footer
 *  - Two-layer answering: instant local FAQ match (grh-topics.ts), then
 *    Anthropic-backed fallback via /api/chat for anything unmatched
 *  - Conversation persisted to sessionStorage for the current tab,
 *    expires after 4 h
 *  - Greeting + suggested-question chips on first open
 *  - Typing indicator, watchdog timeout, graceful error states
 *
 * Mounted globally in src/app/layout.tsx so it's available on every page.
 */

interface Message {
  role: "user" | "assistant";
  content: string; // user = plain text; assistant = HTML
}

const MAX_HISTORY = 12;
const SESSION_KEY = "grh-chat-session";
const SESSION_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours

const GREETING_HTML =
  "<p><strong>Hi — I'm the Get Real Health assistant.</strong></p>" +
  "<p>I help pharmacy owners and pharmacists with questions about our private PGD platform — pricing, services, onboarding, compliance.</p>" +
  "<p class=\"mt-2 text-xs text-gray-500\">Try one of these, or type your question:</p>" +
  "<div class=\"flex flex-wrap gap-2 mt-2\">" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"How much does it cost?\">Pricing</button>" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"What PGDs are included?\">PGD catalogue</button>" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"How do I get started?\">Onboarding</button>" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"How does GRH compare with Pharmacy First?\">vs Pharmacy First</button>" +
    "<button type=\"button\" class=\"chat-chip\" data-q=\"Tell me about your founders\">Who runs GRH</button>" +
  "</div>";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant" | "greeting"; html: string }[]>([]);
  const [input, setInput] = useState("");
  const [hasGreeted, setHasGreeted] = useState(false);

  const conversationRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Persistence ────────────────────────────────────────────
  const saveConversation = useCallback(() => {
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          conversation: conversationRef.current,
          messages,
          savedAt: Date.now(),
        }),
      );
    } catch {
      // sessionStorage may be unavailable; conversation continues in memory
    }
  }, [messages]);

  // Restore on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const data = JSON.parse(saved) as {
        conversation: Message[];
        messages: { role: "user" | "assistant" | "greeting"; html: string }[];
        savedAt: number;
      };
      if (!data || !Array.isArray(data.messages) || data.messages.length === 0) return;
      if (data.savedAt && Date.now() - data.savedAt > SESSION_EXPIRY_MS) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      conversationRef.current = data.conversation ?? [];
      setMessages(data.messages);
      setHasGreeted(true);
    } catch {
      // Ignore
    }
  }, []);

  // Save on change
  useEffect(() => {
    if (messages.length > 0) saveConversation();
  }, [messages, saveConversation]);

  // ── Greeting on first open ─────────────────────────────────
  useEffect(() => {
    if (open && !hasGreeted && messages.length === 0) {
      setMessages([{ role: "greeting", html: GREETING_HTML }]);
      setHasGreeted(true);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, hasGreeted, messages.length]);

  // ── Scroll to bottom on new messages ───────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  // ── ESC closes ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ── Chip-click handler (delegated via container click) ─────
  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    if (t?.classList?.contains("chat-chip")) {
      e.preventDefault();
      const q = t.getAttribute("data-q");
      if (q) submitMessage(q);
    }
  }, []);

  // ── Message submit ─────────────────────────────────────────
  function pushHistory(role: "user" | "assistant", html: string) {
    // Strip HTML for the LLM's view
    const div = document.createElement("div");
    div.innerHTML = html;
    const clean = (div.textContent || div.innerText || "").trim();
    if (!clean) return;
    conversationRef.current.push({ role, content: clean });
    if (conversationRef.current.length > MAX_HISTORY) {
      conversationRef.current = conversationRef.current.slice(-MAX_HISTORY);
    }
  }

  function safeSetBusy(b: boolean) {
    setBusy(b);
    if (!b) setInput("");
  }

  const submitMessage = useCallback(
    (textRaw: string) => {
      const text = (textRaw || "").trim();
      if (!text || busy) return;

      const userEntry: { role: "user"; html: string } = { role: "user", html: escapeHtml(text) };
      setMessages((m) => [...m, userEntry]);
      pushHistory("user", text);
      safeSetBusy(true);

      // Layer 1: local FAQ match
      const topic = findBestTopic(text);
      if (topic) {
        const delay = 320 + Math.min(text.length * 5, 500);
        setTimeout(() => {
          setMessages((m) => [...m, { role: "assistant", html: topic.answer }]);
          pushHistory("assistant", topic.answer);
          safeSetBusy(false);
        }, delay);
        return;
      }

      // Layer 2: LLM fallback via /api/chat
      // Hard watchdog: ensure input re-enables after 30s no matter what
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
      watchdogRef.current = setTimeout(() => safeSetBusy(false), 30000);

      fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: text,
          messages: conversationRef.current.slice(-MAX_HISTORY),
        }),
      })
        .then(async (res) => {
          const j = (await res.json().catch(() => ({}))) as { reply?: string };
          return { ok: res.ok, data: j };
        })
        .then(({ ok, data }) => {
          const reply = ok && data?.reply ? data.reply : "";
          if (reply) {
            const html = autoLink(reply);
            setMessages((m) => [...m, { role: "assistant", html }]);
            pushHistory("assistant", html);
          } else {
            setMessages((m) => [...m, { role: "assistant", html: FALLBACK_HTML }]);
          }
        })
        .catch(() => {
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              html:
                "<p>Sorry — I couldn't reach the assistant right now. Please try again in a moment, or <a href=\"/book\">book a discovery call</a>.</p>",
            },
          ]);
        })
        .finally(() => {
          if (watchdogRef.current) clearTimeout(watchdogRef.current);
          safeSetBusy(false);
        });
    },
    [busy],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(input);
  };

  const handleNewChat = () => {
    if (conversationRef.current.length === 0) return;
    if (!window.confirm("Start a new chat? Your current conversation will be cleared.")) return;
    conversationRef.current = [];
    setMessages([{ role: "greeting", html: GREETING_HTML }]);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="grh-chat-panel"
        aria-label="Open chat assistant"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 hover:-translate-y-0.5 transition-all text-sm font-semibold print:hidden"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        {open ? "Close" : "Ask a question"}
      </button>

      {/* Panel */}
      <aside
        id="grh-chat-panel"
        role="dialog"
        aria-label="Get Real Health assistant"
        className={`fixed bottom-24 right-5 z-50 w-[min(380px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-8rem))] bg-white rounded-2xl shadow-2xl border border-gray-200 flex-col overflow-hidden print:hidden ${open ? "flex" : "hidden"}`}
      >
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 bg-teal-600 text-white">
          <div className="flex-1 min-w-0">
            <strong className="block text-sm">Get Real Health Assistant</strong>
            <span className="block text-[11px] text-teal-100">Practical questions about the platform — not medical advice</span>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            aria-label="Start a new chat"
            title="Start a new chat"
            className="p-1 rounded hover:bg-teal-700 text-teal-100 hover:text-white transition-colors"
          >
            ↻
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="p-1 rounded hover:bg-teal-700 text-teal-100 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </header>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50"
          onClick={handleContainerClick}
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-teal-600 text-white rounded-tr-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                } [&_a]:underline [&_a]:text-teal-700 [&_a:hover]:text-teal-900 [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1.5 [&_li]:my-0.5 [&_.chat-chip]:inline-block [&_.chat-chip]:px-2.5 [&_.chat-chip]:py-1 [&_.chat-chip]:bg-teal-50 [&_.chat-chip]:text-teal-700 [&_.chat-chip]:text-xs [&_.chat-chip]:rounded-full [&_.chat-chip]:border [&_.chat-chip]:border-teal-200 [&_.chat-chip]:cursor-pointer [&_.chat-chip:hover]:bg-teal-100`}
                dangerouslySetInnerHTML={{ __html: m.html }}
              />
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2.5">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t border-gray-200 bg-white">
          <label htmlFor="grh-chat-input" className="sr-only">Your message</label>
          <input
            ref={inputRef}
            id="grh-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about pricing, PGDs, onboarding…"
            maxLength={500}
            disabled={busy}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="w-10 h-10 rounded-full bg-teal-600 hover:bg-teal-700 text-white inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1={22} y1={2} x2={11} y2={13} />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>

        {/* Footer */}
        <div className="px-3 py-2 text-[10px] text-gray-500 border-t border-gray-100 bg-white">
          Not medical advice. For emergencies call <a href="tel:999" className="underline">999</a>;
          {" "}out-of-hours <a href="tel:111" className="underline">111</a>.
        </div>
      </aside>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function escapeHtml(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML.replace(/\n/g, "<br>");
}

/**
 * Convert LLM output (Markdown / plain text / partial HTML) into safe HTML
 * with clickable links. Ported from parkhouse autoLink().
 */
function autoLink(html: string): string {
  if (!html) return "";
  const looksLikeHtml = /<(?:p|a|ul|ol|li|strong|em|b|i|br)\b/i.test(html);
  let out = html;
  if (!looksLikeHtml) {
    // Treat as Markdown — escape first
    out = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Paragraphs
    out = out
      .split(/\n\s*\n+/)
      .map((chunk) => (chunk.trim() ? `<p>${chunk.trim().replace(/\n/g, "<br>")}</p>` : ""))
      .filter(Boolean)
      .join("");
    // Bold
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Markdown links
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, url) => {
      const ok = /^(https?:|tel:|mailto:|\/|[a-z0-9_\-]+\.html|#)/i.test(url);
      const safe = ok ? url : "#";
      const ext = /^https?:/i.test(url) ? ' rel="noopener" target="_blank"' : "";
      return `<a href="${safe}"${ext}>${label}</a>`;
    });
    // Bare URLs
    out = out.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" rel="noopener" target="_blank">$2</a>');
  }
  // UK phone numbers → tel:
  out = out.replace(/(?<![">tel:0-9])\b(0\d{4})\s?(\d{3})\s?(\d{3})\b/g, (_m, a, b, c) => {
    const intl = "+44" + (a + b + c).substring(1);
    return `<a href="tel:${intl}">${a} ${b} ${c}</a>`;
  });
  return out;
}
