import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const BRANCHES = ["AJA", "IDIMU", "KETU"];
const RIDERS = {
  AJA: ["Akin", "Promise", "Samuel", "Uziah", "Precious", "Mr Omotayo"],
  IDIMU: [
    "Abbey", "Abosede", "Tosin", "Emmanuel", "Fathia", "Ganiu",
    "Prince", "Mayowa", "Mr Chika", "Mr Ibrahim", "Mr Paul", "Mr Peter",
    "Ololade", "Damilola", "Oyindamola", "Philip", "Solomon", "Teemah",
    "Bright", "Jeremiah", "Joseph", "Tommy", "Mr Tobi", "Mr Ade",
    "Segun", "Mr Kingsley", "Mr Ajayi", "Mr John", "Great God",
    "Mr Sunday", "Mr Kenny", "Olawunmi", "Mr Wilson", "Mr Idris",
  ],
  KETU: ["Semilore", "Miracle", "Yusuf", "Dickson", "Tony", "Habeb", "Lawal", "Ayomide"],
};

function calcBonus(n) {
  if (n <= 200) return n * 200;
  if (n <= 250) return n * 400;
  if (n <= 300) return n * 500;
  return n * 700;
}
function getBonusRate(n) {
  if (n <= 200) return 200;
  if (n <= 250) return 400;
  if (n <= 300) return 500;
  return 700;
}
const fmt = (n) => `₦${Number(n || 0).toLocaleString("en-NG")}`;
function calcRiderOwed(order) {
  if (order.status !== "Delivered") return 0;
  return Math.max(0, (order.cashValue || 0) - (order.roadExpense || 0)) + (order.posValue || 0);
}

// ─── DYNAMIC TODAY ────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0];

// ─── GOOGLE SHEETS API ────────────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbxImtEJesdzwnkES5wg7n76cI_n9k72ZTL5hr6rYbHWwavvixelAiB6bCpycorz8GF0/exec";

async function sheetGet(tab) {
  try {
    const res = await fetch(`${API_URL}?tab=${tab}`);
    const data = await res.json();
    return data.map(row => ({
      ...row,
      cashValue:      Number(row.cashValue)      || 0,
      posValue:       Number(row.posValue)       || 0,
      roadExpense:    Number(row.roadExpense)     || 0,
      amount:         Number(row.amount)         || 0,
      expectedAmount: Number(row.expectedAmount) || 0,
      remittedAmount: Number(row.remittedAmount) || 0,
      riderRemitted:  row.riderRemitted === "true" || row.riderRemitted === true,
    }));
  } catch (e) { console.error("Sheet read error:", e); return []; }
}

async function sheetAdd(tab, data) {
  try {
    await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "add", tab, data }) });
  } catch (e) { console.error("Sheet add error:", e); }
}

async function sheetUpdate(tab, data) {
  try {
    await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "update", tab, data }) });
  } catch (e) { console.error("Sheet update error:", e); }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function filterOrders(list, mode, customDate) {
  if (mode === "custom" && customDate) return list.filter((o) => o.date === customDate);
  if (mode === "today")  return list.filter((o) => o.date === TODAY);
  if (mode === "week") {
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    const monday = new Date(now); monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return list.filter((o) => dates.includes(o.date));
  }
  if (mode === "month") {
    const ym = TODAY.slice(0, 7);
    return list.filter((o) => o.date.startsWith(ym));
  }
  return list;
}
function calcBranchExpected(orders) {
  return orders.filter((o) => o.status === "Delivered").reduce((s, o) => s + calcRiderOwed(o), 0);
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Unbounded:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #060d18;
    --surface: #0a1628;
    --surface2: #0e1e36;
    --border: #162640;
    --border-hi: #1e6fff;
    --blue: #1e6fff;
    --blue-glow: #1e6fff44;
    --blue-light: #6aabff;
    --blue-dark: #1050cc;
    --text: #ddeeff;
    --text-dim: #7ca4cc;
    --text-faint: #304a6a;
    --green: #00c98d;
    --red: #ff4d6a;
    --amber: #ffb340;
    --mono: 'IBM Plex Mono', monospace;
    --display: 'Unbounded', sans-serif;
    --body: 'Outfit', sans-serif;
  }

  body { background: var(--bg); font-family: var(--body); color: var(--text); }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 99px; }

  /* Date picker */
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.4) sepia(1) saturate(3) hue-rotate(185deg);
    cursor: pointer;
    opacity: 0.7;
  }
  select option { background: #0a1628; color: #ddeeff; }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(400%); }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 20px var(--blue-glow); }
    50% { box-shadow: 0 0 40px var(--blue-glow), 0 0 80px #1e6fff22; }
  }

  .fade-up { animation: fadeUp 0.45s cubic-bezier(.22,.68,0,1.2) forwards; }
  .fade-in { animation: fadeIn 0.3s ease forwards; }
  .slide-down { animation: slideDown 0.25s ease forwards; }
  .pulse-red { animation: pulse 2s ease-in-out infinite; }
  .glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }

  /* Grid noise texture overlay */
  .grid-bg::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(30,111,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(30,111,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  /* Scanline effect */
  .scanline::after {
    content: '';
    position: fixed;
    left: 0; right: 0;
    height: 120px;
    background: linear-gradient(transparent, rgba(30,111,255,0.03), transparent);
    animation: scanline 8s linear infinite;
    pointer-events: none;
    z-index: 0;
  }

  .content { position: relative; z-index: 1; }

  /* Corner accent */
  .corner-accent {
    position: relative;
  }
  .corner-accent::before, .corner-accent::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 10px;
    border-color: var(--blue);
    border-style: solid;
  }
  .corner-accent::before {
    top: -1px; left: -1px;
    border-width: 1px 0 0 1px;
  }
  .corner-accent::after {
    bottom: -1px; right: -1px;
    border-width: 0 1px 1px 0;
  }

  /* Input base */
  .k-input {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 6px;
    padding: 9px 12px;
    font-size: 13px;
    font-family: var(--body);
    transition: border-color 0.2s;
    outline: none;
  }
  .k-input::placeholder { color: var(--text-faint); }
  .k-input:focus { border-color: var(--blue); }

  /* Label */
  .k-label {
    display: block;
    font-size: 10px;
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    margin-bottom: 6px;
  }

  /* Tag/pill */
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-family: var(--mono);
    padding: 3px 8px;
    border-radius: 3px;
    border: 1px solid;
    white-space: nowrap;
  }

  /* Divider */
  .k-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 16px 0;
  }

  /* Nav button active */
  .nav-btn { transition: all 0.2s; }
  .nav-btn:hover { color: var(--text) !important; }
