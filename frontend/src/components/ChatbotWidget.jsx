// ============================================================
// FILE: frontend/src/components/ChatbotWidget.jsx
//       (REPLACE the existing file entirely)
// ============================================================

import { useEffect, useRef, useState } from "react";
import { useHRChatbot } from "./hooks/useHRChatbot";

// ─── tiny inline styles (no extra CSS file needed) ───────────
const S = {
  // Floating button
  fab: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    zIndex: 9999,
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 24px rgba(37,99,235,0.45)",
    transition: "transform 0.2s, box-shadow 0.2s",
    color: "#fff",
    fontSize: "24px",
  },
  badge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: "#ef4444",
    border: "2px solid #fff",
  },

  // Window
  window: {
    position: "fixed",
    bottom: "100px",
    right: "28px",
    zIndex: 9998,
    width: "370px",
    height: "560px",
    borderRadius: "20px",
    background: "#fff",
    boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'Segoe UI', sans-serif",
    border: "1px solid #e5e7eb",
    animation: "slideUp 0.25s ease",
  },

  // Header
  header: {
    background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexShrink: 0,
  },
  avatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  headerText: { flex: 1 },
  headerTitle: {
    color: "#fff",
    fontWeight: 700,
    fontSize: "15px",
    margin: 0,
    lineHeight: 1.2,
  },
  headerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "12px",
    margin: 0,
  },
  headerBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.8)",
    cursor: "pointer",
    fontSize: "18px",
    padding: "4px",
    borderRadius: "6px",
    lineHeight: 1,
  },

  // Quick chips
  chips: {
    padding: "10px 14px 0",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    flexShrink: 0,
  },
  chip: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "12px",
    color: "#2563eb",
    cursor: "pointer",
    transition: "background 0.15s",
    whiteSpace: "nowrap",
  },

  // Messages
  msgArea: {
    flex: 1,
    overflowY: "auto",
    padding: "14px 14px 4px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  msgRow: (role) => ({
    display: "flex",
    justifyContent: role === "user" ? "flex-end" : "flex-start",
    alignItems: "flex-end",
    gap: "8px",
  }),
  bubble: (role, isError) => ({
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius: role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    background: isError
      ? "#fef2f2"
      : role === "user"
      ? "linear-gradient(135deg, #2563eb, #1e40af)"
      : "#f3f4f6",
    color: role === "user" ? "#fff" : "#111827",
    fontSize: "14px",
    lineHeight: 1.55,
    wordBreak: "break-word",
    border: isError ? "1px solid #fecaca" : "none",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  }),
  botAva: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb, #1e40af)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    flexShrink: 0,
  },
  time: {
    fontSize: "10px",
    color: "#9ca3af",
    marginTop: "3px",
    textAlign: "right",
  },

  // Typing indicator
  typing: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 14px 6px",
  },
  dots: {
    display: "flex",
    gap: "4px",
    background: "#f3f4f6",
    padding: "8px 14px",
    borderRadius: "18px 18px 18px 4px",
  },

  // Input row
  inputRow: {
    padding: "12px 14px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
    flexShrink: 0,
    background: "#fff",
  },
  textarea: {
    flex: 1,
    border: "1.5px solid #d1d5db",
    borderRadius: "12px",
    padding: "9px 13px",
    fontSize: "14px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    maxHeight: "100px",
    lineHeight: 1.5,
    color: "#111827",
    transition: "border-color 0.15s",
  },
  sendBtn: (disabled) => ({
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: disabled
      ? "#d1d5db"
      : "linear-gradient(135deg, #2563eb, #1e40af)",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "18px",
    flexShrink: 0,
    transition: "background 0.15s",
  }),

  footer: {
    textAlign: "center",
    fontSize: "10px",
    color: "#9ca3af",
    paddingBottom: "8px",
  },
};

// keyframe injected once
if (typeof document !== "undefined" && !document.getElementById("hrbot-css")) {
  const style = document.createElement("style");
  style.id = "hrbot-css";
  style.textContent = `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes bounce {
      0%,80%,100% { transform: translateY(0); }
      40%         { transform: translateY(-5px); }
    }
    .hrbot-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #6b7280; animation: bounce 1.2s infinite;
    }
    .hrbot-dot:nth-child(2) { animation-delay: 0.15s; }
    .hrbot-dot:nth-child(3) { animation-delay: 0.30s; }
    .hrbot-chip:hover { background: #dbeafe !important; }
    .hrbot-fab:hover  { transform: scale(1.08); box-shadow: 0 6px 32px rgba(37,99,235,0.55) !important; }
    .hrbot-close:hover { color: #fff !important; background: rgba(255,255,255,0.15) !important; }
    .hrbot-send:hover:not(:disabled) { opacity: 0.88; }
    .hrbot-msgs::-webkit-scrollbar { width: 4px; }
    .hrbot-msgs::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
    .hrbot-textarea:focus { border-color: #2563eb !important; }
  `;
  document.head.appendChild(style);
}

const QUICK_QUESTIONS = [
  "My leave balance?",
  "Upcoming holidays?",
  "How to apply leave?",
  "Latest announcements?",
  "Reset my password?",
];

function fmtTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── component ────────────────────────────────────────────────
export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
    clearChat,
    handleKeyDown,
  } = useHRChatbot();

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus textarea when opened
  useEffect(() => {
    if (open) {
      setHasNew(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  const handleQuick = (q) => sendMessage(q);

  return (
    <>
      {/* ── Floating action button ── */}
      <button
        className="hrbot-fab"
        style={S.fab}
        onClick={() => setOpen((o) => !o)}
        title="HR Assistant"
      >
        {open ? "✕" : "💬"}
        {hasNew && !open && <span style={S.badge} />}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div style={S.window}>
          {/* Header */}
          <div style={S.header}>
            <div style={S.avatar}>🤖</div>
            <div style={S.headerText}>
              <p style={S.headerTitle}>HR Assistant</p>
              <p style={S.headerSub}>● Online — answers from your HR data</p>
            </div>
            <button
              className="hrbot-close"
              style={S.headerBtn}
              onClick={clearChat}
              title="Clear chat"
            >
              🗑
            </button>
            <button
              className="hrbot-close"
              style={S.headerBtn}
              onClick={() => setOpen(false)}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Quick question chips */}
          <div style={S.chips}>
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                className="hrbot-chip"
                style={S.chip}
                onClick={() => handleQuick(q)}
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="hrbot-msgs" style={S.msgArea}>
            {messages.map((msg) => (
              <div key={msg.id} style={S.msgRow(msg.role)}>
                {msg.role === "assistant" && (
                  <div style={S.botAva}>🤖</div>
                )}
                <div>
                  <div style={S.bubble(msg.role, msg.isError)}>
                    {/* Render newlines */}
                    {msg.content.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < msg.content.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                  <div style={S.time}>{fmtTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={S.typing}>
                <div style={S.botAva}>🤖</div>
                <div style={S.dots}>
                  <div className="hrbot-dot" />
                  <div className="hrbot-dot" />
                  <div className="hrbot-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div style={S.inputRow}>
            <textarea
              ref={textareaRef}
              className="hrbot-textarea"
              style={S.textarea}
              rows={1}
              placeholder="Ask about leaves, holidays, policies…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="hrbot-send"
              style={S.sendBtn(!input.trim() || isLoading)}
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              title="Send"
            >
              ➤
            </button>
          </div>

          <p style={S.footer}>Powered by AI · Uses your live HRMS data</p>
        </div>
      )}
    </>
  );
}
