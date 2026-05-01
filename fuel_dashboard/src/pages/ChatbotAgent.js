// src/pages/ChatbotAgent.js
import { useState, useRef, useEffect } from "react";

// ── Suggested questions ───────────────────────────────────────────
const SUGGESTIONS = [
  "What is the current safety status?",
  "Is gas concentration at a dangerous level?",
  "What should I do if fire is detected?",
  "Explain the pressure sensor readings",
  "How many vehicles are in the queue?",
  "What does WARNING status mean?",
  "Are there any anomalies detected by ML?",
  "What is the gas trend prediction?",
  "Where can I see gas trends?",
  "How do I check fire zone status?",
];

// ── Message bubble ────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12,
      animation: "fadeIn 0.2s ease",
    }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "var(--accent)", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, flexShrink: 0, marginRight: 8, marginTop: 2,
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: "80%",
        padding: "9px 13px",
        borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? "var(--accent)" : "var(--surface)",
        color: isUser ? "#fff" : "var(--text)",
        border: isUser ? "none" : "1px solid var(--border)",
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
      }}>
        {msg.content}
        {msg.loading && (
          <span style={{ display: "inline-flex", gap: 3, marginLeft: 6 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "var(--text3)",
                display: "inline-block",
                animation: `bounce 1s infinite ${i * 0.2}s`,
              }}/>
            ))}
          </span>
        )}
      </div>
      {isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "var(--surface2)", color: "var(--text)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, flexShrink: 0, marginLeft: 8, marginTop: 2,
          border: "1px solid var(--border)",
        }}>👤</div>
      )}
    </div>
  );
}

