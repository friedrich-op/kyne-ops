import { useState, useEffect } from "react";

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

// ─── TODAY using local date (not UTC) ─────────────────────────────────────────
const TODAY = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})();

// ─── BONUS PERIOD: 15th → 14th of next month ──────────────────────────────────
function getBonusPeriod() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  let sY = y, sM = m, eY = y, eM = m;
  if (d >= 15) {
    sM = m; eM = m + 1;
    if (eM > 11) { eM = 0; eY = y + 1; }
  } else {
    sM = m - 1; eM = m;
    if (sM < 0) { sM = 11; sY = y - 1; }
  }
  const start = `${sY}-${String(sM + 1).padStart(2, "0")}-15`;
  const end   = `${eY}-${String(eM + 1).padStart(2, "0")}-14`;
  const fmt2  = (y, m, d) => new Date(y, m, d).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  return { start, end, label: `${fmt2(sY, sM, 15)} – ${fmt2(eY, eM, 14, { year: "numeric" })}` };
}

function isInBonusPeriod(dateStr) {
  const { start, end } = getBonusPeriod();
  return dateStr >= start && dateStr <= end;
}

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

// ─── GOOGLE SHEETS ────────────────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbxImtEJesdzwnkES5wg7n76cI_n9k72ZTL5hr6rYbHWwavvixelAiB6bCpycorz8GF0/exec";

async function sheetGet(tab) {
  try {
    const res = await fetch(`${API_URL}?tab=${tab}`);
    const data = await res.json();
    return data.map(row => ({
      ...row,
      // Strip timestamps — sheets returns "2026-03-05T23:00:00.000Z" sometimes
      date:           row.date ? String(row.date).split("T")[0] : "",
      cashValue:      Number(row.cashValue)      || 0,
      posValue:       Number(row.posValue)        || 0,
      roadExpense:    Number(row.roadExpense)      || 0,
      amount:         Number(row.amount)          || 0,
      expectedAmount: Number(row.expectedAmount)  || 0,
      remittedAmount: Number(row.remittedAmount)  || 0,
      riderRemitted:  row.riderRemitted === "true" || row.riderRemitted === true,
    }));
  } catch { return []; }
}
async function sheetAdd(tab, data) {
  try { await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "add", tab, data }) }); } catch {}
}
async function sheetUpdate(tab, data) {
  try { await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "update", tab, data }) }); } catch {}
}

// ─── DATE FILTER ──────────────────────────────────────────────────────────────
function filterByPeriod(list, mode, customDate) {
  if (mode === "custom" && customDate) return list.filter(o => o.date === customDate);
  if (mode === "today")  return list.filter(o => o.date === TODAY);
  if (mode === "week") {
    const now = new Date();
    const dow = now.getDay(); // 0=Sun
    const mon = new Date(now);
    mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    });
    return list.filter(o => dates.includes(o.date));
  }
  if (mode === "month") return list.filter(o => o.date.startsWith(TODAY.slice(0, 7)));
  return list;
}

function calcBranchExpected(orders) {
  return orders.filter(o => o.status === "Delivered").reduce((s, o) => s + calcRiderOwed(o), 0);
}

// ─── CREDENTIALS ─────────────────────────────────────────────────────────────
const USERS = [
  { username: "Boss",          password: "kyne@boss2025",   role: "boss",          branch: null    },
  { username: "idimu manager", password: "idimukyne@2021",  role: "manager",       branch: "IDIMU" },
  { username: "aja manager",   password: "ajakyne@2022",    role: "manager",       branch: "AJA"   },
  { username: "ketu manager",  password: "ketukyne@2023",   role: "manager",       branch: "KETU"  },
  { username: "idimu rider",   password: "idimurider@2021", role: "rider-manager", branch: "IDIMU" },
  { username: "aja rider",     password: "ajarider@2022",   role: "rider-manager", branch: "AJA"   },
  { username: "ketu rider",    password: "keturider@2023",  role: "rider-manager", branch: "KETU"  },
];

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #eef2fb;
    --surface: #ffffff;
    --surface2: #f5f8ff;
    --border: #dde6f5;
    --border2: #c5d4ee;
    --blue: #1a56db;
    --blue-dk: #1344b8;
    --blue-lt: #60a5fa;
    --blue-pale: #eff4ff;
    --blue-pale2: #dbeafe;
    --text: #0f172a;
    --text-dim: #475569;
    --text-faint: #94a3b8;
    --green: #059669;
    --green-pale: #ecfdf5;
    --green-border: #a7f3d0;
    --red: #dc2626;
    --red-pale: #fef2f2;
    --red-border: #fecaca;
    --amber: #d97706;
    --amber-pale: #fffbeb;
    --amber-border: #fde68a;
    --navy: #0c2461;
    --navy2: #0a1f50;
    --shadow: 0 1px 3px rgba(15,23,42,.07), 0 1px 2px rgba(15,23,42,.04);
    --shadow-md: 0 4px 14px rgba(15,23,42,.09);
    --r: 10px; --r-sm: 6px; --r-lg: 14px;
    --display: 'Plus Jakarta Sans', sans-serif;
    --body: 'Inter', sans-serif;
  }
  body { background: var(--bg); font-family: var(--body); color: var(--text); -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
  input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: .5; }
  select option { background: #fff; color: #0f172a; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes shake     { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }

  .fade-up    { animation: fadeUp    .4s cubic-bezier(.22,.68,0,1.2) both; }
  .fade-in    { animation: fadeIn    .3s ease both; }
  .slide-down { animation: slideDown .25s ease both; }
  .shake      { animation: shake     .4s ease; }
  .pulse-anim { animation: pulse     2s ease-in-out infinite; }

  .k-input {
    width: 100%; background: #fff; border: 1.5px solid var(--border);
    color: var(--text); border-radius: var(--r-sm); padding: 9px 12px;
    font-size: 13.5px; font-family: var(--body);
    transition: border-color .15s, box-shadow .15s; outline: none;
  }
  .k-input::placeholder { color: var(--text-faint); }
  .k-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(26,86,219,.1); }
  .k-label { display: block; font-size: 11px; font-weight: 600; color: var(--text-dim); margin-bottom: 5px; letter-spacing: .04em; }