`;

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function KyneLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="10" fill="var(--surface2)" stroke="var(--border-hi)" strokeWidth="1"/>
      <path d="M13 10 L13 38" stroke="var(--blue-light)" strokeWidth="3.5" strokeLinecap="square"/>
      <path d="M13 24 L28 10" stroke="var(--blue)" strokeWidth="3.5" strokeLinecap="square"/>
      <path d="M13 24 L30 38" stroke="var(--blue-light)" strokeWidth="3.5" strokeLinecap="square"/>
      <path d="M22 16 L34 10" stroke="var(--blue)" strokeWidth="2.5" strokeLinecap="square" opacity="0.5"/>
      <circle cx="13" cy="24" r="2" fill="var(--blue)"/>
    </svg>
  );
}

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────
const STATUS_TAG = {
  Delivered:       { bg: "rgba(30,111,255,0.12)", color: "var(--blue-light)", border: "var(--blue)" },
  "Not Delivered": { bg: "rgba(255,179,64,0.12)",  color: "var(--amber)",      border: "var(--amber)" },
  Failed:          { bg: "rgba(255,77,106,0.12)",   color: "var(--red)",        border: "var(--red)" },
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Tag({ label, type = "zinc" }) {
  const styles = {
    zinc:  { bg: "rgba(48,74,106,0.4)", color: "var(--text-dim)",  border: "var(--border)" },
    blue:  { bg: "rgba(30,111,255,0.12)", color: "var(--blue-light)", border: "var(--blue)" },
    green: { bg: "rgba(0,201,141,0.12)",  color: "var(--green)",     border: "var(--green)" },
    red:   { bg: "rgba(255,77,106,0.12)", color: "var(--red)",       border: "var(--red)" },
    amber: { bg: "rgba(255,179,64,0.12)", color: "var(--amber)",     border: "var(--amber)" },
  };
  const s = styles[type] || styles.zinc;
  return (
    <span className="tag" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  const accentColors = {
    blue:  { border: "var(--blue)",  glow: "rgba(30,111,255,0.15)", val: "var(--blue-light)" },
    green: { border: "var(--green)", glow: "rgba(0,201,141,0.1)",   val: "var(--green)" },
    red:   { border: "var(--red)",   glow: "rgba(255,77,106,0.1)",  val: "var(--red)" },
    amber: { border: "var(--amber)", glow: "rgba(255,179,64,0.1)",  val: "var(--amber)" },
  };
  const a = accent ? accentColors[accent] : null;
  return (
    <div className="corner-accent" style={{
      background: a ? a.glow : "var(--surface)",
      border: `1px solid ${a ? a.border : "var(--border)"}`,
      borderRadius: "8px",
      padding: "14px 16px",
    }}>
      <p style={{ fontFamily: "var(--mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-dim)", marginBottom: "6px" }}>{label}</p>
      <p style={{ fontFamily: "var(--display)", fontSize: "18px", fontWeight: 700, color: a ? a.val : "var(--text)", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)", marginTop: "4px" }}>{sub}</p>}
    </div>
  );
}

function Card({ children, accent, style = {}, className = "" }) {
  const border = accent === "blue" ? "var(--blue)" : accent === "red" ? "var(--red)" : "var(--border)";
  const bg = accent === "blue" ? "rgba(30,111,255,0.06)" : accent === "red" ? "rgba(255,77,106,0.06)" : "var(--surface)";
  return (
    <div className={`corner-accent ${className}`} style={{ background: bg, border: `1px solid ${border}`, borderRadius: "10px", padding: "16px", ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: "16px", paddingTop: "4px" }}>
      <h2 style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color: "var(--text)", letterSpacing: "0.03em" }}>{title}</h2>
      {sub && <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)", marginTop: "3px" }}>{sub}</p>}
    </div>
  );
}

function PeriodFilter({ mode, setMode, customDate, setCustomDate }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
      {[["today", "Today"], ["week", "Week"], ["month", "Month"], ["all", "All"]].map(([id, label]) => (
        <button key={id} onClick={() => setMode(id)} style={{
          padding: "5px 12px",
          borderRadius: "4px",
          fontSize: "11px",
          fontFamily: "var(--mono)",
          fontWeight: 500,
          cursor: "pointer",
          border: `1px solid ${mode === id ? "var(--blue)" : "var(--border)"}`,
          background: mode === id ? "rgba(30,111,255,0.15)" : "transparent",
          color: mode === id ? "var(--blue-light)" : "var(--text-dim)",
          transition: "all 0.15s",
        }}>{label}</button>
      ))}
      <div style={{ marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
        <input type="date" value={customDate}
          onChange={(e) => { setCustomDate(e.target.value); setMode("custom"); }}
          className="k-input"
          style={{ width: "140px", fontSize: "11px", fontFamily: "var(--mono)", padding: "5px 10px",
            borderColor: mode === "custom" ? "var(--blue)" : "var(--border)" }} />
        {mode === "custom" && customDate && (
          <button onClick={() => { setMode("today"); setCustomDate(""); }} style={{
            background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-dim)",
            borderRadius: "4px", padding: "5px 8px", fontSize: "11px", cursor: "pointer", fontFamily: "var(--mono)"
          }}>✕</button>
        )}
      </div>
    </div>
  );
}

function TopNav({ subtitle, tabs, activeTab, setActiveTab, onLogout }) {
  return (
    <div style={{
      background: "rgba(6,13,24,0.96)",
      borderBottom: "1px solid var(--border)",
      position: "sticky", top: 0, zIndex: 20,
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 16px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <KyneLogo size={34} />
          <div>
            <span style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color: "var(--text)", letterSpacing: "0.05em" }}>KYNE</span>
            {subtitle && <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)", marginTop: "1px" }}>{subtitle}</p>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="nav-btn" style={{
              padding: "6px 10px", borderRadius: "5px", fontSize: "11px",
              fontFamily: "var(--mono)", cursor: "pointer", border: "none",
              background: activeTab === t.id ? "rgba(30,111,255,0.2)" : "transparent",
              color: activeTab === t.id ? "var(--blue-light)" : "var(--text-faint)",
              fontWeight: activeTab === t.id ? 600 : 400,
              borderBottom: activeTab === t.id ? "1px solid var(--blue)" : "1px solid transparent",
            }}>{t.label}</button>
          ))}
          <button onClick={onLogout} style={{
            marginLeft: "6px", padding: "5px 10px", borderRadius: "4px",
            background: "transparent", border: "1px solid var(--border)",
            color: "var(--text-faint)", fontSize: "10px", fontFamily: "var(--mono)", cursor: "pointer",
          }}>← EXIT</button>
        </div>
      </div>
    </div>
  );
}

function RiderAvatar({ name, size = 32 }) {
  const colors = ["#1e6fff", "#00c98d", "#ffb340", "#ff4d6a", "#a855f7", "#06b6d4"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--display)", fontSize: size * 0.38, fontWeight: 700,
      background: `${colors[idx]}22`, color: colors[idx], border: `1px solid ${colors[idx]}44`,
    }}>{name[0].toUpperCase()}</div>
  );
}

function OrderRow({ order, onMarkPaid }) {
  const owed = calcRiderOwed(order);
  const cashOwed = order.status === "Delivered" ? Math.max(0, (order.cashValue || 0) - (order.roadExpense || 0)) : 0;
  const posOwed = order.status === "Delivered" ? (order.posValue || 0) : 0;
  const st = STATUS_TAG[order.status];
  return (
    <div style={{
      background: "var(--surface)", border: `1px solid ${order.riderRemitted ? "var(--border)" : "var(--border)"}`,
      borderRadius: "8px", padding: "12px 14px",
      opacity: order.riderRemitted ? 0.65 : 1, transition: "opacity 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{order.product}</span>
            <span className="tag" style={{ background: st.bg, color: st.color, borderColor: st.border, fontSize: "10px" }}>{order.status}</span>
            {order.riderRemitted
              ? <Tag label="✓ REMITTED" type="green" />
              : order.status === "Delivered" && <Tag label="⚠ PENDING" type="amber" />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <RiderAvatar name={order.rider} size={18} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>{order.rider}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>·</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>{order.date}</span>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {order.cashValue > 0 && <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>💵 {fmt(order.cashValue)}</span>}
            {order.posValue > 0  && <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>💳 {fmt(order.posValue)}</span>}
            {order.roadExpense > 0 && <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>🛣️ {fmt(order.roadExpense)} · {order.expenseNote}</span>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{fmt((order.cashValue || 0) + (order.posValue || 0))}</p>
          {order.status === "Delivered" && !order.riderRemitted && (
            <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--amber)", marginTop: "2px" }}>owes {fmt(owed)}</p>
          )}
        </div>
      </div>
      {order.status === "Delivered" && !order.riderRemitted && onMarkPaid && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>Cash: <span style={{ color: "var(--text)" }}>{fmt(cashOwed)}</span></span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>POS: <span style={{ color: "var(--text)" }}>{fmt(posOwed)}</span></span>
          </div>
          <button onClick={() => onMarkPaid(order.id)} style={{
            background: "var(--green)", color: "#fff", border: "none",
            borderRadius: "4px", padding: "5px 12px", fontSize: "11px",
            fontFamily: "var(--mono)", fontWeight: 600, cursor: "pointer",
          }}>PAID ✓</button>
        </div>
      )}
    </div>
  );
}

function BranchRemitCard({ rec }) {
  const diff = rec.remittedAmount - rec.expectedAmount;
  const matched = Math.abs(diff) < 1;
  const short = diff < 0;
  return (
    <div style={{
      background: short && !matched ? "rgba(255,77,106,0.07)" : matched && rec.remittedAmount > 0 ? "rgba(0,201,141,0.07)" : "var(--surface)",
      border: `1px solid ${short && !matched ? "var(--red)" : matched && rec.remittedAmount > 0 ? "var(--green)" : "var(--border)"}`,
      borderRadius: "10px", padding: "16px", marginBottom: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "rgba(30,111,255,0.15)", border: "1px solid var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontSize: "10px", fontWeight: 700, color: "var(--blue-light)" }}>{rec.branch[0]}</div>
            <span style={{ fontFamily: "var(--display)", fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>{rec.branch}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>{rec.date}</span>
          </div>
          <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>
            TX: <span style={{ color: "var(--blue-light)" }}>{rec.txID}</span>
          </p>
          {rec.note && <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>{rec.note}</p>}
        </div>
        {matched ? <Tag label="✓ BALANCED" type="green" /> : short ? <Tag label={`SHORT ${fmt(Math.abs(diff))}`} type="red" /> : <Tag label={`OVER ${fmt(diff)}`} type="amber" />}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {[
          { label: "Should Remit", val: fmt(rec.expectedAmount), color: "var(--text)" },
          { label: "Actually Sent", val: fmt(rec.remittedAmount), color: matched ? "var(--green)" : short ? "var(--red)" : "var(--amber)" },
          { label: "Difference", val: matched ? "EXACT" : short ? `-${fmt(Math.abs(diff))}` : `+${fmt(diff)}`, color: matched ? "var(--green)" : short ? "var(--red)" : "var(--amber)" },
        ].map((item) => (
          <div key={item.label} style={{ background: "var(--bg)", borderRadius: "6px", padding: "10px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label}</p>
            <p style={{ fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700, color: item.color }}>{item.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiderBonusRow({ name, orderCount }) {
  const bonus = calcBonus(orderCount);
  const rate = getBonusRate(orderCount);
  const nextBreak = orderCount <= 200 ? 200 : orderCount <= 250 ? 250 : orderCount <= 300 ? 300 : null;
  const toNext = nextBreak ? nextBreak - orderCount : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <RiderAvatar name={name} size={28} />
        <div>
          <p style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{name}</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)" }}>{orderCount} orders · ₦{rate}/order</p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color: "var(--blue-light)" }}>{fmt(bonus)}</p>
        {toNext > 0 && <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)" }}>{toNext} to next tier</p>}
      </div>
    </div>
  );
}

// ─── CREDENTIALS ─────────────────────────────────────────────────────────────
const USERS = [
  { username: "Boss",         password: "kyne@boss2025",    role: "boss",          branch: null    },
  { username: "idimu manager",password: "idimukyne@2021",   role: "manager",       branch: "IDIMU" },
  { username: "aja manager",  password: "ajakyne@2022",     role: "manager",       branch: "AJA"   },
  { username: "ketu manager", password: "ketukyne@2023",    role: "manager",       branch: "KETU"  },
  { username: "idimu rider",  password: "idimurider@2021",  role: "rider-manager", branch: "IDIMU" },
  { username: "aja rider",    password: "ajarider@2022",    role: "rider-manager", branch: "AJA"   },
  { username: "ketu rider",   password: "keturider@2023",   role: "rider-manager", branch: "KETU"  },
];

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  function handleEnter() {
    setError("");
    const match = USERS.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    if (!match) {
      setError("Invalid username or password.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    setTimeout(() => onLogin(match.role, match.branch), 400);
  }

  function handleKey(e) { if (e.key === "Enter") handleEnter(); }

  return (
    <div className="grid-bg scanline" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "var(--body)" }}>
      <style>{GS}
        {`@keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
        .shake { animation: shake 0.45s ease; }
        `}
      </style>
      <div className="content fade-up" style={{ width: "100%", maxWidth: "380px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
            <KyneLogo size={52} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontFamily: "var(--display)", fontSize: "28px", fontWeight: 800, color: "var(--text)", letterSpacing: "0.08em", lineHeight: 1 }}>KYNE</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--blue-light)", marginTop: "2px", letterSpacing: "0.1em" }}>LOGISTICS OPS PORTAL</p>
            </div>
          </div>
          <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)", letterSpacing: "0.15em" }}>YOUR E-COMMERCE LOGISTICS BRO</p>
        </div>

        {/* Card */}
        <div className={`corner-accent glow-pulse ${shake ? "shake" : ""}`} style={{
          background: "var(--surface)", border: `1px solid ${error ? "var(--red)" : "var(--border)"}`,
          borderRadius: "12px", padding: "28px", transition: "border-color 0.2s",
        }}>
          <p className="k-label" style={{ marginBottom: "20px" }}>// SIGN IN TO YOUR PORTAL</p>

          <div style={{ marginBottom: "14px" }}>
            <label className="k-label">Username</label>
            <input
              className="k-input"
              placeholder="e.g. idimu manager"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              onKeyDown={handleKey}
              autoComplete="username"
              style={{ borderColor: error ? "var(--red)" : undefined }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label className="k-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                className="k-input"
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKey}
                autoComplete="current-password"
                style={{ paddingRight: "40px", borderColor: error ? "var(--red)" : undefined }}
              />
              <button onClick={() => setShowPass((p) => !p)} style={{
                position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)",
              }}>{showPass ? "HIDE" : "SHOW"}</button>
            </div>
          </div>

          {error && (
            <div className="slide-down" style={{
              background: "rgba(255,77,106,0.1)", border: "1px solid var(--red)",
              borderRadius: "6px", padding: "10px 12px", marginBottom: "16px",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{ fontSize: "14px" }}>⚠️</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--red)" }}>{error}</span>
            </div>
          )}

          <button onClick={handleEnter} disabled={!username || !password} style={{
            width: "100%", padding: "13px",
            background: !username || !password ? "var(--surface2)" : loading ? "var(--blue-dark)" : `linear-gradient(135deg, var(--blue), var(--blue-dark))`,
            border: `1px solid ${!username || !password ? "var(--border)" : "transparent"}`,
            borderRadius: "6px", color: !username || !password ? "var(--text-faint)" : "#fff",
            fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em",
            cursor: !username || !password ? "not-allowed" : "pointer", transition: "all 0.2s",
            boxShadow: !username || !password ? "none" : "0 4px 20px rgba(30,111,255,0.3)",
          }}>
            {loading ? "SIGNING IN..." : "SIGN IN →"}
          </button>
        </div>

        <p style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)", marginTop: "16px", letterSpacing: "0.1em" }}>
          KYNE OPERATIONS · RESTRICTED ACCESS
        </p>
      </div>
    </div>
  );
}

// ─── RIDER MANAGER VIEW ───────────────────────────────────────────────────────
function RiderManagerView({ branch, onLogout }) {
  const [tab, setTab] = useState("log");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const blank = { date: TODAY, rider: RIDERS[branch][0], product: "", cashValue: "", posValue: "", roadExpense: "", expenseNote: "", status: "Delivered" };
  const [form, setForm] = useState(blank);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    sheetGet("Orders").then(data => {
      setOrders(data.filter(o => o.branch === branch));
      setLoading(false);
    });
  }, [branch]);

  async function handleSubmit() {
    if (!form.date || !form.product) return;
    const newOrder = { ...form, id: Date.now(), cashValue: Number(form.cashValue) || 0, posValue: Number(form.posValue) || 0, roadExpense: Number(form.roadExpense) || 0, riderRemitted: false, branch };
    setOrders((p) => [newOrder, ...p]);
    setForm(blank);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    await sheetAdd("Orders", newOrder);
  }

  const filtered = filterOrders(orders, mode, customDate);
  const totalCash = filtered.reduce((s, o) => s + (o.cashValue || 0), 0);
  const totalPOS  = filtered.reduce((s, o) => s + (o.posValue || 0), 0);
  const totalRoad = filtered.reduce((s, o) => s + (o.roadExpense || 0), 0);
  const tabs = [{ id: "log", label: "Log Order" }, { id: "orders", label: "Orders" }, { id: "riders", label: "Riders" }];
  const remitPreview = Math.max(0, (Number(form.cashValue) || 0) - (Number(form.roadExpense) || 0)) + (Number(form.posValue) || 0);

  if (loading) return <LoadingScreen />;

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--body)" }}>
      <style>{GS}</style>
      <TopNav subtitle={`${branch} · RIDER MANAGER`} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} />
      <div className="content" style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px" }}>

        {tab === "log" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <SectionTitle title="LOG NEW ORDER" sub="Select rider, then fill in delivery details" />
              {saved && <Tag label="✓ SAVED" type="green" />}
            </div>
            <Card>
              <p className="k-label">// SELECT RIDER</p>
              <select value={form.rider} onChange={(e) => set("rider", e.target.value)} className="k-input" style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 600, borderColor: "var(--blue)", marginBottom: "20px" }}>
                {RIDERS[branch].map((r) => <option key={r}>{r}</option>)}
              </select>

              <hr className="k-divider" />
              <p className="k-label" style={{ marginBottom: "12px" }}>// DELIVERY DETAILS</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label className="k-label">Date</label>
                  <input type="date" className="k-input" value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
                <div>
                  <label className="k-label">Status</label>
                  <select className="k-input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                    <option>Delivered</option>
                    <option>Not Delivered</option>
                    <option>Failed</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="k-label">Product Description</label>
                  <input className="k-input" placeholder="e.g. Electronics package, clothing parcel..." value={form.product} onChange={(e) => set("product", e.target.value)} />
                </div>
              </div>

              <hr className="k-divider" />
              <p className="k-label" style={{ marginBottom: "12px" }}>// PAYMENT COLLECTED</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "6px" }}>
                <div>
                  <label className="k-label">💵 Cash (₦)</label>
                  <input type="number" className="k-input" placeholder="0" value={form.cashValue} onChange={(e) => set("cashValue", e.target.value)} />
                </div>
                <div>
                  <label className="k-label">💳 POS (₦)</label>
                  <input type="number" className="k-input" placeholder="0" value={form.posValue} onChange={(e) => set("posValue", e.target.value)} />
                </div>
              </div>
              <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)", marginBottom: "16px" }}>Fill both if customer paid with cash + POS</p>

              <hr className="k-divider" />
              <p className="k-label" style={{ marginBottom: "12px" }}>// ROAD EXPENSE</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label className="k-label">Amount (₦)</label>
                  <input type="number" className="k-input" placeholder="0" value={form.roadExpense} onChange={(e) => set("roadExpense", e.target.value)} />
                </div>
                <div>
                  <label className="k-label">Used for?</label>
                  <input className="k-input" placeholder="Fuel, toll, parking..." value={form.expenseNote} onChange={(e) => set("expenseNote", e.target.value)} />
                </div>
              </div>

              {(form.cashValue || form.posValue) && (
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px", marginBottom: "20px" }}>
                  <p className="k-label" style={{ marginBottom: "10px" }}>// REMITTANCE PREVIEW</p>
                  {[
                    ["Cash collected", fmt(form.cashValue || 0), "var(--text)"],
                    ["− Road expense", `−${fmt(form.roadExpense || 0)}`, "var(--red)"],
                    ["Cash to remit", fmt(Math.max(0, (Number(form.cashValue) || 0) - (Number(form.roadExpense) || 0))), "var(--text)"],
                    ["POS to remit", fmt(form.posValue || 0), "var(--text)"],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-faint)" }}>{label}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color }}>{val}</span>
                    </div>
                  ))}
                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", fontWeight: 600 }}>Total rider owes</span>
                    <span style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color: "var(--blue-light)" }}>{fmt(remitPreview)}</span>
                  </div>
                </div>
              )}

              <button onClick={handleSubmit} disabled={!form.date || !form.product} style={{
                width: "100%", padding: "12px",
                background: !form.date || !form.product ? "var(--surface2)" : `linear-gradient(135deg, var(--blue), var(--blue-dark))`,
                border: `1px solid ${!form.date || !form.product ? "var(--border)" : "transparent"}`,
                borderRadius: "6px", color: !form.date || !form.product ? "var(--text-faint)" : "#fff",
                fontFamily: "var(--display)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
                cursor: !form.date || !form.product ? "not-allowed" : "pointer",
                boxShadow: !form.date || !form.product ? "none" : "0 4px 16px rgba(30,111,255,0.25)",
              }}>SAVE ORDER →</button>
            </Card>

            {orders.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <p className="k-label" style={{ marginBottom: "10px" }}>// RECENTLY SAVED</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {orders.slice(0, 3).map((o) => <OrderRow key={o.id} order={o} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="fade-in">
            <SectionTitle title="ORDERS LOG" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
              <StatCard label="Total Cash" value={fmt(totalCash)} accent="blue" />
              <StatCard label="Total POS"  value={fmt(totalPOS)}  accent="green" />
              <StatCard label="Road Exp"   value={fmt(totalRoad)} accent="red" />
              <StatCard label="Orders"     value={filtered.length} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map((o) => <OrderRow key={o.id} order={o} />)}
              {filtered.length === 0 && <p style={{ textAlign: "center", padding: "48px 0", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-faint)" }}>NO ORDERS IN THIS PERIOD</p>}
            </div>
          </div>
        )}

        {tab === "riders" && (
          <div className="fade-in">
            <SectionTitle title="RIDER SUMMARY" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {RIDERS[branch].map((name) => {
                const ro = filterOrders(orders.filter((o) => o.rider === name), mode, customDate);
                const done = ro.filter((o) => o.status === "Delivered");
                const cash = done.reduce((s, o) => s + (o.cashValue || 0), 0);
                const pos  = done.reduce((s, o) => s + (o.posValue || 0), 0);
                const road = ro.reduce((s, o) => s + (o.roadExpense || 0), 0);
                const owed = done.reduce((s, o) => s + calcRiderOwed(o), 0);
                const allCount = orders.filter((o) => o.rider === name).length;
                const bonus = calcBonus(allCount);
                const rate  = getBonusRate(allCount);
                return (
                  <Card key={name}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <RiderAvatar name={name} size={34} />
                        <span style={{ fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>{name}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color: "var(--blue-light)" }}>{fmt(bonus)}</p>
                        <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)" }}>₦{rate}/order · {allCount} orders</p>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                      {[["Cash", fmt(cash), "var(--text)"], ["POS", fmt(pos), "var(--text)"], ["Road", fmt(road), "var(--red)"], ["Remit", fmt(owed), "var(--blue-light)"]].map(([label, val, color]) => (
                        <div key={label} style={{ background: "var(--bg)", borderRadius: "6px", padding: "8px", textAlign: "center" }}>
                          <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)", marginBottom: "3px" }}>{label}</p>
                          <p style={{ fontFamily: "var(--display)", fontSize: "11px", fontWeight: 700, color }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BRANCH MANAGER VIEW ──────────────────────────────────────────────────────
function ManagerView({ branch, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [showExpForm, setShowExpForm] = useState(false);
  const [remitSaved, setRemitSaved] = useState(false);
  const blankExp = { date: TODAY, description: "", category: "Fuel", amount: "" };
  const blankRemit = { date: TODAY, remittedAmount: "", txID: "", note: "" };
  const [expForm, setExpForm] = useState(blankExp);
  const [remitForm, setRemitForm] = useState(blankRemit);

  useEffect(() => {
    Promise.all([
      sheetGet("Orders"),
      sheetGet("Expenses"),
      sheetGet("Remittances"),
    ]).then(([o, e, r]) => {
      setOrders(o.filter(x => x.branch === branch));
      setExpenses(e.filter(x => x.branch === branch));
      setRemittances(r.filter(x => x.branch === branch));
      setLoading(false);
    });
  }, [branch]);

  async function markPaid(id) {
    const updated = orders.map((o) => o.id === String(id) || o.id === id ? { ...o, riderRemitted: true } : o);
    setOrders(updated);
    const order = updated.find(o => String(o.id) === String(id));
    if (order) await sheetUpdate("Orders", { ...order, riderRemitted: true });
  }
  async function saveExpense() {
    if (!expForm.date || !expForm.description || !expForm.amount) return;
    const newExp = { ...expForm, id: Date.now(), amount: Number(expForm.amount), branch };
    setExpenses((p) => [newExp, ...p]);
    setExpForm(blankExp); setShowExpForm(false);
    await sheetAdd("Expenses", newExp);
  }
  async function saveRemittance() {
    if (!remitForm.remittedAmount || !remitForm.txID) return;
    const expected = calcBranchExpected(filterOrders(orders, "today", ""));
    const newRemit = { ...remitForm, id: Date.now(), branch, expectedAmount: expected, remittedAmount: Number(remitForm.remittedAmount) };
    setRemittances((p) => [newRemit, ...p]);
    setRemitForm(blankRemit); setRemitSaved(true); setTimeout(() => setRemitSaved(false), 3000);
    await sheetAdd("Remittances", newRemit);
  }

  const fOrders   = filterOrders(orders, mode, customDate);
  const fExpenses = filterOrders(expenses, mode, customDate);
  const fRemit    = filterOrders(remittances, mode, customDate);
  const delivered  = fOrders.filter((o) => o.status === "Delivered");
  const totalCash  = delivered.reduce((s, o) => s + (o.cashValue || 0), 0);
  const totalPOS   = delivered.reduce((s, o) => s + (o.posValue || 0), 0);
  const totalRoad  = fOrders.reduce((s, o) => s + (o.roadExpense || 0), 0);
  const totalOwed  = delivered.reduce((s, o) => s + calcRiderOwed(o), 0);
  const totalRemitted = delivered.filter((o) => o.riderRemitted).reduce((s, o) => s + calcRiderOwed(o), 0);
  const outstanding   = totalOwed - totalRemitted;
  const totalBranchExp = fExpenses.reduce((s, e) => s + e.amount, 0);
  const todayExpected  = calcBranchExpected(filterOrders(orders, "today", ""));
  const pendingOrders  = fOrders.filter((o) => o.status === "Delivered" && !o.riderRemitted);
  const allOrders = orders;
  const totalBonus = RIDERS[branch].reduce((s, n) => s + calcBonus(allOrders.filter((o) => o.rider === n).length), 0);

  const tabs = [
    { id: "dashboard",  label: "Dashboard" },
    { id: "remittance", label: "Remittance" },
    { id: "send",       label: "Send to Boss" },
    { id: "riders",     label: "Riders" },
    { id: "expenses",   label: "Expenses" },
  ];

  if (loading) return <LoadingScreen />;

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--body)" }}>
      <style>{GS}</style>
      <TopNav subtitle={`${branch} · BRANCH MANAGER`} tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} />
      <div className="content" style={{ maxWidth: "960px", margin: "0 auto", padding: "20px 16px" }}>

        {tab === "dashboard" && (
          <div className="fade-in">
            <SectionTitle title={`${branch} OVERVIEW`} />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <StatCard label="Cash In"       value={fmt(totalCash)}      accent="blue" />
              <StatCard label="POS In"        value={fmt(totalPOS)}       accent="green" />
              <StatCard label="Road Expenses" value={fmt(totalRoad)}      accent="red" />
              <StatCard label="Branch Exp"    value={fmt(totalBranchExp)} accent="red" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <StatCard label="Should Remit" value={fmt(totalOwed)} />
              <StatCard label="Outstanding"  value={fmt(outstanding)} accent={outstanding > 0 ? "red" : undefined} sub={outstanding > 0 ? `${pendingOrders.length} pending` : ""} />
              <StatCard label="Bonus Payable" value={fmt(totalBonus)} accent="blue" />
            </div>

            {outstanding > 0 && (
              <div className="pulse-red" style={{ background: "rgba(255,77,106,0.07)", border: "1px solid var(--red)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>⚠️</span>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#fca5a5" }}>{fmt(outstanding)} not yet remitted by riders</p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--red)", marginTop: "2px" }}>CHECK REMITTANCE TAB</p>
                </div>
              </div>
            )}

            <Card>
              <p className="k-label" style={{ marginBottom: "12px" }}>// DELIVERY STATUS</p>
              {["Delivered", "Not Delivered", "Failed"].map((s) => {
                const count = fOrders.filter((o) => o.status === s).length;
                const pct = fOrders.length ? (count / fOrders.length) * 100 : 0;
                const st = STATUS_TAG[s];
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <span className="tag" style={{ background: st.bg, color: st.color, borderColor: st.border, width: "110px", textAlign: "center", flexShrink: 0 }}>{s}</span>
                    <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "var(--bg)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: st.color, borderRadius: "2px", transition: "width 0.5s ease" }} />
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", width: "18px", textAlign: "right" }}>{count}</span>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {tab === "remittance" && (
          <div className="fade-in">
            <SectionTitle title="RIDER REMITTANCE" sub="Mark riders paid once they hand over money" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <StatCard label="Total Owed"  value={fmt(totalOwed)} />
              <StatCard label="Remitted"    value={fmt(totalRemitted)} accent="green" />
              <StatCard label="Outstanding" value={fmt(outstanding)} accent={outstanding > 0 ? "red" : undefined} />
            </div>
            {pendingOrders.length > 0 && (
              <>
                <p className="k-label" style={{ color: "var(--amber)", marginBottom: "8px" }}>⚠ PENDING ({pendingOrders.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                  {pendingOrders.map((o) => <OrderRow key={o.id} order={o} onMarkPaid={markPaid} />)}
                </div>
              </>
            )}
            {delivered.filter((o) => o.riderRemitted).length > 0 && (
              <>
                <p className="k-label" style={{ marginBottom: "8px" }}>✓ REMITTED</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {delivered.filter((o) => o.riderRemitted).map((o) => <OrderRow key={o.id} order={o} />)}
                </div>
              </>
            )}
            {fOrders.length === 0 && <p style={{ textAlign: "center", padding: "48px 0", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-faint)" }}>NO ORDERS IN THIS PERIOD</p>}
          </div>
        )}

        {tab === "send" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <SectionTitle title="SEND REMITTANCE TO BOSS" sub="Log your daily bank transfer here" />
              {remitSaved && <Tag label="✓ LOGGED" type="green" />}
            </div>

            <div style={{ background: "rgba(30,111,255,0.07)", border: "1px solid var(--blue)", borderRadius: "10px", padding: "20px", marginBottom: "16px" }}>
              <p className="k-label">// TODAY'S EXPECTED REMITTANCE</p>
              <p style={{ fontFamily: "var(--display)", fontSize: "32px", fontWeight: 800, color: "var(--blue-light)", lineHeight: 1, marginBottom: "4px" }}>{fmt(todayExpected)}</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>AUTO-CALCULATED FROM TODAY'S RIDER COLLECTIONS</p>
            </div>

            <Card accent="blue">
              <p className="k-label" style={{ color: "var(--blue-light)", marginBottom: "14px" }}>// LOG TRANSFER TO BOSS</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label className="k-label">Date</label>
                  <input type="date" className="k-input" value={remitForm.date} onChange={(e) => setRemitForm((p) => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className="k-label">Amount Sent (₦)</label>
                  <input type="number" className="k-input" placeholder="0" value={remitForm.remittedAmount} onChange={(e) => setRemitForm((p) => ({ ...p, remittedAmount: e.target.value }))} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="k-label">Transaction ID</label>
                  <input className="k-input" style={{ fontFamily: "var(--mono)" }} placeholder="e.g. TRF20250304ABCD" value={remitForm.txID} onChange={(e) => setRemitForm((p) => ({ ...p, txID: e.target.value }))} />
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="k-label">Note (optional)</label>
                  <input className="k-input" placeholder="Any remarks..." value={remitForm.note} onChange={(e) => setRemitForm((p) => ({ ...p, note: e.target.value }))} />
                </div>
              </div>

              {remitForm.remittedAmount && (() => {
                const diff = Number(remitForm.remittedAmount || 0) - todayExpected;
                const matched = Math.abs(diff) < 1;
                return (
                  <div style={{ background: "var(--bg)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                    <p className="k-label" style={{ marginBottom: "8px" }}>// COMPARISON PREVIEW</p>
                    {[["Expected", fmt(todayExpected), "var(--text)"], ["You're sending", fmt(remitForm.remittedAmount || 0), "var(--text)"]].map(([label, val, color]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-faint)" }}>{label}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color }}>{val}</span>
                      </div>
                    ))}
                    <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-faint)" }}>Difference</span>
                      <span style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color: matched ? "var(--green)" : diff < 0 ? "var(--red)" : "var(--amber)" }}>
                        {matched ? "✓ EXACT" : diff < 0 ? `SHORT BY ${fmt(Math.abs(diff))}` : `OVER BY ${fmt(diff)}`}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <button onClick={saveRemittance} disabled={!remitForm.remittedAmount || !remitForm.txID} style={{
                width: "100%", padding: "12px",
                background: !remitForm.remittedAmount || !remitForm.txID ? "var(--surface2)" : `linear-gradient(135deg, var(--blue), var(--blue-dark))`,
                border: `1px solid ${!remitForm.remittedAmount || !remitForm.txID ? "var(--border)" : "transparent"}`,
                borderRadius: "6px", color: !remitForm.remittedAmount || !remitForm.txID ? "var(--text-faint)" : "#fff",
                fontFamily: "var(--display)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
                cursor: !remitForm.remittedAmount || !remitForm.txID ? "not-allowed" : "pointer",
                boxShadow: !remitForm.remittedAmount || !remitForm.txID ? "none" : "0 4px 16px rgba(30,111,255,0.25)",
              }}>SUBMIT TO BOSS →</button>
            </Card>

            {remittances.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <p className="k-label" style={{ marginBottom: "10px" }}>// PAST REMITTANCES</p>
                {remittances.map((r) => <BranchRemitCard key={r.id} rec={r} />)}
              </div>
            )}
          </div>
        )}

        {tab === "riders" && (
          <div className="fade-in">
            <SectionTitle title="RIDER PERFORMANCE + BONUS" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />

            <div style={{ background: "rgba(30,111,255,0.05)", border: "1px solid var(--blue)", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
              <p className="k-label" style={{ color: "var(--blue-light)", marginBottom: "12px" }}>// MONTHLY BONUS SUMMARY — {branch} ({RIDERS[branch].length} RIDERS)</p>
              {RIDERS[branch].map((name) => {
                const count = allOrders.filter((o) => o.rider === name).length;
                return <RiderBonusRow key={name} name={name} orderCount={count} />;
              })}
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="k-label" style={{ margin: 0 }}>TOTAL BONUS PAYABLE</span>
                <span style={{ fontFamily: "var(--display)", fontSize: "16px", fontWeight: 700, color: "var(--blue-light)" }}>{fmt(totalBonus)}</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {RIDERS[branch].map((name) => {
                const ro   = filterOrders(orders.filter((o) => o.rider === name), mode, customDate);
                const done = ro.filter((o) => o.status === "Delivered");
                const cash = done.reduce((s, o) => s + (o.cashValue || 0), 0);
                const pos  = done.reduce((s, o) => s + (o.posValue || 0), 0);
                const road = ro.reduce((s, o) => s + (o.roadExpense || 0), 0);
                const owed = done.reduce((s, o) => s + calcRiderOwed(o), 0);
                const paid = done.filter((o) => o.riderRemitted).reduce((s, o) => s + calcRiderOwed(o), 0);
                const out  = owed - paid;
                const allCount = allOrders.filter((o) => o.rider === name).length;
                const bonus = calcBonus(allCount);
                return (
                  <Card key={name}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <RiderAvatar name={name} size={36} />
                        <span style={{ fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700 }}>{name}</span>
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {out > 0 && <Tag label={`OWES ${fmt(out)}`} type="red" />}
                        <Tag label={`BONUS ${fmt(bonus)}`} type="blue" />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                      {[["Cash", fmt(cash), "var(--text)"], ["POS", fmt(pos), "var(--text)"], ["Road Exp", fmt(road), "var(--red)"], ["Outstanding", out > 0 ? fmt(out) : "Cleared", out > 0 ? "var(--red)" : "var(--green)"]].map(([label, val, color]) => (
                        <div key={label} style={{ background: "var(--bg)", borderRadius: "6px", padding: "8px" }}>
                          <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)", marginBottom: "3px" }}>{label}</p>
                          <p style={{ fontFamily: "var(--display)", fontSize: "11px", fontWeight: 700, color }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {tab === "expenses" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <SectionTitle title="BRANCH EXPENSES" />
              <button onClick={() => setShowExpForm((p) => !p)} style={{
                background: "var(--blue)", color: "#fff", border: "none",
                borderRadius: "5px", padding: "7px 14px",
                fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
              }}>+ ADD</button>
            </div>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />

            {showExpForm && (
              <Card accent="blue" style={{ marginBottom: "16px" }} className="slide-down">
                <p className="k-label" style={{ color: "var(--blue-light)", marginBottom: "14px" }}>// NEW BRANCH EXPENSE</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label className="k-label">Date</label>
                    <input type="date" className="k-input" value={expForm.date} onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="k-label">Category</label>
                    <select className="k-input" value={expForm.category} onChange={(e) => setExpForm((p) => ({ ...p, category: e.target.value }))}>
                      <option>Fuel</option><option>Office</option><option>Repairs</option><option>Salary</option><option>Other</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label className="k-label">Description</label>
                    <input className="k-input" placeholder="What was this for?" value={expForm.description} onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="k-label">Amount (₦)</label>
                    <input type="number" className="k-input" placeholder="0" value={expForm.amount} onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={saveExpense} style={{ flex: 1, padding: "9px", background: "var(--blue)", border: "none", borderRadius: "5px", color: "#fff", fontFamily: "var(--mono)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>SAVE</button>
                  <button onClick={() => setShowExpForm(false)} style={{ padding: "9px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "5px", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "11px", cursor: "pointer" }}>CANCEL</button>
                </div>
              </Card>
            )}

            <div style={{ background: "rgba(255,77,106,0.07)", border: "1px solid rgba(255,77,106,0.3)", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Branch Expenses</span>
              <span style={{ fontFamily: "var(--display)", fontSize: "16px", fontWeight: 700, color: "var(--red)" }}>{fmt(totalBranchExp)}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {fExpenses.map((e) => (
                <div key={e.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{e.description}</p>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>{e.category} · {e.date}</p>
                  </div>
                  <p style={{ fontFamily: "var(--display)", fontSize: "14px", fontWeight: 700, color: "var(--red)" }}>{fmt(e.amount)}</p>
                </div>
              ))}
              {fExpenses.length === 0 && <p style={{ textAlign: "center", padding: "48px 0", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-faint)" }}>NO EXPENSES IN THIS PERIOD</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BOSS VIEW ────────────────────────────────────────────────────────────────
function BossView({ onLogout }) {
  const [tab, setTab] = useState("overview");
  const [mode, setMode] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [allRemittances, setAllRemittances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sheetGet("Orders"),
      sheetGet("Expenses"),
      sheetGet("Remittances"),
    ]).then(([o, e, r]) => {
      setOrders(o);
      setExpenses(e);
      setAllRemittances(r);
      setLoading(false);
    });
  }, []);

  const fOrders   = filterOrders(orders, mode, customDate);
  const fExpenses = filterOrders(expenses, mode, customDate);
  const fRemit    = filterOrders(allRemittances, mode, customDate);

  const branchStats = BRANCHES.map((b) => {
    const bo   = fOrders.filter((o) => o.branch === b);
    const done = bo.filter((o) => o.status === "Delivered");
    const cash = done.reduce((s, o) => s + (o.cashValue || 0), 0);
    const pos  = done.reduce((s, o) => s + (o.posValue || 0), 0);
    const road = bo.reduce((s, o) => s + (o.roadExpense || 0), 0);
    const expected = done.reduce((s, o) => s + calcRiderOwed(o), 0);
    const branchExp = fExpenses.filter((e) => e.branch === b).reduce((s, e) => s + e.amount, 0);
    const remitRecs = fRemit.filter((r) => r.branch === b);
    const totalSent = remitRecs.reduce((s, r) => s + r.remittedAmount, 0);
    const diff = totalSent - expected;
    const allBranchOrders = orders.filter((o) => o.branch === b);
    const totalBonus = RIDERS[b].reduce((s, n) => s + calcBonus(allBranchOrders.filter((o) => o.rider === n).length), 0);
    return { branch: b, total: bo.length, delivered: done.length, cash, pos, road, expected, branchExp, totalSent, diff, remitRecs, totalBonus };
  });

  const grand = {
    cash:      branchStats.reduce((s, b) => s + b.cash, 0),
    pos:       branchStats.reduce((s, b) => s + b.pos, 0),
    expected:  branchStats.reduce((s, b) => s + b.expected, 0),
    sent:      branchStats.reduce((s, b) => s + b.totalSent, 0),
    branchExp: branchStats.reduce((s, b) => s + b.branchExp, 0),
    orders:    branchStats.reduce((s, b) => s + b.total, 0),
    bonus:     branchStats.reduce((s, b) => s + b.totalBonus, 0),
  };
  const grandDiff = grand.sent - grand.expected;

  const tabs = [
    { id: "overview",    label: "Overview" },
    { id: "remittances", label: "Remittances" },
    { id: "branches",    label: "Branches" },
    { id: "riders",      label: "All Riders" },
    { id: "orders",      label: "Orders" },
  ];

  if (loading) return <LoadingScreen />;

  return (
    <div className="grid-bg" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--body)" }}>
      <style>{GS}</style>
      <TopNav subtitle="ALL BRANCHES · BOSS" tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} />
      <div className="content" style={{ maxWidth: "960px", margin: "0 auto", padding: "20px 16px" }}>

        {tab === "overview" && (
          <div className="fade-in">
            <SectionTitle title="ALL BRANCHES OVERVIEW" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />

            {Math.abs(grandDiff) > 0 && (
              <div className={grandDiff < 0 ? "pulse-red" : ""} style={{
                background: grandDiff < 0 ? "rgba(255,77,106,0.07)" : "rgba(255,179,64,0.07)",
                border: `1px solid ${grandDiff < 0 ? "var(--red)" : "var(--amber)"}`,
                borderRadius: "8px", padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px",
              }}>
                <span style={{ fontSize: "22px" }}>{grandDiff < 0 ? "🚨" : "⚠️"}</span>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: grandDiff < 0 ? "#fca5a5" : "#fcd34d" }}>
                    {grandDiff < 0 ? `Branches short by ${fmt(Math.abs(grandDiff))} total` : `Branches sent ${fmt(grandDiff)} more than expected`}
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: grandDiff < 0 ? "var(--red)" : "var(--amber)", marginTop: "2px" }}>
                    EXPECTED: {fmt(grand.expected)} · RECEIVED: {fmt(grand.sent)}
                  </p>
                </div>
              </div>
            )}
            {Math.abs(grandDiff) < 1 && grand.sent > 0 && (
              <div style={{ background: "rgba(0,201,141,0.07)", border: "1px solid var(--green)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: "var(--green)", fontSize: "18px" }}>✓</span>
                <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--green)" }}>ALL BRANCHES BALANCED — {fmt(grand.sent)} RECEIVED AS EXPECTED</p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <StatCard label="Total Cash In"          value={fmt(grand.cash)}     accent="blue" />
              <StatCard label="Total POS In"           value={fmt(grand.pos)}      accent="green" />
              <StatCard label="Expected from Branches" value={fmt(grand.expected)} />
              <StatCard label="Actually Received"      value={fmt(grand.sent)} accent={grandDiff >= 0 ? "green" : "red"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <StatCard label="Branch Expenses" value={fmt(grand.branchExp)} accent="red" />
              <StatCard label="Total Bonus Due" value={fmt(grand.bonus)}     accent="blue" sub="All riders" />
              <StatCard label="Total Orders"    value={grand.orders} />
            </div>

            {/* Branch quick-glance */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {branchStats.map((b) => (
                <Card key={b.branch}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(30,111,255,0.15)", border: "1px solid var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontSize: "10px", fontWeight: 800, color: "var(--blue-light)" }}>{b.branch[0]}</div>
                    <span style={{ fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700 }}>{b.branch}</span>
                  </div>
                  <p style={{ fontFamily: "var(--display)", fontSize: "16px", fontWeight: 700, color: "var(--blue-light)", marginBottom: "4px" }}>{fmt(b.cash + b.pos)}</p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)" }}>{b.delivered}/{b.total} delivered</p>
                  {Math.abs(b.diff) < 1 && b.totalSent > 0 && <div style={{ marginTop: "8px" }}><Tag label="✓ BALANCED" type="green" /></div>}
                  {b.diff < 0 && <div style={{ marginTop: "8px" }}><Tag label={`SHORT ${fmt(Math.abs(b.diff))}`} type="red" /></div>}
                  {b.diff > 0 && <div style={{ marginTop: "8px" }}><Tag label={`OVER ${fmt(b.diff)}`} type="amber" /></div>}
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === "remittances" && (
          <div className="fade-in">
            <SectionTitle title="BRANCH REMITTANCES" sub="Expected vs actually sent — differences flagged instantly" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <StatCard label="Expected"   value={fmt(grand.expected)} />
              <StatCard label="Received"   value={fmt(grand.sent)} accent={grandDiff >= 0 ? "green" : "red"} />
              <StatCard label="Difference" value={Math.abs(grandDiff) < 1 ? "EXACT" : grandDiff < 0 ? `-${fmt(Math.abs(grandDiff))}` : `+${fmt(grandDiff)}`} accent={Math.abs(grandDiff) < 1 ? "green" : grandDiff < 0 ? "red" : "amber"} />
            </div>
            {branchStats.map((b) => (
              <div key={b.branch} style={{ marginBottom: "24px" }}>
                <p className="k-label" style={{ marginBottom: "8px" }}>{b.branch} BRANCH</p>
                {b.remitRecs.length > 0
                  ? b.remitRecs.map((r) => <BranchRemitCard key={r.id} rec={r} />)
                  : (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: "13px", color: "var(--text-dim)" }}>{b.branch} — no remittance logged</p>
                        <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)", marginTop: "2px" }}>Expected: {fmt(b.expected)}</p>
                      </div>
                      {b.expected > 0 && <Tag label="⚠ NOT SENT" type="red" />}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {tab === "branches" && (
          <div className="fade-in">
            <SectionTitle title="BRANCH BREAKDOWN" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {branchStats.map((b) => (
                <Card key={b.branch}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(30,111,255,0.15)", border: "1px solid var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontSize: "12px", fontWeight: 800, color: "var(--blue-light)" }}>{b.branch[0]}</div>
                      <div>
                        <span style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700 }}>{b.branch}</span>
                        <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)", marginTop: "1px" }}>{RIDERS[b.branch].length} RIDERS</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {Math.abs(b.diff) < 1 && b.totalSent > 0 && <Tag label="✓ BALANCED" type="green" />}
                      {b.diff < 0 && <Tag label={`SHORT ${fmt(Math.abs(b.diff))}`} type="red" />}
                      {b.diff > 0 && <Tag label={`OVER ${fmt(b.diff)}`} type="amber" />}
                      <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)" }}>{b.delivered}/{b.total} delivered</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                    {[
                      ["Cash In", fmt(b.cash), "var(--blue-light)"],
                      ["POS In", fmt(b.pos), "var(--green)"],
                      ["Expected", fmt(b.expected), "var(--text)"],
                      ["Received", fmt(b.totalSent), b.diff < 0 ? "var(--red)" : Math.abs(b.diff) < 1 && b.totalSent > 0 ? "var(--green)" : "var(--text)"],
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ background: "var(--bg)", borderRadius: "6px", padding: "10px" }}>
                        <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-faint)", marginBottom: "3px" }}>{label}</p>
                        <p style={{ fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700, color }}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>Branch expenses: <span style={{ color: "var(--red)" }}>{fmt(b.branchExp)}</span></span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>Bonus payable: <span style={{ color: "var(--blue-light)" }}>{fmt(b.totalBonus)}</span></span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === "riders" && (
          <div className="fade-in">
            <SectionTitle title="ALL RIDERS — BONUS OVERVIEW" />
            <div style={{ background: "rgba(30,111,255,0.06)", border: "1px solid var(--blue)", borderRadius: "10px", padding: "20px", marginBottom: "20px" }}>
              <p className="k-label">// TOTAL BONUS PAYABLE — ALL BRANCHES</p>
              <p style={{ fontFamily: "var(--display)", fontSize: "28px", fontWeight: 800, color: "var(--blue-light)", lineHeight: 1, marginBottom: "4px" }}>{fmt(grand.bonus)}</p>
              <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>{RIDERS.AJA.length + RIDERS.IDIMU.length + RIDERS.KETU.length} RIDERS ACROSS {BRANCHES.length} BRANCHES</p>
            </div>
            {BRANCHES.map((b) => (
              <div key={b} style={{ marginBottom: "20px" }}>
                <p className="k-label" style={{ marginBottom: "10px" }}>{b} BRANCH — {RIDERS[b].length} RIDERS</p>
                <Card>
                  {RIDERS[b].map((name) => {
                    const count = orders.filter((o) => o.rider === name).length;
                    return <RiderBonusRow key={name} name={name} orderCount={count} />;
                  })}
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="k-label" style={{ margin: 0 }}>{b} TOTAL BONUS</span>
                    <span style={{ fontFamily: "var(--display)", fontSize: "14px", fontWeight: 700, color: "var(--blue-light)" }}>
                      {fmt(RIDERS[b].reduce((s, n) => s + calcBonus(orders.filter((o) => o.rider === n).length), 0))}
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        {tab === "orders" && (
          <div className="fade-in">
            <SectionTitle title="ALL ORDERS" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {fOrders.map((o) => {
                const st = STATUS_TAG[o.status];
                return (
                  <div key={o.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: 500 }}>{o.product}</span>
                          <span className="tag" style={{ background: st.bg, color: st.color, borderColor: st.border }}>{o.status}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <RiderAvatar name={o.rider} size={16} />
                          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>{o.rider}</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>·</span>
                          <Tag label={o.branch} type="blue" />
                          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-faint)" }}>{o.date}</span>
                        </div>
                      </div>
                      <p style={{ fontFamily: "var(--display)", fontSize: "14px", fontWeight: 700, color: "var(--text)", marginLeft: "12px" }}>{fmt((o.cashValue || 0) + (o.posValue || 0))}</p>
                    </div>
                  </div>
                );
              })}
              {fOrders.length === 0 && <p style={{ textAlign: "center", padding: "48px 0", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-faint)" }}>NO ORDERS IN THIS PERIOD</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  if (!session) return <LoginScreen onLogin={(role, branch) => setSession({ role, branch })} />;
  if (session.role === "boss")          return <BossView onLogout={() => setSession(null)} />;
  if (session.role === "manager")       return <ManagerView branch={session.branch} onLogout={() => setSession(null)} />;
  if (session.role === "rider-manager") return <RiderManagerView branch={session.branch} onLogout={() => setSession(null)} />;
}