// ── Shared system prompt builder ──────────────────────────────────
export function buildSystemPrompt(data, mlData, safetyStatus) {
  const gasPPM        = data?.gasPPM ?? 0;
  const gasLevel      = gasPPM > 5000 ? "DANGER" : gasPPM > 3000 ? "WARNING" : "SAFE";
  const pressurePct   = data?.pressurePct ?? 0;
  const pressureLevel = pressurePct > 100 ? "DANGER" : pressurePct > 37 ? "WARNING" : "SAFE";

return `You are an intelligent safety assistant for the Smart Fuel Station Monitoring and Safety Management System built for IT4021 at SLIIT by Group 2026_40.

DATASET INFORMATION:
- Dataset name: Smart Fuel Station IoT Sensor Dataset
- Total records collected: ${mlData?.totalRecordsAnalyzed?.toLocaleString() ?? '201,600'} sensor readings
- Collection period: 7 days of continuous monitoring at 3 second intervals
- Sensor ID: ESP32_001
- Variables recorded: gasPPM, pressureRaw, pressurePct, queueCount, fire, gasLeak, hour, dayOfWeek, sensorID, timestamp
- Gas PPM range in dataset: 300 to 9000 PPM
- Pressure range in dataset: 1000 to 1,200,000 raw units
- Queue count range: 0 to 15 vehicles
- Anomaly rate found by ML: ${mlData?.anomalyRate ?? 3.12}% of all readings
- Most common safety status: SAFE (approximately 80% of readings)
- Peak gas hours: 7am to 9am and 4pm to 7pm (rush hours)
- Dataset storage: Firebase Realtime Database — sensorHistory node
- Data collection method: ESP32 microcontroller via WiFi HTTPS to Firebase

CONVERSATION STYLE RULES — FOLLOW STRICTLY:
- Greetings like "hi", "hello", "hey", "how are you" → respond with ONLY this exact sentence: "Hello! How can I help you with the fuel station today?" — nothing else, no sensor data, no summaries.
- Simple yes/no questions → answer in 1 sentence maximum.
- Questions about a specific sensor → answer in 2 to 3 sentences only.
- Only give long detailed answers when the user explicitly asks for details, a report, or a full summary.
- Do NOT volunteer sensor data that was not asked about.

You have access to the following LIVE sensor data right now:

LIVE SENSOR READINGS:
- Fire detected: ${data?.fire ?? false}
- Gas leak confirmed: ${data?.gasLeak ?? false}
- Gas PPM: ${gasPPM} PPM
- Gas level: ${gasLevel}
- Pressure raw: ${data?.pressureRaw ?? 0}
- Pressure percentage: ${pressurePct}%
- Pressure level: ${pressureLevel}
- High pressure: ${data?.highPressure ?? false}
- Queue count: ${data?.queueCount ?? 0} vehicles
- Overall safety status: ${safetyStatus ?? "SAFE"}

MACHINE LEARNING INSIGHTS:
- Classifier accuracy: ${mlData?.classifierAccuracy ?? "Not available"}%
- Gas trend direction: ${mlData?.trendDirection ?? "Not available"}
- Predicted next gas PPM: ${mlData?.predictedNextGasPPM ?? "Not available"}
- Anomalies detected: ${mlData?.anomaliesDetected ?? "Not available"}
- Anomaly rate: ${mlData?.anomalyRate ?? "Not available"}%
- Most important sensor feature: ${mlData?.topFeature ?? "Not available"}
- Total records analyzed: ${mlData?.totalRecordsAnalyzed ?? "Not available"}
- Last ML analysis: ${mlData?.lastAnalyzed ?? "Not available"}

SYSTEM INFORMATION:
- Sensors: MQ-2 gas sensor (GPIO 13 DO, GPIO 34 AO), Flame sensor (GPIO 25), HX711 pressure sensor (GPIO 14 DT, GPIO 27 SCK), IR queue sensors (GPIO 18,19,32,33)
- Communication: ESP32 → WiFi → HTTPS → Firebase Realtime Database (Singapore region)
- Gas thresholds: SAFE = 0-3000 PPM, WARNING = 3000-5000 PPM, DANGER = above 5000 PPM
- Pressure thresholds: SAFE = 0-50000 raw, WARNING = 50000-300000 raw, DANGER = above 800000 raw
- Sand bucket suppression: servo at 0 degrees = hold, 90 degrees = deploy (triggered by fire)
- Automated response: buzzer + servo + DFPlayer voice alarm on fire/gas/pressure events

DASHBOARD NAVIGATION GUIDE:
The dashboard has 7 pages accessible from the left sidebar:
1. Overview — Overall station status banner, gas and pressure gauge charts, live sensor status list, recent readings table. Go here for a quick summary of all conditions.
2. Safety Monitoring — Trend charts for gas PPM over time, pressure trend, queue count trend, hazard events timeline. Go here to analyse patterns and historical changes.
3. Fire Detection — 6-zone station map where affected zones highlight in red, sand bucket suppression status per zone, recent fire events log. Go here to identify which zone has a fire.
4. Queue Monitor — Visual vehicle slot grid, station load percentage bar, queue history bar chart. Go here to monitor vehicle congestion and capacity.
5. Alerts and Reports — All system alerts with severity levels, filter by type, CSV export button. Go here to review incident history or generate reports.
6. ML Insights — 4 machine learning analysis results including classifier accuracy, anomaly detection, gas trend prediction, and sensor correlation heatmap. Go here to see AI-powered predictions.
7. AI Assistant — This chatbot page. Ask questions about any of the above pages or sensor data.

INSTRUCTIONS:
- Answer questions clearly and concisely based on the live data above
- If fire or gas danger is active give urgent safety advice first
- Explain sensor readings in simple non-technical language
- Reference the ML predictions when relevant
- Always direct users to the correct dashboard page when they ask where to find something
- For safety emergencies always recommend immediate evacuation and calling emergency services
- Keep responses focused and practical for fuel station staff and managers`;
}

// ── Chat message sender ───────────────────────────────────────────
export async function sendChatToServer(systemPrompt, messages) {
  const response = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system:   systemPrompt,
      messages: messages,
    }),
  });
  const result = await response.json();
  return result.content?.[0]?.text ?? "Sorry I could not get a response. Please try again.";
}