`;

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function KyneLogo({ size = 28, dark = false }) {
  const c1 = dark ? "#1a56db" : "#fff";
  const c2 = dark ? "#60a5fa" : "rgba(255,255,255,.7)";
  return (
    <svg width={size} height={size * .7} viewBox="0 0 80 56" fill="none">
      <path d="M10 6 L10 50"  stroke={c1} strokeWidth="8" strokeLinecap="round"/>
      <path d="M10 28 L34 6"  stroke={c1} strokeWidth="8" strokeLinecap="round"/>
      <path d="M10 28 L36 50" stroke={c2} strokeWidth="8" strokeLinecap="round"/>
      <path d="M24 16 L40 6"  stroke={c2} strokeWidth="5" strokeLinecap="round" opacity=".65"/>
    </svg>
  );
}

const ST = {
  Delivered:       { bg: "#eff4ff", color: "#1a56db", border: "#bfdbfe" },
  "Not Delivered": { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  Failed:          { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
function Tag({ label, type = "zinc" }) {
  const S = {
    zinc:  { bg:"#f1f5f9", color:"#64748b", border:"#e2e8f0" },
    blue:  { bg:"#eff4ff", color:"#1a56db", border:"#bfdbfe" },
    green: { bg:"#ecfdf5", color:"#059669", border:"#a7f3d0" },
    red:   { bg:"#fef2f2", color:"#dc2626", border:"#fecaca" },
    amber: { bg:"#fffbeb", color:"#d97706", border:"#fde68a" },
    navy:  { bg:"#0c2461", color:"#ffffff", border:"#0c2461" },
  }[type] || { bg:"#f1f5f9", color:"#64748b", border:"#e2e8f0" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", fontSize:"10px", fontWeight:600,
      padding:"3px 8px", borderRadius:"99px", border:`1px solid ${S.border}`,
      background:S.bg, color:S.color, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  const A = {
    blue:  { border:"#bfdbfe", bg:"#eff4ff", val:"#1a56db" },
    green: { border:"#a7f3d0", bg:"#ecfdf5", val:"#059669" },
    red:   { border:"#fecaca", bg:"#fef2f2", val:"#dc2626" },
    amber: { border:"#fde68a", bg:"#fffbeb", val:"#d97706" },
  }[accent] || { border:"#dde6f5", bg:"#fff", val:"#0f172a" };
  return (
    <div style={{ background:A.bg, border:`1.5px solid ${A.border}`, borderRadius:"var(--r)",
      padding:"14px 16px", boxShadow:"var(--shadow)" }}>
      <p style={{ fontSize:"10px", fontWeight:600, color:"#94a3b8", textTransform:"uppercase",
        letterSpacing:".06em", marginBottom:"6px" }}>{label}</p>
      <p style={{ fontFamily:"var(--display)", fontSize:"20px", fontWeight:800, color:A.val, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:"11px", color:"#94a3b8", marginTop:"4px" }}>{sub}</p>}
    </div>
  );
}

function Card({ children, accent, style = {}, className = "" }) {
  const border = accent === "blue" ? "#bfdbfe" : accent === "red" ? "#fecaca" : "#dde6f5";
  const bg     = accent === "blue" ? "#eff4ff" : accent === "red" ? "#fef2f2" : "#fff";
  return (
    <div className={className} style={{ background:bg, border:`1.5px solid ${border}`,
      borderRadius:"var(--r)", padding:"16px", boxShadow:"var(--shadow)", ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom:"16px" }}>
      <h2 style={{ fontFamily:"var(--display)", fontSize:"15px", fontWeight:800, color:"var(--text)" }}>{title}</h2>
      {sub && <p style={{ fontSize:"12px", color:"var(--text-faint)", marginTop:"2px" }}>{sub}</p>}
    </div>
  );
}

function PeriodFilter({ mode, setMode, customDate, setCustomDate }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"16px", flexWrap:"wrap" }}>
      {[["today","Today"],["week","Week"],["month","Month"],["all","All"]].map(([id, lbl]) => (
        <button key={id} onClick={() => setMode(id)} style={{
          padding:"5px 14px", borderRadius:"99px", fontSize:"12px", fontWeight:600, cursor:"pointer",
          border:`1.5px solid ${mode===id ? "var(--blue)" : "var(--border)"}`,
          background: mode===id ? "var(--blue)" : "#fff",
          color: mode===id ? "#fff" : "var(--text-dim)", transition:"all .15s",
        }}>{lbl}</button>
      ))}
      <div style={{ marginLeft:"auto", display:"flex", gap:"6px", alignItems:"center" }}>
        <input type="date" value={customDate}
          onChange={e => { setCustomDate(e.target.value); setMode("custom"); }}
          className="k-input"
          style={{ width:"140px", fontSize:"12px", padding:"5px 10px",
            borderColor: mode==="custom" ? "var(--blue)" : "var(--border)" }}/>
        {mode === "custom" && customDate && (
          <button onClick={() => { setMode("today"); setCustomDate(""); }}
            style={{ background:"#fff", border:"1.5px solid var(--border)", color:"var(--text-dim)",
              borderRadius:"var(--r-sm)", padding:"5px 8px", fontSize:"12px", cursor:"pointer" }}>✕</button>
        )}
      </div>
    </div>
  );
}

function TopNav({ subtitle, tabs, activeTab, setActiveTab, onLogout, syncing }) {
  return (
    <div style={{ background:"var(--navy)", position:"sticky", top:0, zIndex:20,
      boxShadow:"0 2px 12px rgba(12,36,97,.3)" }}>
      {syncing && (
        <div style={{ background:"rgba(96,165,250,.18)", padding:"4px", textAlign:"center",
          fontSize:"10px", fontWeight:600, color:"#93c5fd", letterSpacing:".08em" }}>
          ⟳ SYNCING WITH SHEETS...
        </div>
      )}
      <div style={{ maxWidth:"960px", margin:"0 auto", padding:"0 16px", height:"56px",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
          <div style={{ background:"#fff", borderRadius:"8px", padding:"5px 10px",
            display:"flex", alignItems:"center", gap:"8px", boxShadow:"0 1px 4px rgba(0,0,0,.12)" }}>
            <KyneLogo size={22} dark/>
            <span style={{ fontFamily:"var(--display)", fontSize:"14px", fontWeight:800, color:"var(--navy)" }}>Kyne</span>
          </div>
          {subtitle && <p style={{ fontSize:"11px", color:"rgba(255,255,255,.45)", fontWeight:500 }}>{subtitle}</p>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"2px", flexWrap:"wrap", justifyContent:"flex-end" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding:"6px 11px", fontSize:"12px", fontWeight:600, cursor:"pointer",
              border:"none", background: activeTab===t.id ? "rgba(255,255,255,.16)" : "transparent",
              color: activeTab===t.id ? "#fff" : "rgba(255,255,255,.5)",
              borderBottom: activeTab===t.id ? "2px solid #60a5fa" : "2px solid transparent",
              transition:"all .15s",
            }}>{t.label}</button>
          ))}
          <button onClick={onLogout} style={{ marginLeft:"6px", padding:"5px 10px",
            borderRadius:"var(--r-sm)", background:"rgba(255,255,255,.08)",
            border:"1px solid rgba(255,255,255,.18)", color:"rgba(255,255,255,.55)",
            fontSize:"11px", fontWeight:500, cursor:"pointer" }}>← Exit</button>
        </div>
      </div>
    </div>
  );
}

function RiderAvatar({ name, size = 32 }) {
  const p = [["#dbeafe","#1d4ed8"],["#dcfce7","#15803d"],["#fef9c3","#a16207"],
             ["#fee2e2","#b91c1c"],["#f3e8ff","#7e22ce"],["#cffafe","#0e7490"]];
  const [bg, color] = p[name.charCodeAt(0) % p.length];
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"var(--display)", fontSize:size*.4, fontWeight:700,
      background:bg, color, border:`1.5px solid ${color}22` }}>
      {name[0].toUpperCase()}
    </div>
  );
}

function OrderRow({ order, onMarkPaid }) {
  const owed    = calcRiderOwed(order);
  const cashOwed = order.status==="Delivered" ? Math.max(0,(order.cashValue||0)-(order.roadExpense||0)) : 0;
  const posOwed  = order.status==="Delivered" ? (order.posValue||0) : 0;
  const st = ST[order.status] || ST.Failed;
  return (
    <div style={{ background:"#fff", border:"1.5px solid var(--border)", borderRadius:"var(--r)",
      padding:"12px 14px", opacity: order.riderRemitted ? .65 : 1, boxShadow:"var(--shadow)" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px" }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"7px", flexWrap:"wrap", marginBottom:"4px" }}>
            <span style={{ fontSize:"13.5px", fontWeight:600 }}>{order.product}</span>
            <span style={{ fontSize:"10px", fontWeight:600, padding:"2px 8px", borderRadius:"99px",
              border:`1px solid ${st.border}`, background:st.bg, color:st.color }}>{order.status}</span>
            {order.riderRemitted
              ? <Tag label="✓ Remitted" type="green"/>
              : order.status==="Delivered" && <Tag label="Pending" type="amber"/>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"5px" }}>
            <RiderAvatar name={order.rider} size={17}/>
            <span style={{ fontSize:"12px", color:"var(--text-dim)", fontWeight:500 }}>{order.rider}</span>
            <span style={{ color:"var(--border2)" }}>·</span>
            <span style={{ fontSize:"11px", color:"var(--text-faint)" }}>{order.date}</span>
          </div>
          <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
            {order.cashValue > 0  && <span style={{ fontSize:"11px", color:"var(--text-dim)" }}>💵 {fmt(order.cashValue)}</span>}
            {order.posValue > 0   && <span style={{ fontSize:"11px", color:"var(--text-dim)" }}>💳 {fmt(order.posValue)}</span>}
            {order.roadExpense > 0 && <span style={{ fontSize:"11px", color:"var(--text-faint)" }}>🛣 {fmt(order.roadExpense)} · {order.expenseNote}</span>}
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <p style={{ fontFamily:"var(--display)", fontSize:"14px", fontWeight:700 }}>
            {fmt((order.cashValue||0)+(order.posValue||0))}
          </p>
          {order.status==="Delivered" && !order.riderRemitted &&
            <p style={{ fontSize:"11px", color:"var(--amber)", marginTop:"2px" }}>owes {fmt(owed)}</p>}
        </div>
      </div>
      {order.status==="Delivered" && !order.riderRemitted && onMarkPaid && (
        <div style={{ marginTop:"10px", paddingTop:"10px", borderTop:"1.5px solid var(--border)",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", gap:"16px" }}>
            <span style={{ fontSize:"11px", color:"var(--text-faint)" }}>Cash: <strong style={{color:"var(--text)"}}>{fmt(cashOwed)}</strong></span>
            <span style={{ fontSize:"11px", color:"var(--text-faint)" }}>POS: <strong style={{color:"var(--text)"}}>{fmt(posOwed)}</strong></span>
          </div>
          <button onClick={() => onMarkPaid(order.id)} style={{
            background:"var(--green)", color:"#fff", border:"none", borderRadius:"var(--r-sm)",
            padding:"6px 14px", fontSize:"11px", fontWeight:700, cursor:"pointer",
            boxShadow:"0 2px 6px rgba(5,150,105,.25)" }}>Mark Paid ✓</button>
        </div>
      )}
    </div>
  );
}

function RemitCard({ rec }) {
  const diff = rec.remittedAmount - rec.expectedAmount;
  const ok   = Math.abs(diff) < 1;
  const low  = diff < 0;
  return (
    <div style={{ background: low&&!ok?"#fef2f2":ok&&rec.remittedAmount>0?"#ecfdf5":"#fff",
      border:`1.5px solid ${low&&!ok?"#fecaca":ok&&rec.remittedAmount>0?"#a7f3d0":"#dde6f5"}`,
      borderRadius:"var(--r)", padding:"16px", marginBottom:"10px", boxShadow:"var(--shadow)" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"12px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
            <span style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:700 }}>{rec.branch}</span>
            <span style={{ fontSize:"11px", color:"var(--text-faint)" }}>{rec.date}</span>
          </div>
          <p style={{ fontSize:"11px", color:"var(--text-dim)" }}>TX: <span style={{ fontFamily:"monospace", color:"var(--blue)", fontWeight:600 }}>{rec.txID}</span></p>
          {rec.note && <p style={{ fontSize:"11px", color:"var(--text-faint)", marginTop:"2px" }}>{rec.note}</p>}
        </div>
        {ok ? <Tag label="✓ Balanced" type="green"/> : low ? <Tag label={`Short ${fmt(Math.abs(diff))}`} type="red"/> : <Tag label={`Over ${fmt(diff)}`} type="amber"/>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
        {[["Should Remit", fmt(rec.expectedAmount), "var(--text)"],
          ["Sent", fmt(rec.remittedAmount), ok?"var(--green)":low?"var(--red)":"var(--amber)"],
          ["Diff", ok?"Exact":low?`-${fmt(Math.abs(diff))}`:`+${fmt(diff)}`, ok?"var(--green)":low?"var(--red)":"var(--amber)"],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background:"var(--surface2)", border:"1px solid var(--border)",
            borderRadius:"var(--r-sm)", padding:"10px", textAlign:"center" }}>
            <p style={{ fontSize:"9px", fontWeight:600, color:"var(--text-faint)", textTransform:"uppercase",
              letterSpacing:".06em", marginBottom:"4px" }}>{label}</p>
            <p style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:700, color }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BonusRow({ name, count }) {
  const bonus = calcBonus(count);
  const rate  = getBonusRate(count);
  const next  = count<=200?200:count<=250?250:count<=300?300:null;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        <RiderAvatar name={name} size={30}/>
        <div>
          <p style={{ fontSize:"13px", fontWeight:600 }}>{name}</p>
          <p style={{ fontSize:"10px", color:"var(--text-faint)" }}>{count} orders · ₦{rate}/order</p>
        </div>
      </div>
      <div style={{ textAlign:"right" }}>
        <p style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:700, color:"var(--blue)" }}>{fmt(bonus)}</p>
        {next && <p style={{ fontSize:"10px", color:"var(--text-faint)" }}>{next - count} to next tier</p>}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [shake, setShake]       = useState(false);

  function submit() {
    setError("");
    const u = USERS.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (!u) { setError("Invalid username or password."); setShake(true); setTimeout(()=>setShake(false),500); return; }
    setLoading(true);
    setTimeout(() => onLogin(u.role, u.branch), 380);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      padding:"24px", background:"var(--navy)", fontFamily:"var(--body)" }}>
      <style>{GS}</style>
      <div className="fade-up" style={{ width:"100%", maxWidth:"380px" }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"12px",
            background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)",
            borderRadius:"14px", padding:"14px 24px", marginBottom:"14px" }}>
            <KyneLogo size={34}/>
            <div style={{ textAlign:"left" }}>
              <p style={{ fontFamily:"var(--display)", fontSize:"24px", fontWeight:800, color:"#fff", lineHeight:1 }}>Kyne</p>
              <p style={{ fontSize:"10px", color:"rgba(255,255,255,.45)", marginTop:"2px", letterSpacing:".1em" }}>LOGISTICS OPS PORTAL</p>
            </div>
          </div>
          <p style={{ fontSize:"11px", color:"rgba(255,255,255,.3)", letterSpacing:".12em" }}>YOUR E-COMMERCE LOGISTICS BRO</p>
        </div>

        <div className={shake?"shake":""} style={{ background:"#fff", borderRadius:"16px",
          padding:"28px", boxShadow:"0 20px 60px rgba(0,0,0,.28)" }}>
          <p style={{ fontSize:"11px", fontWeight:600, color:"var(--text-faint)", letterSpacing:".06em",
            textTransform:"uppercase", marginBottom:"20px" }}>Sign in to your portal</p>

          <div style={{ marginBottom:"14px" }}>
            <label className="k-label">Username</label>
            <input className="k-input" placeholder="e.g. idimu manager" value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              onKeyDown={e => e.key==="Enter" && submit()}
              style={{ borderColor: error?"var(--red)":undefined }}/>
          </div>
          <div style={{ marginBottom:"20px" }}>
            <label className="k-label">Password</label>
            <div style={{ position:"relative" }}>
              <input className="k-input" type={showPass?"text":"password"} placeholder="Enter your password"
                value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key==="Enter" && submit()}
                style={{ paddingRight:"52px", borderColor: error?"var(--red)":undefined }}/>
              <button onClick={() => setShowPass(p=>!p)} style={{ position:"absolute", right:"10px",
                top:"50%", transform:"translateY(-50%)", background:"none", border:"none",
                cursor:"pointer", fontSize:"10px", fontWeight:600, color:"var(--text-faint)" }}>
                {showPass?"HIDE":"SHOW"}
              </button>
            </div>
          </div>

          {error && (
            <div className="slide-down" style={{ background:"#fef2f2", border:"1px solid #fecaca",
              borderRadius:"var(--r-sm)", padding:"10px 12px", marginBottom:"16px",
              display:"flex", alignItems:"center", gap:"8px" }}>
              <span>⚠️</span>
              <span style={{ fontSize:"12px", color:"var(--red)", fontWeight:500 }}>{error}</span>
            </div>
          )}

          <button onClick={submit} disabled={!username||!password} style={{
            width:"100%", padding:"12px",
            background: !username||!password ? "#f1f5f9" : "linear-gradient(135deg,var(--blue),var(--blue-dk))",
            border:"none", borderRadius:"var(--r-sm)",
            color: !username||!password ? "#94a3b8" : "#fff",
            fontFamily:"var(--display)", fontSize:"13px", fontWeight:700,
            cursor: !username||!password ? "not-allowed" : "pointer",
            boxShadow: !username||!password ? "none" : "0 4px 14px rgba(26,86,219,.35)",
            transition:"all .2s",
          }}>{loading ? "Signing in..." : "Sign In →"}</button>
        </div>
        <p style={{ textAlign:"center", fontSize:"10px", color:"rgba(255,255,255,.22)",
          marginTop:"16px", letterSpacing:".1em" }}>KYNE OPERATIONS · RESTRICTED ACCESS</p>
      </div>
    </div>
  );
}

// ─── RIDER MANAGER ────────────────────────────────────────────────────────────
function RiderManagerView({ branch, onLogout }) {
  const [tab, setTab]           = useState("log");
  const [orders, setOrders]     = useState([]);
  const [syncing, setSyncing]   = useState(true);
  const [saved, setSaved]       = useState(false);
  const [mode, setMode]         = useState("today");
  const [customDate, setCustomDate] = useState("");
  const blank = { date:TODAY, rider:RIDERS[branch][0], product:"", cashValue:"", posValue:"", roadExpense:"", expenseNote:"", status:"Delivered" };
  const [form, setForm] = useState(blank);
  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  useEffect(() => {
    setSyncing(true);
    sheetGet("Orders").then(d => setOrders(d.filter(o => o.branch===branch))).catch(()=>{}).finally(()=>setSyncing(false));
  }, [branch]);

  function handleSubmit() {
    if (!form.date || !form.product) return;
    const o = { ...form, id:Date.now(), cashValue:Number(form.cashValue)||0, posValue:Number(form.posValue)||0, roadExpense:Number(form.roadExpense)||0, riderRemitted:false, branch };
    setOrders(p => [o,...p]);
    setForm(blank); setSaved(true); setTimeout(()=>setSaved(false),3000);
    sheetAdd("Orders", o).catch(()=>{});
  }

  const filtered  = filterByPeriod(orders, mode, customDate);
  const totalCash = filtered.reduce((s,o) => s+(o.cashValue||0), 0);
  const totalPOS  = filtered.reduce((s,o) => s+(o.posValue||0),  0);
  const totalRoad = filtered.reduce((s,o) => s+(o.roadExpense||0), 0);
  const preview   = Math.max(0,(Number(form.cashValue)||0)-(Number(form.roadExpense)||0)) + (Number(form.posValue)||0);
  const period    = getBonusPeriod();
  const TABS = [{id:"log",label:"Log Order"},{id:"orders",label:"Orders"},{id:"riders",label:"Riders"}];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <style>{GS}</style>
      <TopNav subtitle={`${branch} · Rider Manager`} tabs={TABS} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} syncing={syncing}/>
      <div style={{ maxWidth:"720px", margin:"0 auto", padding:"20px 16px" }}>

        {tab==="log" && (
          <div className="fade-in">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
              <SectionTitle title="Log New Order" sub="Select rider and fill in delivery details"/>
              {saved && <Tag label="✓ Saved" type="green"/>}
            </div>
            <Card>
              <label className="k-label">Select Rider</label>
              <select value={form.rider} onChange={e=>set("rider",e.target.value)}
                className="k-input" style={{ fontWeight:600, marginBottom:"20px", borderColor:"var(--blue)" }}>
                {RIDERS[branch].map(r => <option key={r}>{r}</option>)}
              </select>

              <div style={{ height:"1px", background:"var(--border)", margin:"0 0 16px"}}/>
              <p style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase",
                letterSpacing:".04em", marginBottom:"12px" }}>Delivery Details</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
                <div>
                  <label className="k-label">Date</label>
                  <input type="date" className="k-input" value={form.date} onChange={e=>set("date",e.target.value)}/>
                </div>
                <div>
                  <label className="k-label">Status</label>
                  <select className="k-input" value={form.status} onChange={e=>set("status",e.target.value)}>
                    <option>Delivered</option><option>Not Delivered</option><option>Failed</option>
                  </select>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label className="k-label">Product Description</label>
                  <input className="k-input" placeholder="e.g. Electronics, clothing..." value={form.product} onChange={e=>set("product",e.target.value)}/>
                </div>
              </div>

              <div style={{ height:"1px", background:"var(--border)", margin:"0 0 16px"}}/>
              <p style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase",
                letterSpacing:".04em", marginBottom:"12px" }}>Payment Collected</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"6px" }}>
                <div><label className="k-label">💵 Cash (₦)</label><input type="number" className="k-input" placeholder="0" value={form.cashValue} onChange={e=>set("cashValue",e.target.value)}/></div>
                <div><label className="k-label">💳 POS (₦)</label><input type="number" className="k-input" placeholder="0" value={form.posValue} onChange={e=>set("posValue",e.target.value)}/></div>
              </div>
              <p style={{ fontSize:"11px", color:"var(--text-faint)", marginBottom:"16px" }}>Fill both if customer paid with cash + POS</p>

              <div style={{ height:"1px", background:"var(--border)", margin:"0 0 16px"}}/>
              <p style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase",
                letterSpacing:".04em", marginBottom:"12px" }}>Road Expense</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"20px" }}>
                <div><label className="k-label">Amount (₦)</label><input type="number" className="k-input" placeholder="0" value={form.roadExpense} onChange={e=>set("roadExpense",e.target.value)}/></div>
                <div><label className="k-label">Used for?</label><input className="k-input" placeholder="Fuel, toll, parking..." value={form.expenseNote} onChange={e=>set("expenseNote",e.target.value)}/></div>
              </div>

              {(form.cashValue || form.posValue) && (
                <div style={{ background:"var(--blue-pale)", border:"1.5px solid var(--blue-pale2)",
                  borderRadius:"var(--r)", padding:"14px", marginBottom:"20px" }}>
                  <p style={{ fontSize:"11px", fontWeight:600, color:"var(--blue)", textTransform:"uppercase",
                    letterSpacing:".04em", marginBottom:"10px" }}>Remittance Preview</p>
                  {[
                    ["Cash collected", fmt(form.cashValue||0), "var(--text)"],
                    ["− Road expense", `−${fmt(form.roadExpense||0)}`, "var(--red)"],
                    ["Cash to remit",  fmt(Math.max(0,(Number(form.cashValue)||0)-(Number(form.roadExpense)||0))), "var(--text)"],
                    ["POS to remit",   fmt(form.posValue||0), "var(--text)"],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                      <span style={{ fontSize:"12px", color:"var(--text-faint)" }}>{label}</span>
                      <span style={{ fontSize:"12px", color, fontWeight:500 }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ height:"1px", background:"var(--blue-pale2)", margin:"8px 0"}}/>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:"12px", fontWeight:600, color:"var(--text-dim)" }}>Rider owes total</span>
                    <span style={{ fontFamily:"var(--display)", fontSize:"15px", fontWeight:800, color:"var(--blue)" }}>{fmt(preview)}</span>
                  </div>
                </div>
              )}

              <button onClick={handleSubmit} disabled={!form.date||!form.product} style={{
                width:"100%", padding:"12px",
                background: !form.date||!form.product ? "#f1f5f9" : "linear-gradient(135deg,var(--blue),var(--blue-dk))",
                border:"none", borderRadius:"var(--r-sm)",
                color: !form.date||!form.product ? "#94a3b8" : "#fff",
                fontFamily:"var(--display)", fontSize:"13px", fontWeight:700,
                cursor: !form.date||!form.product ? "not-allowed" : "pointer",
                boxShadow: !form.date||!form.product ? "none" : "0 4px 14px rgba(26,86,219,.3)",
              }}>Save Order →</button>
            </Card>
          </div>
        )}

        {tab==="orders" && (
          <div className="fade-in">
            <SectionTitle title="Orders Log"/>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
              <StatCard label="Total Cash"  value={fmt(totalCash)} accent="blue"/>
              <StatCard label="Total POS"   value={fmt(totalPOS)}  accent="green"/>
              <StatCard label="Road Exp"    value={fmt(totalRoad)} accent="red"/>
              <StatCard label="Orders"      value={filtered.length}/>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {filtered.map(o => <OrderRow key={o.id} order={o}/>)}
              {filtered.length===0 && <p style={{ textAlign:"center", padding:"48px 0", fontSize:"13px", color:"var(--text-faint)" }}>No orders in this period</p>}
            </div>
          </div>
        )}

        {tab==="riders" && (
          <div className="fade-in">
            <SectionTitle title="Rider Summary"/>
            <div style={{ background:"var(--navy)", borderRadius:"var(--r)", padding:"14px 16px",
              marginBottom:"16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontSize:"10px", fontWeight:600, color:"rgba(255,255,255,.5)",
                  textTransform:"uppercase", letterSpacing:".08em", marginBottom:"2px" }}>Current Bonus Period</p>
                <p style={{ fontSize:"13px", fontWeight:600, color:"#fff" }}>{period.label}</p>
              </div>
              <Tag label="15th → 14th" type="navy"/>
            </div>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate}/>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {RIDERS[branch].map(name => {
                const ro   = filterByPeriod(orders.filter(o=>o.rider===name), mode, customDate);
                const done = ro.filter(o=>o.status==="Delivered");
                const bonusOrders = orders.filter(o=>o.rider===name && isInBonusPeriod(o.date) && o.status==="Delivered");
                return (
                  <Card key={name}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <RiderAvatar name={name} size={34}/>
                        <span style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:700 }}>{name}</span>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ fontFamily:"var(--display)", fontSize:"14px", fontWeight:700, color:"var(--blue)" }}>{fmt(calcBonus(bonusOrders.length))}</p>
                        <p style={{ fontSize:"10px", color:"var(--text-faint)" }}>₦{getBonusRate(bonusOrders.length)}/order · {bonusOrders.length} in period</p>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"8px" }}>
                      {[
                        ["Cash",  fmt(done.reduce((s,o)=>s+(o.cashValue||0),0)),    "var(--text)"],
                        ["POS",   fmt(done.reduce((s,o)=>s+(o.posValue||0),0)),     "var(--text)"],
                        ["Road",  fmt(ro.reduce((s,o)=>s+(o.roadExpense||0),0)),    "var(--red)"],
                        ["Remit", fmt(done.reduce((s,o)=>s+calcRiderOwed(o),0)),    "var(--blue)"],
                      ].map(([label,val,color]) => (
                        <div key={label} style={{ background:"var(--surface2)", border:"1px solid var(--border)",
                          borderRadius:"var(--r-sm)", padding:"8px", textAlign:"center" }}>
                          <p style={{ fontSize:"9px", fontWeight:600, color:"var(--text-faint)", marginBottom:"3px" }}>{label}</p>
                          <p style={{ fontFamily:"var(--display)", fontSize:"12px", fontWeight:700, color }}>{val}</p>
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

// ─── BRANCH MANAGER ───────────────────────────────────────────────────────────
function ManagerView({ branch, onLogout }) {
  const [tab, setTab]               = useState("dashboard");
  const [orders, setOrders]         = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [syncing, setSyncing]       = useState(true);
  const [mode, setMode]             = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [showExpForm, setShowExpForm] = useState(false);
  const [remitSaved, setRemitSaved] = useState(false);
  const blankExp   = { date:TODAY, description:"", category:"Fuel", amount:"" };
  const blankRemit = { date:TODAY, remittedAmount:"", txID:"", note:"" };
  const [expForm, setExpForm]     = useState(blankExp);
  const [remitForm, setRemitForm] = useState(blankRemit);

  useEffect(() => {
    setSyncing(true);
    Promise.all([sheetGet("Orders"), sheetGet("Expenses"), sheetGet("Remittances")])
      .then(([o,e,r]) => {
        setOrders(o.filter(x=>x.branch===branch));
        setExpenses(e.filter(x=>x.branch===branch));
        setRemittances(r.filter(x=>x.branch===branch));
      }).catch(()=>{}).finally(()=>setSyncing(false));
  }, [branch]);

  function markPaid(id) {
    const updated = orders.map(o => String(o.id)===String(id) ? {...o,riderRemitted:true} : o);
    setOrders(updated);
    const o = updated.find(o => String(o.id)===String(id));
    if (o) sheetUpdate("Orders", {...o,riderRemitted:true}).catch(()=>{});
  }
  function saveExpense() {
    if (!expForm.date||!expForm.description||!expForm.amount) return;
    const e = {...expForm,id:Date.now(),amount:Number(expForm.amount),branch};
    setExpenses(p=>[e,...p]); setExpForm(blankExp); setShowExpForm(false);
    sheetAdd("Expenses",e).catch(()=>{});
  }
  function saveRemittance() {
    if (!remitForm.remittedAmount||!remitForm.txID) return;
    const expected = calcBranchExpected(filterByPeriod(orders,"today",""));
    const r = {...remitForm,id:Date.now(),branch,expectedAmount:expected,remittedAmount:Number(remitForm.remittedAmount)};
    setRemittances(p=>[r,...p]); setRemitForm(blankRemit);
    setRemitSaved(true); setTimeout(()=>setRemitSaved(false),3000);
    sheetAdd("Remittances",r).catch(()=>{});
  }

  const fOrders   = filterByPeriod(orders,   mode, customDate);
  const fExpenses = filterByPeriod(expenses,  mode, customDate);
  const delivered = fOrders.filter(o=>o.status==="Delivered");
  const totalCash = delivered.reduce((s,o)=>s+(o.cashValue||0),0);
  const totalPOS  = delivered.reduce((s,o)=>s+(o.posValue||0),0);
  const totalRoad = fOrders.reduce((s,o)=>s+(o.roadExpense||0),0);
  const totalOwed = delivered.reduce((s,o)=>s+calcRiderOwed(o),0);
  const remitted  = delivered.filter(o=>o.riderRemitted).reduce((s,o)=>s+calcRiderOwed(o),0);
  const outstanding = totalOwed - remitted;
  const totalBranchExp = fExpenses.reduce((s,e)=>s+e.amount,0);
  const todayExpected  = calcBranchExpected(filterByPeriod(orders,"today",""));
  const pendingOrders  = fOrders.filter(o=>o.status==="Delivered"&&!o.riderRemitted);
  const period = getBonusPeriod();
  const totalBonus = RIDERS[branch].reduce((s,n) => {
    const c = orders.filter(o=>o.rider===n&&isInBonusPeriod(o.date)&&o.status==="Delivered").length;
    return s + calcBonus(c);
  }, 0);

  const TABS = [
    {id:"dashboard",label:"Dashboard"},{id:"remittance",label:"Remittance"},
    {id:"send",label:"Send to Boss"},{id:"riders",label:"Riders"},{id:"expenses",label:"Expenses"},
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <style>{GS}</style>
      <TopNav subtitle={`${branch} · Branch Manager`} tabs={TABS} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} syncing={syncing}/>
      <div style={{ maxWidth:"960px", margin:"0 auto", padding:"20px 16px" }}>

        {tab==="dashboard" && (
          <div className="fade-in">
            <SectionTitle title={`${branch} — Dashboard`}/>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px", marginBottom:"10px" }}>
              <StatCard label="Cash In"       value={fmt(totalCash)}      accent="blue"/>
              <StatCard label="POS In"        value={fmt(totalPOS)}       accent="green"/>
              <StatCard label="Road Expenses" value={fmt(totalRoad)}      accent="red"/>
              <StatCard label="Branch Exp"    value={fmt(totalBranchExp)} accent="red"/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"16px" }}>
              <StatCard label="Should Remit"  value={fmt(totalOwed)}/>
              <StatCard label="Outstanding"   value={fmt(outstanding)} accent={outstanding>0?"red":undefined} sub={outstanding>0?`${pendingOrders.length} pending`:"All cleared"}/>
              <StatCard label="Bonus Payable" value={fmt(totalBonus)} accent="blue" sub={period.label}/>
            </div>
            {outstanding > 0 && (
              <div className="pulse-anim" style={{ background:"#fef2f2", border:"1.5px solid #fecaca",
                borderRadius:"var(--r)", padding:"12px 16px", marginBottom:"16px",
                display:"flex", alignItems:"center", gap:"12px" }}>
                <span style={{ fontSize:"20px" }}>⚠️</span>
                <div>
                  <p style={{ fontSize:"13px", fontWeight:600, color:"var(--red)" }}>{fmt(outstanding)} not yet remitted by riders</p>
                  <p style={{ fontSize:"11px", color:"#f87171", marginTop:"2px" }}>Go to Remittance tab to mark paid</p>
                </div>
              </div>
            )}
            <Card>
              <p style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase",
                letterSpacing:".04em", marginBottom:"12px" }}>Delivery Status</p>
              {["Delivered","Not Delivered","Failed"].map(s => {
                const count = fOrders.filter(o=>o.status===s).length;
                const pct   = fOrders.length ? (count/fOrders.length)*100 : 0;
                const st    = ST[s];
                return (
                  <div key={s} style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                    <span style={{ fontSize:"10px", fontWeight:600, padding:"2px 10px", borderRadius:"99px",
                      border:`1px solid ${st.border}`, background:st.bg, color:st.color,
                      width:"110px", textAlign:"center", flexShrink:0 }}>{s}</span>
                    <div style={{ flex:1, height:"6px", borderRadius:"99px", background:"var(--border)", overflow:"hidden" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:st.color, transition:"width .5s ease" }}/>
                    </div>
                    <span style={{ fontSize:"12px", fontWeight:600, color:"var(--text-dim)", width:"18px", textAlign:"right" }}>{count}</span>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {tab==="remittance" && (
          <div className="fade-in">
            <SectionTitle title="Rider Remittance" sub="Mark riders paid once they hand over cash"/>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"16px" }}>
              <StatCard label="Total Owed"  value={fmt(totalOwed)}/>
              <StatCard label="Remitted"    value={fmt(remitted)}     accent="green"/>
              <StatCard label="Outstanding" value={fmt(outstanding)} accent={outstanding>0?"red":undefined}/>
            </div>
            {pendingOrders.length > 0 && (
              <>
                <p style={{ fontSize:"11px", fontWeight:600, color:"var(--amber)", textTransform:"uppercase",
                  letterSpacing:".06em", marginBottom:"8px" }}>⚠ Pending ({pendingOrders.length})</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"20px" }}>
                  {pendingOrders.map(o => <OrderRow key={o.id} order={o} onMarkPaid={markPaid}/>)}
                </div>
              </>
            )}
            {delivered.filter(o=>o.riderRemitted).length > 0 && (
              <>
                <p style={{ fontSize:"11px", fontWeight:600, color:"var(--text-faint)", textTransform:"uppercase",
                  letterSpacing:".06em", marginBottom:"8px" }}>✓ Remitted</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {delivered.filter(o=>o.riderRemitted).map(o => <OrderRow key={o.id} order={o}/>)}
                </div>
              </>
            )}
            {fOrders.length===0 && <p style={{ textAlign:"center", padding:"48px 0", fontSize:"13px", color:"var(--text-faint)" }}>No orders in this period</p>}
          </div>
        )}

        {tab==="send" && (
          <div className="fade-in">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
              <SectionTitle title="Send Remittance to Boss" sub="Log your daily bank transfer"/>
              {remitSaved && <Tag label="✓ Logged" type="green"/>}
            </div>
            <div style={{ background:"var(--navy)", borderRadius:"var(--r)", padding:"20px", marginBottom:"16px" }}>
              <p style={{ fontSize:"10px", fontWeight:600, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:"4px" }}>Today's Expected Remittance</p>
              <p style={{ fontFamily:"var(--display)", fontSize:"32px", fontWeight:800, color:"#fff", lineHeight:1, marginBottom:"4px" }}>{fmt(todayExpected)}</p>
              <p style={{ fontSize:"11px", color:"rgba(255,255,255,.4)" }}>Auto-calculated from today's rider collections</p>
            </div>
            <Card accent="blue">
              <p style={{ fontSize:"11px", fontWeight:600, color:"var(--blue)", textTransform:"uppercase", letterSpacing:".04em", marginBottom:"14px" }}>Log Transfer to Boss</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
                <div><label className="k-label">Date</label><input type="date" className="k-input" value={remitForm.date} onChange={e=>setRemitForm(p=>({...p,date:e.target.value}))}/></div>
                <div><label className="k-label">Amount Sent (₦)</label><input type="number" className="k-input" placeholder="0" value={remitForm.remittedAmount} onChange={e=>setRemitForm(p=>({...p,remittedAmount:e.target.value}))}/></div>
                <div style={{ gridColumn:"1/-1" }}><label className="k-label">Transaction ID</label><input className="k-input" style={{ fontFamily:"monospace" }} placeholder="TRF20250304ABCD" value={remitForm.txID} onChange={e=>setRemitForm(p=>({...p,txID:e.target.value}))}/></div>
                <div style={{ gridColumn:"1/-1" }}><label className="k-label">Note (optional)</label><input className="k-input" placeholder="Any remarks..." value={remitForm.note} onChange={e=>setRemitForm(p=>({...p,note:e.target.value}))}/></div>
              </div>
              {remitForm.remittedAmount && (() => {
                const diff = Number(remitForm.remittedAmount||0) - todayExpected;
                const ok   = Math.abs(diff) < 1;
                return (
                  <div style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"12px", marginBottom:"16px" }}>
                    {[["Expected",fmt(todayExpected)],["Sending",fmt(remitForm.remittedAmount||0)]].map(([label,val])=>(
                      <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                        <span style={{ fontSize:"12px", color:"var(--text-faint)" }}>{label}</span>
                        <span style={{ fontSize:"12px", color:"var(--text)", fontWeight:500 }}>{val}</span>
                      </div>
                    ))}
                    <div style={{ height:"1px", background:"var(--border)", margin:"8px 0"}}/>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:"12px", color:"var(--text-faint)" }}>Difference</span>
                      <span style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:700,
                        color:ok?"var(--green)":diff<0?"var(--red)":"var(--amber)" }}>
                        {ok?"✓ Exact":diff<0?`Short ${fmt(Math.abs(diff))}`:`Over ${fmt(diff)}`}
                      </span>
                    </div>
                  </div>
                );
              })()}
              <button onClick={saveRemittance} disabled={!remitForm.remittedAmount||!remitForm.txID} style={{
                width:"100%", padding:"12px",
                background:!remitForm.remittedAmount||!remitForm.txID?"#f1f5f9":"linear-gradient(135deg,var(--blue),var(--blue-dk))",
                border:"none", borderRadius:"var(--r-sm)",
                color:!remitForm.remittedAmount||!remitForm.txID?"#94a3b8":"#fff",
                fontFamily:"var(--display)", fontSize:"13px", fontWeight:700,
                cursor:!remitForm.remittedAmount||!remitForm.txID?"not-allowed":"pointer",
                boxShadow:!remitForm.remittedAmount||!remitForm.txID?"none":"0 4px 14px rgba(26,86,219,.3)",
              }}>Submit to Boss →</button>
            </Card>
            {remittances.length > 0 && (
              <div style={{ marginTop:"24px" }}>
                <p style={{ fontSize:"11px", fontWeight:600, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:"10px" }}>Past Remittances</p>
                {remittances.map(r => <RemitCard key={r.id} rec={r}/>)}
              </div>
            )}
          </div>
        )}

        {tab==="riders" && (
          <div className="fade-in">
            <SectionTitle title="Rider Performance + Bonus"/>
            <div style={{ background:"var(--navy)", borderRadius:"var(--r)", padding:"14px 16px",
              marginBottom:"16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontSize:"10px", fontWeight:600, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:"2px" }}>Current Bonus Period</p>
                <p style={{ fontSize:"13px", fontWeight:600, color:"#fff" }}>{period.label}</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:"10px", color:"rgba(255,255,255,.45)", marginBottom:"2px" }}>Total Bonus Due</p>
                <p style={{ fontFamily:"var(--display)", fontSize:"18px", fontWeight:800, color:"#60a5fa" }}>{fmt(totalBonus)}</p>
              </div>
            </div>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate}/>
            <Card style={{ marginBottom:"16px" }}>
              <p style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".04em", marginBottom:"10px" }}>Bonus Summary ({period.label})</p>
              {RIDERS[branch].map(name => {
                const count = orders.filter(o=>o.rider===name&&isInBonusPeriod(o.date)&&o.status==="Delivered").length;
                return <BonusRow key={name} name={name} count={count}/>;
              })}
              <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:"1.5px solid var(--border)",
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".04em" }}>Total Bonus</span>
                <span style={{ fontFamily:"var(--display)", fontSize:"16px", fontWeight:800, color:"var(--blue)" }}>{fmt(totalBonus)}</span>
              </div>
            </Card>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {RIDERS[branch].map(name => {
                const ro   = filterByPeriod(orders.filter(o=>o.rider===name), mode, customDate);
                const done = ro.filter(o=>o.status==="Delivered");
                const owed = done.reduce((s,o)=>s+calcRiderOwed(o),0);
                const paid = done.filter(o=>o.riderRemitted).reduce((s,o)=>s+calcRiderOwed(o),0);
                const out  = owed - paid;
                const bonusCount = orders.filter(o=>o.rider===name&&isInBonusPeriod(o.date)&&o.status==="Delivered").length;
                return (
                  <Card key={name}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <RiderAvatar name={name} size={34}/>
                        <span style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:700 }}>{name}</span>
                      </div>
                      <div style={{ display:"flex", gap:"6px" }}>
                        {out>0 && <Tag label={`Owes ${fmt(out)}`} type="red"/>}
                        <Tag label={`Bonus ${fmt(calcBonus(bonusCount))}`} type="blue"/>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"8px" }}>
                      {[
                        ["Cash",    fmt(done.reduce((s,o)=>s+(o.cashValue||0),0)),  "var(--text)"],
                        ["POS",     fmt(done.reduce((s,o)=>s+(o.posValue||0),0)),   "var(--text)"],
                        ["Road",    fmt(ro.reduce((s,o)=>s+(o.roadExpense||0),0)),  "var(--red)"],
                        ["Balance", out>0?fmt(out):"Cleared", out>0?"var(--red)":"var(--green)"],
                      ].map(([label,val,color])=>(
                        <div key={label} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"8px" }}>
                          <p style={{ fontSize:"9px", fontWeight:600, color:"var(--text-faint)", marginBottom:"3px" }}>{label}</p>
                          <p style={{ fontFamily:"var(--display)", fontSize:"12px", fontWeight:700, color }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {tab==="expenses" && (
          <div className="fade-in">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
              <SectionTitle title="Branch Expenses"/>
              <button onClick={()=>setShowExpForm(p=>!p)} style={{ background:"var(--blue)", color:"#fff",
                border:"none", borderRadius:"var(--r-sm)", padding:"7px 16px",
                fontFamily:"var(--display)", fontSize:"12px", fontWeight:700, cursor:"pointer",
                boxShadow:"0 2px 8px rgba(26,86,219,.3)" }}>+ Add Expense</button>
            </div>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate}/>
            {showExpForm && (
              <Card accent="blue" style={{ marginBottom:"16px" }} className="slide-down">
                <p style={{ fontSize:"11px", fontWeight:600, color:"var(--blue)", textTransform:"uppercase", letterSpacing:".04em", marginBottom:"14px" }}>New Branch Expense</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
                  <div><label className="k-label">Date</label><input type="date" className="k-input" value={expForm.date} onChange={e=>setExpForm(p=>({...p,date:e.target.value}))}/></div>
                  <div>
                    <label className="k-label">Category</label>
                    <select className="k-input" value={expForm.category} onChange={e=>setExpForm(p=>({...p,category:e.target.value}))}>
                      <option>Fuel</option><option>Office</option><option>Repairs</option><option>Salary</option><option>Other</option>
                    </select>
                  </div>
                  <div style={{ gridColumn:"1/-1" }}><label className="k-label">Description</label><input className="k-input" placeholder="What was this for?" value={expForm.description} onChange={e=>setExpForm(p=>({...p,description:e.target.value}))}/></div>
                  <div><label className="k-label">Amount (₦)</label><input type="number" className="k-input" placeholder="0" value={expForm.amount} onChange={e=>setExpForm(p=>({...p,amount:e.target.value}))}/></div>
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={saveExpense} style={{ flex:1, padding:"9px", background:"var(--blue)", border:"none", borderRadius:"var(--r-sm)", color:"#fff", fontFamily:"var(--display)", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>Save</button>
                  <button onClick={()=>setShowExpForm(false)} style={{ padding:"9px 16px", background:"#fff", border:"1.5px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--text-dim)", fontSize:"12px", cursor:"pointer" }}>Cancel</button>
                </div>
              </Card>
            )}
            <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:"var(--r)",
              padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <span style={{ fontSize:"11px", fontWeight:600, color:"var(--text-faint)", textTransform:"uppercase", letterSpacing:".06em" }}>Total</span>
              <span style={{ fontFamily:"var(--display)", fontSize:"16px", fontWeight:800, color:"var(--red)" }}>{fmt(fExpenses.reduce((s,e)=>s+e.amount,0))}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {fExpenses.map(e => (
                <div key={e.id} style={{ background:"#fff", border:"1.5px solid var(--border)", borderRadius:"var(--r)",
                  padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"var(--shadow)" }}>
                  <div>
                    <p style={{ fontSize:"13px", fontWeight:600 }}>{e.description}</p>
                    <p style={{ fontSize:"11px", color:"var(--text-faint)", marginTop:"2px" }}>{e.category} · {e.date}</p>
                  </div>
                  <p style={{ fontFamily:"var(--display)", fontSize:"14px", fontWeight:700, color:"var(--red)" }}>{fmt(e.amount)}</p>
                </div>
              ))}
              {fExpenses.length===0 && <p style={{ textAlign:"center", padding:"48px 0", fontSize:"13px", color:"var(--text-faint)" }}>No expenses in this period</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BOSS VIEW ────────────────────────────────────────────────────────────────
function BossView({ onLogout }) {
  const [tab, setTab]               = useState("overview");
  const [mode, setMode]             = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [orders, setOrders]         = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [syncing, setSyncing]       = useState(true);

  useEffect(() => {
    setSyncing(true);
    Promise.all([sheetGet("Orders"),sheetGet("Expenses"),sheetGet("Remittances")])
      .then(([o,e,r]) => { setOrders(o); setExpenses(e); setRemittances(r); })
      .catch(()=>{}).finally(()=>setSyncing(false));
  }, []);

  const fOrders   = filterByPeriod(orders,     mode, customDate);
  const fExpenses = filterByPeriod(expenses,    mode, customDate);
  const fRemit    = filterByPeriod(remittances, mode, customDate);
  const period    = getBonusPeriod();

  const branchStats = BRANCHES.map(b => {
    const bo   = fOrders.filter(o=>o.branch===b);
    const done = bo.filter(o=>o.status==="Delivered");
    const cash = done.reduce((s,o)=>s+(o.cashValue||0),0);
    const pos  = done.reduce((s,o)=>s+(o.posValue||0),0);
    const expected  = done.reduce((s,o)=>s+calcRiderOwed(o),0);
    const branchExp = fExpenses.filter(e=>e.branch===b).reduce((s,e)=>s+e.amount,0);
    const remitRecs = fRemit.filter(r=>r.branch===b);
    const totalSent = remitRecs.reduce((s,r)=>s+r.remittedAmount,0);
    const diff      = totalSent - expected;
    const bonus = RIDERS[b].reduce((s,n)=>{
      const c = orders.filter(o=>o.rider===n&&isInBonusPeriod(o.date)&&o.status==="Delivered").length;
      return s+calcBonus(c);
    },0);
    return {branch:b,total:bo.length,delivered:done.length,cash,pos,expected,branchExp,totalSent,diff,remitRecs,bonus};
  });

  const grand = {
    cash:     branchStats.reduce((s,b)=>s+b.cash,0),
    pos:      branchStats.reduce((s,b)=>s+b.pos,0),
    expected: branchStats.reduce((s,b)=>s+b.expected,0),
    sent:     branchStats.reduce((s,b)=>s+b.totalSent,0),
    exp:      branchStats.reduce((s,b)=>s+b.branchExp,0),
    orders:   branchStats.reduce((s,b)=>s+b.total,0),
    bonus:    branchStats.reduce((s,b)=>s+b.bonus,0),
  };
  const grandDiff = grand.sent - grand.expected;

  const TABS = [{id:"overview",label:"Overview"},{id:"remittances",label:"Remittances"},{id:"branches",label:"Branches"},{id:"riders",label:"All Riders"},{id:"orders",label:"Orders"}];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <style>{GS}</style>
      <TopNav subtitle="All Branches · Boss" tabs={TABS} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} syncing={syncing}/>
      <div style={{ maxWidth:"960px", margin:"0 auto", padding:"20px 16px" }}>

        {tab==="overview" && (
          <div className="fade-in">
            <SectionTitle title="All Branches Overview"/>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate}/>
            {Math.abs(grandDiff) > 0 && (
              <div className={grandDiff<0?"pulse-anim":""} style={{
                background:grandDiff<0?"#fef2f2":"#fffbeb",
                border:`1.5px solid ${grandDiff<0?"#fecaca":"#fde68a"}`,
                borderRadius:"var(--r)", padding:"14px 16px", marginBottom:"16px",
                display:"flex", alignItems:"center", gap:"12px" }}>
                <span style={{ fontSize:"22px" }}>{grandDiff<0?"🚨":"⚠️"}</span>
                <div>
                  <p style={{ fontSize:"13px", fontWeight:600, color:grandDiff<0?"var(--red)":"var(--amber)" }}>
                    {grandDiff<0?`Branches short by ${fmt(Math.abs(grandDiff))}`:`Branches sent ${fmt(grandDiff)} more than expected`}
                  </p>
                  <p style={{ fontSize:"11px", color:grandDiff<0?"#f87171":"#fbbf24", marginTop:"2px" }}>
                    Expected: {fmt(grand.expected)} · Received: {fmt(grand.sent)}
                  </p>
                </div>
              </div>
            )}
            {Math.abs(grandDiff)<1 && grand.sent>0 && (
              <div style={{ background:"#ecfdf5", border:"1.5px solid #a7f3d0", borderRadius:"var(--r)",
                padding:"12px 16px", marginBottom:"16px", display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ color:"var(--green)", fontSize:"18px" }}>✓</span>
                <p style={{ fontSize:"12px", fontWeight:600, color:"var(--green)" }}>All branches balanced — {fmt(grand.sent)} received as expected</p>
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px", marginBottom:"10px" }}>
              <StatCard label="Total Cash"      value={fmt(grand.cash)}     accent="blue"/>
              <StatCard label="Total POS"       value={fmt(grand.pos)}      accent="green"/>
              <StatCard label="Expected"        value={fmt(grand.expected)}/>
              <StatCard label="Received"        value={fmt(grand.sent)} accent={grandDiff>=0?"green":"red"}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"16px" }}>
              <StatCard label="Branch Expenses" value={fmt(grand.exp)}   accent="red"/>
              <StatCard label="Total Bonus Due" value={fmt(grand.bonus)} accent="blue" sub={period.label}/>
              <StatCard label="Total Orders"    value={grand.orders}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
              {branchStats.map(b => (
                <Card key={b.branch}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
                    <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"#eff4ff",
                      border:"1.5px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"var(--display)", fontSize:"12px", fontWeight:800, color:"var(--blue)" }}>{b.branch[0]}</div>
                    <span style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:700 }}>{b.branch}</span>
                  </div>
                  <p style={{ fontFamily:"var(--display)", fontSize:"18px", fontWeight:800, color:"var(--blue)", marginBottom:"4px" }}>{fmt(b.cash+b.pos)}</p>
                  <p style={{ fontSize:"11px", color:"var(--text-faint)", marginBottom:"8px" }}>{b.delivered}/{b.total} delivered</p>
                  {Math.abs(b.diff)<1&&b.totalSent>0 ? <Tag label="✓ Balanced" type="green"/> : b.diff<0 ? <Tag label={`Short ${fmt(Math.abs(b.diff))}`} type="red"/> : b.diff>0 ? <Tag label={`Over ${fmt(b.diff)}`} type="amber"/> : null}
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab==="remittances" && (
          <div className="fade-in">
            <SectionTitle title="Branch Remittances"/>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"20px" }}>
              <StatCard label="Expected" value={fmt(grand.expected)}/>
              <StatCard label="Received" value={fmt(grand.sent)} accent={grandDiff>=0?"green":"red"}/>
              <StatCard label="Diff"     value={Math.abs(grandDiff)<1?"Exact":grandDiff<0?`-${fmt(Math.abs(grandDiff))}`:`+${fmt(grandDiff)}`} accent={Math.abs(grandDiff)<1?"green":grandDiff<0?"red":"amber"}/>
            </div>
            {branchStats.map(b => (
              <div key={b.branch} style={{ marginBottom:"24px" }}>
                <p style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:"8px" }}>{b.branch} Branch</p>
                {b.remitRecs.length > 0
                  ? b.remitRecs.map(r => <RemitCard key={r.id} rec={r}/>)
                  : (
                    <div style={{ background:"#fff", border:"1.5px solid var(--border)", borderRadius:"var(--r)",
                      padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"var(--shadow)" }}>
                      <div>
                        <p style={{ fontSize:"13px", fontWeight:500, color:"var(--text-dim)" }}>No remittance logged for {b.branch}</p>
                        <p style={{ fontSize:"11px", color:"var(--text-faint)", marginTop:"2px" }}>Expected: {fmt(b.expected)}</p>
                      </div>
                      {b.expected>0 && <Tag label="⚠ Not sent yet" type="red"/>}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {tab==="branches" && (
          <div className="fade-in">
            <SectionTitle title="Branch Breakdown"/>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate}/>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {branchStats.map(b => (
                <Card key={b.branch}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"#eff4ff",
                        border:"1.5px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"center",
                        fontFamily:"var(--display)", fontSize:"14px", fontWeight:800, color:"var(--blue)" }}>{b.branch[0]}</div>
                      <div>
                        <span style={{ fontFamily:"var(--display)", fontSize:"14px", fontWeight:700 }}>{b.branch}</span>
                        <p style={{ fontSize:"11px", color:"var(--text-faint)" }}>{RIDERS[b.branch].length} riders</p>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                      {Math.abs(b.diff)<1&&b.totalSent>0 && <Tag label="✓ Balanced" type="green"/>}
                      {b.diff<0 && <Tag label={`Short ${fmt(Math.abs(b.diff))}`} type="red"/>}
                      {b.diff>0 && <Tag label={`Over ${fmt(b.diff)}`} type="amber"/>}
                      <span style={{ fontSize:"11px", color:"var(--text-faint)" }}>{b.delivered}/{b.total} delivered</span>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"8px", marginBottom:"10px" }}>
                    {[
                      ["Cash In",   fmt(b.cash),      "var(--blue)"],
                      ["POS In",    fmt(b.pos),       "var(--green)"],
                      ["Expected",  fmt(b.expected),  "var(--text)"],
                      ["Received",  fmt(b.totalSent), b.diff<0?"var(--red)":Math.abs(b.diff)<1&&b.totalSent>0?"var(--green)":"var(--text)"],
                    ].map(([label,val,color])=>(
                      <div key={label} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"10px" }}>
                        <p style={{ fontSize:"9px", fontWeight:600, color:"var(--text-faint)", marginBottom:"3px" }}>{label}</p>
                        <p style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:700, color }}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop:"1.5px solid var(--border)", paddingTop:"10px", display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:"11px", color:"var(--text-faint)" }}>Branch expenses: <strong style={{color:"var(--red)"}}>{fmt(b.branchExp)}</strong></span>
                    <span style={{ fontSize:"11px", color:"var(--text-faint)" }}>Bonus payable: <strong style={{color:"var(--blue)"}}>{fmt(b.bonus)}</strong></span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab==="riders" && (
          <div className="fade-in">
            <SectionTitle title="All Riders — Bonus Overview"/>
            <div style={{ background:"var(--navy)", borderRadius:"var(--r)", padding:"20px", marginBottom:"20px" }}>
              <p style={{ fontSize:"10px", fontWeight:600, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:"4px" }}>Total Bonus — All Branches</p>
              <p style={{ fontFamily:"var(--display)", fontSize:"28px", fontWeight:800, color:"#fff", lineHeight:1, marginBottom:"4px" }}>{fmt(grand.bonus)}</p>
              <p style={{ fontSize:"11px", color:"rgba(255,255,255,.4)" }}>{period.label} · {RIDERS.AJA.length+RIDERS.IDIMU.length+RIDERS.KETU.length} riders</p>
            </div>
            {BRANCHES.map(b => (
              <div key={b} style={{ marginBottom:"20px" }}>
                <p style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:"10px" }}>{b} Branch — {RIDERS[b].length} riders</p>
                <Card>
                  {RIDERS[b].map(name => {
                    const count = orders.filter(o=>o.rider===name&&isInBonusPeriod(o.date)&&o.status==="Delivered").length;
                    return <BonusRow key={name} name={name} count={count}/>;
                  })}
                  <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:"1.5px solid var(--border)",
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".04em" }}>{b} Total</span>
                    <span style={{ fontFamily:"var(--display)", fontSize:"15px", fontWeight:800, color:"var(--blue)" }}>
                      {fmt(RIDERS[b].reduce((s,n)=>s+calcBonus(orders.filter(o=>o.rider===n&&isInBonusPeriod(o.date)&&o.status==="Delivered").length),0))}
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        {tab==="orders" && (
          <div className="fade-in">
            <SectionTitle title="All Orders"/>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate}/>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {fOrders.map(o => {
                const st = ST[o.status]||ST.Failed;
                return (
                  <div key={o.id} style={{ background:"#fff", border:"1.5px solid var(--border)",
                    borderRadius:"var(--r)", padding:"12px 14px", boxShadow:"var(--shadow)" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px", flexWrap:"wrap" }}>
                          <span style={{ fontSize:"13px", fontWeight:600 }}>{o.product}</span>
                          <span style={{ fontSize:"10px", fontWeight:600, padding:"2px 8px", borderRadius:"99px",
                            border:`1px solid ${st.border}`, background:st.bg, color:st.color }}>{o.status}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                          <RiderAvatar name={o.rider} size={16}/>
                          <span style={{ fontSize:"12px", color:"var(--text-dim)", fontWeight:500 }}>{o.rider}</span>
                          <Tag label={o.branch} type="blue"/>
                          <span style={{ fontSize:"11px", color:"var(--text-faint)" }}>{o.date}</span>
                        </div>
                      </div>
                      <p style={{ fontFamily:"var(--display)", fontSize:"14px", fontWeight:700, marginLeft:"12px" }}>{fmt((o.cashValue||0)+(o.posValue||0))}</p>
                    </div>
                  </div>
                );
              })}
              {fOrders.length===0 && <p style={{ textAlign:"center", padding:"48px 0", fontSize:"13px", color:"var(--text-faint)" }}>No orders in this period</p>}
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
  if (!session) return <LoginScreen onLogin={(role, branch) => setSession({ role, branch })}/>;
  if (session.role === "boss")          return <BossView         onLogout={() => setSession(null)}/>;
  if (session.role === "manager")       return <ManagerView      branch={session.branch} onLogout={() => setSession(null)}/>;
  if (session.role === "rider-manager") return <RiderManagerView branch={session.branch} onLogout={() => setSession(null)}/>;
}
