// src/components/FloatingChat.js
// Floating chat bubble that appears on every page
import { useState, useRef, useEffect } from "react";
import { buildSystemPrompt, sendChatToServer } from "../pages/ChatbotAgent";

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 10,
    }}>
      {!isUser && (
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "var(--accent)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, flexShrink: 0, marginRight: 6, marginTop: 2,
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: "82%",
        padding: "8px 12px",
        borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        background: isUser ? "var(--accent)" : "var(--surface)",
        color: isUser ? "#fff" : "var(--text)",
        border: isUser ? "none" : "1px solid var(--border)",
        fontSize: 12,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
        {msg.loading && (
          <span style={{ display: "inline-flex", gap: 3, marginLeft: 5 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 4, height: 4, borderRadius: "50%",
                background: "var(--text3)", display: "inline-block",
                animation: `floatBounce 1s infinite ${i * 0.2}s`,
              }}/>
            ))}
          </span>
        )}
      </div>
      {isUser && (
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "var(--surface2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, flexShrink: 0, marginLeft: 6, marginTop: 2,
          border: "1px solid var(--border)",
        }}>👤</div>
      )}
    </div>
  );
}

export default function FloatingChat({ data, mlData, safetyStatus }) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! Ask me anything about the current sensor readings, safety status, or how to use this dashboard.",
    }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const messagesEndRef         = useRef(null);
  const inputRef               = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim() || loading) return;

    setMessages(prev => [...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: "", loading: true },
    ]);
    setInput("");
    setLoading(true);

    try {
      const conversationHistory = messages
        .filter(m => !m.loading)
        .map(m => ({ role: m.role, content: m.content }));
      conversationHistory.push({ role: "user", content: userMessage });

      const reply = await sendChatToServer(
        buildSystemPrompt(data, mlData, safetyStatus),
        conversationHistory
      );

      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        { role: "assistant", content: reply },
      ]);

      if (!open) setUnread(n => n + 1);
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        { role: "assistant", content: "Connection error. Make sure the proxy server is running." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Alert colour for the bubble
  const isAlert   = safetyStatus === "DANGER" || safetyStatus === "WARNING";
  const bubbleBg  = safetyStatus === "DANGER"  ? "var(--danger)"
                  : safetyStatus === "WARNING"  ? "var(--warn)"
                  : "var(--accent)";

  return (
    <>
      <style>{`
        @keyframes floatBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes floatIn     { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pulse-ring  { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.4);opacity:0} }
      `}</style>

      {/* Floating bubble button */}
      <div style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 1000,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8,
      }}>

        {/* Chat window */}
        {open && (
          <div style={{
            width: 360, height: 500,
            background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            animation: "floatIn 0.25s ease",
          }}>
            {/* Chat header */}
            <div style={{
              padding: "12px 16px",
              background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🤖</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                    AI Safety Assistant
                  </div>
                  
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: "rgba(255,255,255,0.2)", border: "none",
                color: "#fff", borderRadius: 6, padding: "4px 8px",
                cursor: "pointer", fontSize: 12,
              }}>✕</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              <div ref={messagesEndRef}/>
            </div>

            {/* Quick suggestions inside widget */}
            <div style={{
              padding: "6px 12px", borderTop: "1px solid var(--border)",
              display: "flex", gap: 6, overflowX: "auto",
            }}>
              {[
                "Current status?",
                "Gas level?",
                "Queue count?",
                "Any anomalies?",
              ].map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} disabled={loading} style={{
                  padding: "4px 10px", borderRadius: 12, whiteSpace: "nowrap",
                  border: "1px solid var(--border)", background: "var(--surface2)",
                  color: "var(--text2)", fontSize: 11, cursor: "pointer",
                  fontFamily: "var(--font)", flexShrink: 0,
                }}>{q}</button>
              ))}
            </div>

            {/* Input */}
            <div style={{
              padding: "10px 12px", borderTop: "1px solid var(--border)",
              display: "flex", gap: 8, alignItems: "center",
              background: "var(--surface)",
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={loading}
                style={{
                  flex: 1, border: "1px solid var(--border)",
                  borderRadius: 20, padding: "7px 12px", fontSize: 12,
                  fontFamily: "var(--font)", background: "var(--surface2)",
                  color: "var(--text)", outline: "none",
                }}
              />
              <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{
                width: 32, height: 32, borderRadius: "50%", border: "none",
                background: loading || !input.trim() ? "var(--border)" : "var(--accent)",
                color: "#fff", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>→</button>
            </div>
          </div>
        )}

        {/* Floating button */}
        <div style={{ position: "relative" }}>
          {/* Pulse ring when alert */}
          {isAlert && !open && (
            <div style={{
              position: "absolute", inset: -4,
              borderRadius: "50%", border: `2px solid ${bubbleBg}`,
              animation: "pulse-ring 1.5s infinite",
            }}/>
          )}

          <button onClick={() => setOpen(o => !o)} style={{
            width: 52, height: 52, borderRadius: "50%",
            background: bubbleBg, border: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            cursor: "pointer", fontSize: 22,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s, background 0.3s",
            transform: open ? "scale(0.9)" : "scale(1)",
          }}>
            {open ? "✕" : "🤖"}
          </button>

          {/* Unread badge */}
          {unread > 0 && !open && (
            <div style={{
              position: "absolute", top: -4, right: -4,
              width: 18, height: 18, borderRadius: "50%",
              background: "var(--danger)", color: "#fff",
              fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{unread}</div>
          )}
        </div>
      </div>
    </>
  );
}