// ── Full page chatbot ─────────────────────────────────────────────
export default function ChatbotAgent({ data, mlData, safetyStatus, history }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your Smart Fuel Station AI assistant. I have access to all live sensor readings, ML analysis results, and historical data. Ask me anything about the current safety status, sensor readings, trends, or what actions to take.",
    }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef         = useRef(null);
  const inputRef               = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        { role: "assistant", content: "Connection error. Make sure the proxy server is running on port 3001." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const statusColor = safetyStatus === "SAFE"   ? "var(--safe)"
                    : safetyStatus === "WARNING" ? "var(--warn)"
                    : "var(--danger)";
  const statusBg    = safetyStatus === "SAFE"   ? "var(--safe-bg)"
                    : safetyStatus === "WARNING" ? "var(--warn-bg)"
                    : "var(--danger-bg)";

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
          AI Safety Assistant
        </h2>
        <p style={{ fontSize: 13, color: "var(--text3)" }}>
          Ask questions about live sensor data, ML insights, safety status, and recommended actions
        </p>
      </div>

      {/* Live context bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "Status",   value: safetyStatus ?? "SAFE",              color: statusColor,      bg: statusBg },
          { label: "Gas PPM",  value: `${data?.gasPPM ?? 0} PPM`,          color: "var(--text)",    bg: "var(--surface2)" },
          { label: "Pressure", value: `${data?.pressurePct ?? 0}%`,         color: "var(--text)",    bg: "var(--surface2)" },
          { label: "Queue",    value: `${data?.queueCount ?? 0} vehicles`,  color: "var(--text)",    bg: "var(--surface2)" },
          { label: "ML Trend", value: mlData?.trendDirection ?? "N/A",      color: "var(--text)",    bg: "var(--surface2)" },
        ].map((item, i) => (
          <div key={i} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 11,
            background: item.bg, border: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ color: "var(--text3)", fontWeight: 500 }}>{item.label}:</span>
            <span style={{ color: item.color, fontWeight: 700, fontFamily: "var(--mono)" }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Main chat area */}
      <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>

        {/* Messages panel */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
            <div ref={messagesEndRef}/>
          </div>

          <div style={{
            borderTop: "1px solid var(--border)", padding: "12px 16px",
            display: "flex", gap: 10, alignItems: "flex-end",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about sensor readings, safety status, ML predictions..."
              disabled={loading}
              rows={1}
              style={{
                flex: 1, resize: "none", border: "1px solid var(--border)",
                borderRadius: 10, padding: "9px 12px", fontSize: 13,
                fontFamily: "var(--font)", background: "var(--surface2)",
                color: "var(--text)", outline: "none", lineHeight: 1.5,
              }}
            />
            <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{
              padding: "9px 18px", borderRadius: 10, border: "none",
              background: loading || !input.trim() ? "var(--border)" : "var(--accent)",
              color: loading || !input.trim() ? "var(--text3)" : "#fff",
              fontSize: 13, fontWeight: 600,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontFamily: "var(--font)", transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>

        {/* Suggestions panel */}
        <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)",
            textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Suggested questions
          </div>
          {SUGGESTIONS.map((q, i) => (
            <button key={i} onClick={() => sendMessage(q)} disabled={loading} style={{
              padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--surface)", color: "var(--text2)",
              fontSize: 12, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "var(--font)", textAlign: "left", lineHeight: 1.4,
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (!loading) { e.target.style.borderColor = "var(--accent)"; e.target.style.color = "var(--accent)"; }}}
              onMouseLeave={e => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text2)"; }}
            >{q}</button>
          ))}
          <button onClick={() => setMessages([{ role: "assistant", content: "Hello! I am your Smart Fuel Station AI assistant. Ask me anything about the current safety status, sensor readings, trends, or what actions to take." }])}
            style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text3)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font)" }}>
            Clear conversation
          </button>
        </div>
      </div>
    </div>
  );
}
