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

// ─── TODAY — simple local date string, no Date parsing ───────────────────────
const TODAY = (() => {
  const d = new Date();
  // Use local getFullYear/Month/Date — avoids any UTC conversion
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
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

// Custom flat-rate bonus riders (no tiers)
const CUSTOM_BONUS = {
  "Mr Tobi": 2000,
  "Philip":  800,
};
function calcBonus(n, riderName) {
  if (riderName && CUSTOM_BONUS[riderName] !== undefined) return n * CUSTOM_BONUS[riderName];
  if (n <= 200) return n * 200;
  if (n <= 250) return n * 400;
  if (n <= 300) return n * 500;
  return n * 700;
}
function getBonusRate(n, riderName) {
  if (riderName && CUSTOM_BONUS[riderName] !== undefined) return CUSTOM_BONUS[riderName];
  if (n <= 200) return 200;
  if (n <= 250) return 400;
  if (n <= 300) return 500;
  return 700;
}

const VENDORS = {
  "LADEX": ["Jandes","Boshjex","Boshjex pro","Xebenco powder","Propazi"],
  "TOPMO": ["Elipy cap","Elipy balm","Sabbana","HYPERTOP","Vertidem","Topmo cleanser tea","Topmo capsule","Senior cap","Topmo detox","Prosma","Venaba","Tabizo","Charzzy","Elano","Vaniso","Cendez","Sb latein","Suyem","Zavina","Yemit"],
  "LASUMAX GROUP": ["Padosa","TUNFALZ","Kidema oil","Kidema capsule","Lavosa","Lasumax tea","Lasumax cap","Provena capsule","Provena cleanser","Kenzai"],
  "MUMART": ["Eye gel","Guava boost","PSORIASIS Cream","5 in 1 facial","Lizard spray","Collagen oil","Foot peeling cream","Stamina pro"],
  "EDZU": ["Davigormax","Venature","Yilest","QISE Anti wrinkle","A pack","Shilajit capsule","Retinol lotion"],
  "AKOVIL": ["Chillflex","PYRU TEA","Slimcore","Cendez cleanser","Joint & bone","Wart removal","Beevenom","Beevana","Bhamiza TEA","Dim Capsule"],
  "VITAL HERB": ["Hermona Tea","Laxira","Calmira","Liver tea"],
  "ZUMA": ["Perfect X","Loovita","SAAM","Ziphra capsule","Ziphra Tea"],
  "HORLA": ["Pomegranate","Fenugreek","Diabetic foot cream","Diabilin"],
  "BAZAKI": ["Ginseng capsule","Ginseng Root tea","Chancaflow","Deos"],
  "E-CLAX": ["SAAM Renewal face cream","Utogru Teeth whitening"],
  "SYSTERA": ["Snake venom","SAAM Renewal face cream","Yoxier Lavender cream"],
  "ABBEX": ["Exfoliating gel"],
  "ZAKI": ["Beevenom"],
  "CALLYTUS": ["Biotin and collagen","Nada plus"],
  "TSEIGBESA": ["Beevana"],
  "JOHNMAX": ["Herbal bone ointment","Maxman"],
  "STYLE": ["Mag black","Mag gold","Vintage black","Vintage red","Chenxi","Oulm","Fusili silver","Fusili gold","Bos design","Mag leather"],
  "LOLLYTOS": ["Small portable juicer","Electronic lunch box","Electric mug","Pulse massager","Wheel roller","Fruit press","Toothbrush sterilizer","Solar camp light","Juicing cup","Leakage fix tape","Rechargeable juice","Mini flask","Mini massager"],
  "KENDUMA": ["Pet collar","Pet spray","OLEVS wristwatch"],
  "Madam Gift": ["Building block","Magnetic drawing board","Finger Arithmetic"],
  "KING ROYCE": ["Reachable car charger"],
  "KYNE-RANDOM": ["Random energy capsule"],
  "SMART CLEANSER KYNE": ["Smart Cleanser","Sanora capsule","Sanora balm"],
  "CEENO LAGOS": ["Nano tapes","Turmeric soaps","Pink lip serum","Shilajit gummies","Brown flower wallpaper","Green flower wallpaper","IMAX SPRAY","Boka toothpaste","Lunavia pen","Fenugreek seed tea"],
  "ISYLIFE": ["Richard mille","Cctv","INVICTA","Lamborghini","Smart watch","Daniel Wellington"],
  "GLAMOUR TROVE": ["Kids multivitamin"],
  "SENDJON": ["Renewal face cream","Repair Scar cream","Body cream","Acne Serum","Eye cream","Advanced Daily SAAM","Facial cleanser","Micellar water","Cotton pad","Eyebrow","Primeman potency"],
  "Zavina Group": ["Zavina tea","Veritol cap","Vetra tea"],
  "SEFWAY Group": ["Sefway Herbal"],
  "Awoof Mall": ["Wireless Mic"],
  "BMP Group": ["Lenstone Herbal"],
  "NUTRICARE": ["Beyond the like","Not just a girl","Stroke fighter"],
  "MIRAC GLOBAL": ["Liver restore","Sperm revive capsule","Infection flusher","Hepafix"],
  "ADEITAN NETFAIR": ["Cucumber oil","Liver restore","Liver cur","Asthmacur","Lung cleanser","Infection flusher","Infection crusher","Ivision capsule","Eye cleanser tea","Detox tea","Ovucare tea","Fertility plus","Sleep cur","Knacker boost","Knacker capsule","Firm fix","Cemenplus","Sperm revive","Alpha man capsule","Alpha man syrup"],
  "HYPERFIT": ["Egg cracker","Pepper spray","Combat pouch"],
  "OPTIMAL HORIZON": ["Natural erect","Strike hard"],
  "29 carat": ["OLEVS wristwatch"],
  "EDDY": ["Soursop","Sealant spray","Mosquito swatter","Aloe vera gel","Sleep mask"],
  "LAGOS BATCH AFROMEDIA": ["Erabab capsule","Hamachin tea","Hamachin capsule"],
  "DR MIKE": ["Sureza capsule","Fayamax cleanser","Fayamax capsule","Fayamax oil","Hyperform capsule","Hyperform tea"],
};
const VENDOR_NAMES = Object.keys(VENDORS);

const fmt = (n) => `₦${Number(n || 0).toLocaleString("en-NG")}`;

function calcRiderOwed(order) {
  // What rider must remit to branch = cash collected - road expense + POS
  if (order.status !== "Delivered") return 0;
  return Math.max(0, (order.cashValue || 0) - (order.roadExpense || 0)) + (order.posValue || 0);
}
function calcOutstanding(order) {
  // Amount customer still owes = price - (cash + POS collected)
  if (order.status !== "Delivered") return 0;
  const price = order.price || 0;
  const collected = (order.cashValue || 0) + (order.posValue || 0);
  return Math.max(0, price - collected);
}

// ─── GOOGLE SHEETS ────────────────────────────────────────────────────────────
const API_URL = "https://script.google.com/macros/s/AKfycbx0n97CWtI-uRQ_k58uuN2c8TBCd8xl37z-sxtcDz2agi0IzfI2-r7k9dpg6NP7KDYL/exec";

async function sheetGet(tab) {
  try {
    const res = await fetch(`${API_URL}?tab=${tab}`);
    const data = await res.json();
    return parseSheetRows(data);
  } catch { return []; }
}

function parseSheetRows(data) {
  return data.map(row => ({
      ...row,
      date: (() => {
        if (!row.date) return "";
        const s = String(row.date);
        if (s.includes("T")) return s.split("T")[0];
        if (/^\d+(\.\d+)?$/.test(s)) {
          const serial = parseFloat(s);
          const ms = (serial - 25569) * 86400 * 1000;
          const d  = new Date(ms);
          const y  = d.getUTCFullYear();
          const m  = String(d.getUTCMonth() + 1).padStart(2, "0");
          const day = String(d.getUTCDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        }
        return s.slice(0, 10);
      })(),
      cashValue:      Number(row.cashValue)      || 0,
      posValue:       Number(row.posValue)        || 0,
      roadExpense:    Number(row.roadExpense)      || 0,
      amount:         Number(row.amount)          || 0,
      expectedAmount: Number(row.expectedAmount)  || 0,
      remittedAmount: Number(row.remittedAmount)  || 0,
      price:          Number(row.price)          || 0,
      totalPrice:     Number(row.totalPrice)      || 0,
      riderRemitted:  row.riderRemitted === "true" || row.riderRemitted === true,
      // RiderPayments fields — recalculate outstanding/cleared from actual numbers
      cash:           Number(row.cash)            || 0,
      pos:            Number(row.pos)             || 0,
      netExpected:    Number(row.netExpected)     || 0,
      totalExpected:  Number(row.totalExpected)   || 0,
      roadExp:        Number(row.roadExp)         || 0,
      get outstanding() {
        const net = Number(row.netExpected) || 0;
        const paid = (Number(row.cash) || 0) + (Number(row.pos) || 0);
        return net > 0 ? Math.max(0, net - paid) : 0;
      },
      get cleared() {
        const net = Number(row.netExpected) || 0;
        const paid = (Number(row.cash) || 0) + (Number(row.pos) || 0);
        return net > 0 && paid >= net;
      },
      products: (() => {
        if (!row.products) return [];
        if (typeof row.products === "string" && row.products.startsWith("[")) {
          try { return JSON.parse(row.products); } catch { return []; }
        }
        return [];
      })(),
    }));
}
async function sheetAdd(tab, data) {
  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({ action: "add", tab, data })
    });
  } catch {}
}
async function sheetUpdate(tab, data) {
  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({ action: "update", tab, data })
    });
  } catch {}
}

// ─── DATE FILTER ──────────────────────────────────────────────────────────────
function filterByPeriod(list, mode, customDate, customDateEnd) {
  if (mode === "range" && customDate && customDateEnd) return list.filter(o => o.date >= customDate && o.date <= customDateEnd);
  if (mode === "custom" && customDate) return list.filter(o => o.date === customDate);
  if (mode === "today")  return list.filter(o => o.date === TODAY);
  if (mode === "week") {
    const now = new Date();
    const dow = now.getDay();
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
  { username: "idimu inventory", password: "idimyinv@2024",  role: "inventory-admin", branch: "IDIMU" },
  { username: "ketu inventory",  password: "ketuinv@2024",   role: "inventory-view",  branch: "KETU"  },
  { username: "aja inventory",   password: "ajainv@2024",    role: "inventory-view",  branch: "AJA"   },
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

  @media (max-width: 600px) {
    .k-input { font-size: 16px !important; }
    .mob-col-2 { grid-template-columns: 1fr 1fr !important; }
    .mob-col-1 { grid-template-columns: 1fr !important; }
  }

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

function PeriodFilter({ mode, setMode, customDate, setCustomDate, customDateEnd, setCustomDateEnd }) {
  return (
    <div style={{ marginBottom:"16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap", marginBottom:"8px" }}>
        {[["today","Today"],["week","Week"],["month","Month"],["range","Range"],["all","All"]].map(([id, lbl]) => (
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
          {(mode === "custom" || mode === "range") && customDate && (
            <button onClick={() => { setMode("today"); setCustomDate(""); if(setCustomDateEnd) setCustomDateEnd(""); }}
              style={{ background:"#fff", border:"1.5px solid var(--border)", color:"var(--text-dim)",
                borderRadius:"var(--r-sm)", padding:"5px 8px", fontSize:"12px", cursor:"pointer" }}>✕</button>
          )}
        </div>
      </div>
      {mode === "range" && (
        <div style={{ display:"flex", alignItems:"center", gap:"8px", background:"var(--blue-pale)", border:"1.5px solid var(--blue-pale2)", borderRadius:"var(--r-sm)", padding:"8px 12px" }}>
          <span style={{ fontSize:"11px", color:"var(--text-dim)", fontWeight:600, whiteSpace:"nowrap" }}>From</span>
          <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
            className="k-input" style={{ flex:1, fontSize:"12px", padding:"5px 8px" }}/>
          <span style={{ fontSize:"11px", color:"var(--text-dim)", fontWeight:600, whiteSpace:"nowrap" }}>To</span>
          <input type="date" value={customDateEnd||""} onChange={e => setCustomDateEnd && setCustomDateEnd(e.target.value)}
            className="k-input" style={{ flex:1, fontSize:"12px", padding:"5px 8px" }}/>
        </div>
      )}
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
          ⟳ SYNCING...
        </div>
      )}
      <div style={{ maxWidth:"960px", margin:"0 auto", padding:"0 16px", height:"48px",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0, minWidth:0 }}>
          <div style={{ background:"#fff", borderRadius:"8px", padding:"4px 8px", flexShrink:0,
            display:"flex", alignItems:"center", gap:"6px", boxShadow:"0 1px 4px rgba(0,0,0,.12)" }}>
            <KyneLogo size={20} dark/>
            <span style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:800, color:"var(--navy)" }}>Kyne</span>
          </div>
          {subtitle && <p style={{ fontSize:"10px", color:"rgba(255,255,255,.45)", fontWeight:500,
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", minWidth:0 }}>{subtitle}</p>}
        </div>
        <button onClick={onLogout} style={{ flexShrink:0, padding:"5px 10px",
          borderRadius:"var(--r-sm)", background:"rgba(255,255,255,.08)",
          border:"1px solid rgba(255,255,255,.18)", color:"rgba(255,255,255,.7)",
          fontSize:"11px", fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>← Exit</button>
      </div>
      <div style={{ overflowX:"auto", WebkitOverflowScrolling:"touch",
        scrollbarWidth:"none", msOverflowStyle:"none" }}>
        <div style={{ display:"flex", alignItems:"center", padding:"0 16px",
          gap:"2px", minWidth:"max-content", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding:"8px 13px", fontSize:"12px", fontWeight:600, cursor:"pointer",
              border:"none", background: activeTab===t.id ? "rgba(255,255,255,.16)" : "transparent",
              color: activeTab===t.id ? "#fff" : "rgba(255,255,255,.5)",
              borderBottom: activeTab===t.id ? "2px solid #60a5fa" : "2px solid transparent",
              transition:"all .15s", whiteSpace:"nowrap",
            }}>{t.label}</button>
          ))}
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
            {order.price > 0      && <span style={{ fontSize:"11px", color:"var(--text-dim)", fontWeight:600 }}>🏷 {fmt(order.price)}</span>}
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
            <p style={{ fontSize:"11px", color:"var(--amber)", marginTop:"2px" }}>remits {fmt(owed)}</p>}
          {order.status==="Delivered" && calcOutstanding(order) > 0 &&
            <p style={{ fontSize:"11px", color:"var(--red)", marginTop:"2px", fontWeight:600 }}>cust owes {fmt(calcOutstanding(order))}</p>}
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

function BonusRow({ name, count, period }) {
  const bonus = calcBonus(count, name);
  const rate  = getBonusRate(count, name);
  const next  = CUSTOM_BONUS[name] ? null : count<=200?200:count<=250?250:count<=300?300:null;
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
        <RiderAvatar name={name} size={30}/>
        <div>
          <p style={{ fontSize:"13px", fontWeight:600 }}>{name}</p>
          <p style={{ fontSize:"10px", color:"var(--text-faint)" }}>{count} orders · ₦{rate.toLocaleString()}/order</p>
          {period && <p style={{ fontSize:"10px", color:"var(--blue)", marginTop:"1px" }}>{period}</p>}
        </div>
      </div>
      <div style={{ textAlign:"right" }}>
        <p style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:700, color:"var(--blue)" }}>{fmt(bonus)}</p>
        {next && <p style={{ fontSize:"10px", color:"var(--text-faint)" }}>{next - count} more to next tier</p>}
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

// ─── RIDER MANAGER VIEW ───────────────────────────────────────────────────────
// Flow: Morning → log orders (customer, products, rider, address)
//       Evening  → mark delivered/failed, add road expense per rider
//       Only delivered orders flow to Branch Manager
function RiderManagerView({ branch, onLogout }) {
  const [tab, setTab]           = useState("log");
  const [orders, setOrders]     = useState([]);
  const [syncing, setSyncing]   = useState(true);
  const [saved, setSaved]       = useState(false);
  const [mode, setMode]         = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");

  // ── Order form state ──
  const blankProduct = { vendor: VENDOR_NAMES[0], name: "", qty: 1, price: "" };
  const blankOrder   = { date: TODAY, rider: RIDERS[branch][0], customerName: "", address: "", products: [{ ...blankProduct }] };
  const [form, setForm]         = useState(blankOrder);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // ── Road expense per rider per day ──
  const [roadExpenses, setRoadExpenses] = useState({}); // { riderId: { rider, date, amount, note } }
  const [roadForm, setRoadForm] = useState({ rider: RIDERS[branch][0], date: TODAY, amount: "", note: "" });
  const [roadSaved, setRoadSaved] = useState(false);

  useEffect(() => {
    setSyncing(true);
    Promise.all([sheetGet("Orders"), sheetGet("RoadExpenses")])
      .then(([o, r]) => {
        setOrders(o.filter(x => x.branch === branch));
        const re = {};
        r.filter(x => x.branch === branch).forEach(x => { re[`${x.rider}-${x.date}`] = x; });
        setRoadExpenses(re);
      }).catch(() => {}).finally(() => setSyncing(false));
  }, [branch]);

  // ── Add product line to form ──
  function addProduct() {
    setForm(f => ({ ...f, products: [...f.products, { ...blankProduct }] }));
  }
  function removeProduct(i) {
    setForm(f => ({ ...f, products: f.products.filter((_, idx) => idx !== i) }));
  }
  function setProduct(i, k, v) {
    setForm(f => ({ ...f, products: f.products.map((p, idx) => {
      if (idx !== i) return p;
      // If vendor changes, reset product name
      if (k === "vendor") return { ...p, vendor: v, name: "" };
      return { ...p, [k]: v };
    }) }));
  }

  // ── Submit new order ──
  function handleSubmit() {
    if (!form.customerName || !form.rider || form.products.some(p => !p.name || !p.price)) return;
    const newOrder = {
      ...form,
      id: Date.now(),
      branch,
      status: "Pending",
      products: form.products.map(p => ({ ...p, qty: Number(p.qty) || 1, price: Number(p.price) || 0 })),
      totalPrice: form.products.reduce((s, p) => s + (Number(p.price) || 0), 0),
      riderRemitted: false,
    };
    setOrders(p => [newOrder, ...p]);
    setForm({ ...blankOrder, products: [{ ...blankProduct }] });
    setSaved(true); setTimeout(() => setSaved(false), 3000);
    sheetAdd("Orders", { ...newOrder, products: JSON.stringify(newOrder.products) }).catch(() => {});
  }

  // ── Mark order delivered ──
  function markDelivered(id) {
    const order = orders.find(o => String(o.id) === String(id));
    if (!order) return;
    // Parse products if string
    const products = typeof order.products === "string" ? JSON.parse(order.products) : (order.products || []);
    const totalPrice = products.reduce((s, p) => s + (Number(p.price) || 0), 0);
    setEditingId(id);
    setEditForm({ ...order, products, totalPrice, roadExpense: "", expenseNote: "" });
  }

  function submitDelivered() {
    if (!editForm) return;
    const products  = editForm.products.map(p => ({ ...p, qty: Number(p.qty) || 1, price: Number(p.price) || 0 }));
    const totalPrice = products.reduce((s, p) => s + Number(p.price) || 0, 0);
    const updated   = { ...editForm, products, totalPrice, status: "Delivered" };
    setOrders(p => p.map(o => String(o.id) === String(editForm.id) ? updated : o));
    // Save road expense if entered
    if (editForm.roadExpense) {
      const reKey = `${editForm.rider}-${editForm.date}`;
      const re    = { id: Date.now(), branch, rider: editForm.rider, date: editForm.date, amount: Number(editForm.roadExpense) || 0, note: editForm.expenseNote || "" };
      setRoadExpenses(p => ({ ...p, [reKey]: re }));
      sheetAdd("RoadExpenses", re).catch(() => {});
    }
    sheetUpdate("Orders", { ...updated, products: JSON.stringify(updated.products) }).catch(() => {});
    setEditingId(null); setEditForm(null);
  }

  function markFailed(id) {
    const updated = orders.map(o => String(o.id) === String(id) ? { ...o, status: "Failed" } : o);
    setOrders(updated);
    const order = updated.find(o => String(o.id) === String(id));
    if (order) sheetUpdate("Orders", { ...order, products: JSON.stringify(order.products || []) }).catch(() => {});
  }

  function saveRoadExpense() {
    if (!roadForm.amount) return;
    const reKey = `${roadForm.rider}-${roadForm.date}`;
    const re    = { id: Date.now(), branch, rider: roadForm.rider, date: roadForm.date, amount: Number(roadForm.amount) || 0, note: roadForm.note || "" };
    setRoadExpenses(p => ({ ...p, [reKey]: re }));
    setRoadForm({ rider: RIDERS[branch][0], date: TODAY, amount: "", note: "" });
    setRoadSaved(true); setTimeout(() => setRoadSaved(false), 3000);
    sheetAdd("RoadExpenses", re).catch(() => {});
  }

  const filtered   = filterByPeriod(orders, mode, customDate, customDateEnd);
  const pending    = filtered.filter(o => o.status === "Pending");
  const delivered  = filtered.filter(o => o.status === "Delivered");
  const failed     = filtered.filter(o => o.status === "Failed");
  const period     = getBonusPeriod();
  const TABS = [{ id: "log", label: "Log Orders" }, { id: "update", label: "Update Orders" }, { id: "riders", label: "Riders" }];

  // parse products helper
  function getProducts(order) {
    if (!order.products) return [];
    if (typeof order.products === "string") { try { return JSON.parse(order.products); } catch { return []; } }
    return order.products;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{GS}</style>
      <TopNav subtitle={`${branch} · Rider Manager`} tabs={TABS} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} syncing={syncing} />
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 16px" }}>

        {/* ── LOG ORDERS TAB ── */}
        {tab === "log" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <SectionTitle title="Log New Order" sub="Fill in customer and product details" />
              {saved && <Tag label="✓ Saved" type="green" />}
            </div>
            <Card>
              {/* Rider + Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label className="k-label">Rider</label>
                  <select value={form.rider} onChange={e => setForm(f => ({ ...f, rider: e.target.value }))} className="k-input" style={{ fontWeight: 600, borderColor: "var(--blue)" }}>
                    {RIDERS[branch].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="k-label">Date</label>
                  <input type="date" className="k-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>

              {/* Customer details */}
              <div style={{ height: "1px", background: "var(--border)", margin: "0 0 14px" }} />
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "12px" }}>Customer Details</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label className="k-label">Customer Name</label>
                  <input className="k-input" placeholder="e.g. Mrs Adebayo" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
                </div>
                <div>
                  <label className="k-label">Delivery Address</label>
                  <input className="k-input" placeholder="e.g. 12 Lekki Phase 1" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>

              {/* Products */}
              <div style={{ height: "1px", background: "var(--border)", margin: "0 0 14px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".04em" }}>Products</p>
                <button onClick={addProduct} style={{ background: "var(--blue-pale)", border: "1.5px solid var(--blue-pale2)", color: "var(--blue)", borderRadius: "var(--r-sm)", padding: "4px 12px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>+ Add Product</button>
              </div>
              {form.products.map((p, i) => (
                <div key={i} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"10px", marginBottom:"10px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                    <span style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)" }}>Item {i+1}</span>
                    {form.products.length > 1 && (
                      <button onClick={() => removeProduct(i)} style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:"var(--r-sm)", color:"var(--red)", fontSize:"11px", fontWeight:600, cursor:"pointer", padding:"2px 8px" }}>Remove</button>
                    )}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"8px" }}>
                    <div>
                      <label className="k-label">Vendor</label>
                      <select className="k-input" value={p.vendor||""} onChange={e => setProduct(i, "vendor", e.target.value)}>
                        <option value="">Select vendor...</option>
                        {VENDOR_NAMES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="k-label">Product</label>
                      <select className="k-input" value={p.name||""} onChange={e => setProduct(i, "name", e.target.value)} disabled={!p.vendor}>
                        <option value="">Select product...</option>
                        {p.vendor && (VENDORS[p.vendor]||[]).map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                    <div>
                      <label className="k-label">Qty</label>
                      <input type="number" className="k-input" min="1" value={p.qty} onChange={e => setProduct(i, "qty", e.target.value)} />
                    </div>
                    <div>
                      <label className="k-label">Price (₦)</label>
                      <input type="number" className="k-input" placeholder="0" value={p.price} onChange={e => setProduct(i, "price", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Total preview */}
              {form.products.some(p => p.price) && (
                <div style={{ background: "var(--blue-pale)", border: "1.5px solid var(--blue-pale2)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-dim)" }}>Total Order Value</span>
                  <span style={{ fontFamily: "var(--display)", fontSize: "16px", fontWeight: 800, color: "var(--blue)" }}>
                    {fmt(form.products.reduce((s, p) => s + (Number(p.price) || 0), 0))}
                  </span>
                </div>
              )}

              <button onClick={handleSubmit}
                disabled={!form.customerName || form.products.some(p => !p.name || !p.price)}
                style={{
                  width: "100%", padding: "12px",
                  background: !form.customerName || form.products.some(p => !p.name || !p.price) ? "#f1f5f9" : "linear-gradient(135deg,var(--blue),var(--blue-dk))",
                  border: "none", borderRadius: "var(--r-sm)",
                  color: !form.customerName || form.products.some(p => !p.name || !p.price) ? "#94a3b8" : "#fff",
                  fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700,
                  cursor: !form.customerName || form.products.some(p => !p.name || !p.price) ? "not-allowed" : "pointer",
                  boxShadow: !form.customerName || form.products.some(p => !p.name || !p.price) ? "none" : "0 4px 14px rgba(26,86,219,.3)",
                }}>Save Order →</button>
            </Card>

            {/* Recent orders */}
            {filterByPeriod(orders, "today", "").filter(o => o.status === "Pending").length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "10px" }}>Today's Pending Orders ({filterByPeriod(orders, "today", "").filter(o => o.status === "Pending").length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {filterByPeriod(orders, "today", "").filter(o => o.status === "Pending").map(o => (
                    <MiniOrderCard key={o.id} order={o} getProducts={getProducts} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── UPDATE ORDERS TAB ── */}
        {tab === "update" && (
          <div className="fade-in">
            <SectionTitle title="Update Orders" sub="Mark delivered or failed, add road expenses" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />

            {/* Road expense section */}
            <Card accent="blue" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--blue)", textTransform: "uppercase", letterSpacing: ".04em" }}>Road Expense per Rider</p>
                {roadSaved && <Tag label="✓ Saved" type="green" />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div>
                  <label className="k-label">Rider</label>
                  <select className="k-input" value={roadForm.rider} onChange={e => setRoadForm(f => ({ ...f, rider: e.target.value }))}>
                    {RIDERS[branch].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="k-label">Date</label>
                  <input type="date" className="k-input" value={roadForm.date} onChange={e => setRoadForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="k-label">Amount (₦)</label>
                  <input type="number" className="k-input" placeholder="0" value={roadForm.amount} onChange={e => setRoadForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="k-label">Note</label>
                  <input className="k-input" placeholder="Fuel, toll..." value={roadForm.note} onChange={e => setRoadForm(f => ({ ...f, note: e.target.value }))} />
                </div>
              </div>
              <button onClick={saveRoadExpense} disabled={!roadForm.amount} style={{ width: "100%", padding: "9px", background: !roadForm.amount ? "#f1f5f9" : "var(--blue)", border: "none", borderRadius: "var(--r-sm)", color: !roadForm.amount ? "#94a3b8" : "#fff", fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700, cursor: !roadForm.amount ? "not-allowed" : "pointer" }}>
                Save Road Expense
              </button>
              {/* Show today's road expenses */}
              {Object.values(roadExpenses).filter(r => r.date === TODAY).length > 0 && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid var(--blue-pale2)" }}>
                  {Object.values(roadExpenses).filter(r => r.date === TODAY).map(r => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px" }}>
                      <span style={{ color: "var(--text-dim)", fontWeight: 500 }}>{r.rider}</span>
                      <span style={{ color: "var(--red)", fontWeight: 600 }}>{fmt(r.amount)} {r.note ? `· ${r.note}` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Edit modal */}
            {editingId && editForm && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                <div className="slide-down" style={{ background: "#fff", borderRadius: "var(--r-lg)", padding: "24px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
                  <p style={{ fontFamily: "var(--display)", fontSize: "15px", fontWeight: 800, marginBottom: "4px" }}>Mark as Delivered</p>
                  <p style={{ fontSize: "12px", color: "var(--text-faint)", marginBottom: "16px" }}>{editForm.customerName} · {editForm.rider}</p>

                  <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "10px" }}>Edit Products</p>
                  {editForm.products.map((p, i) => (
                    <div key={i} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"10px", marginBottom:"8px" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"8px" }}>
                        <div>
                          <label className="k-label">Vendor</label>
                          <select className="k-input" value={p.vendor||""} onChange={e => setEditForm(f => ({ ...f, products: f.products.map((pp,ii) => ii===i ? {...pp, vendor:e.target.value, name:""} : pp) }))}>
                            <option value="">Select vendor...</option>
                            {VENDOR_NAMES.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="k-label">Product</label>
                          <select className="k-input" value={p.name||""} onChange={e => setEditForm(f => ({ ...f, products: f.products.map((pp,ii) => ii===i ? {...pp, name:e.target.value} : pp) }))} disabled={!p.vendor}>
                            <option value="">Select product...</option>
                            {p.vendor && (VENDORS[p.vendor]||[]).map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                        <div><label className="k-label">Qty</label><input type="number" className="k-input" min="1" value={p.qty} onChange={e => setEditForm(f => ({ ...f, products: f.products.map((pp,ii) => ii===i ? {...pp, qty:e.target.value} : pp) }))}/></div>
                        <div><label className="k-label">Price (₦)</label><input type="number" className="k-input" placeholder="Price" value={p.price} onChange={e => setEditForm(f => ({ ...f, products: f.products.map((pp,ii) => ii===i ? {...pp, price:e.target.value} : pp) }))}/></div>
                      </div>
                    </div>
                  ))}

                  <div style={{ background: "var(--blue-pale)", border: "1.5px solid var(--blue-pale2)", borderRadius: "var(--r-sm)", padding: "10px 14px", marginBottom: "14px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-dim)" }}>Total</span>
                    <span style={{ fontFamily: "var(--display)", fontSize: "14px", fontWeight: 800, color: "var(--blue)" }}>
                      {fmt(editForm.products.reduce((s, p) => s + (Number(p.price) || 0), 0))}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={submitDelivered} style={{ flex: 1, padding: "10px", background: "var(--green)", border: "none", borderRadius: "var(--r-sm)", color: "#fff", fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(5,150,105,.25)" }}>✓ Confirm Delivered</button>
                    <button onClick={() => { setEditingId(null); setEditForm(null); }} style={{ padding: "10px 16px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", color: "var(--text-dim)", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Pending orders */}
            {pending.length > 0 && (
              <>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--amber)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "8px" }}>⏳ Pending ({pending.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                  {pending.map(o => (
                    <div key={o.id} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "12px 14px", boxShadow: "var(--shadow)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px" }}>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600 }}>{o.customerName}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>{o.address} · {o.rider} · {o.date}</p>
                          <div style={{ marginTop: "6px" }}>
                            {getProducts(o).map((p, i) => (
                              <span key={i} style={{ fontSize: "11px", color: "var(--text-dim)", marginRight: "10px" }}>🏷 {p.name} ×{p.qty} — {fmt(Number(p.price) || 0)}</span>
                            ))}
                          </div>
                        </div>
                        <span style={{ fontFamily: "var(--display)", fontSize: "14px", fontWeight: 700, color: "var(--text)", marginLeft: "12px", flexShrink: 0 }}>
                          {fmt(getProducts(o).reduce((s, p) => s + (Number(p.price) || 0), 0))}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                        <button onClick={() => markDelivered(o.id)} style={{ flex: 1, padding: "7px", background: "var(--green)", border: "none", borderRadius: "var(--r-sm)", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>✓ Delivered</button>
                        <button onClick={() => markFailed(o.id)} style={{ flex: 1, padding: "7px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "var(--r-sm)", color: "var(--red)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>✕ Failed</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Delivered orders */}
            {delivered.length > 0 && (
              <>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--green)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "8px" }}>✓ Delivered ({delivered.length})</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                  {delivered.map(o => (
                    <div key={o.id} style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: "var(--r)", padding: "12px 14px", boxShadow: "var(--shadow)" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600 }}>{o.customerName}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>{o.address} · {o.rider} · {o.date}</p>
                          <div style={{ marginTop: "6px" }}>
                            {getProducts(o).map((p, i) => (
                              <span key={i} style={{ fontSize: "11px", color: "var(--text-dim)", marginRight: "10px" }}>🏷 {p.name} ×{p.qty} — {fmt(Number(p.price) || 0)}</span>
                            ))}
                          </div>
                        </div>
                        <span style={{ fontFamily: "var(--display)", fontSize: "14px", fontWeight: 700, color: "var(--green)", marginLeft: "12px", flexShrink: 0 }}>
                          {fmt(getProducts(o).reduce((s, p) => s + (Number(p.price) || 0), 0))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Failed orders */}
            {failed.length > 0 && (
              <>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "8px" }}>✕ Failed ({failed.length}) — Not counted</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", opacity: .5 }}>
                  {failed.map(o => (
                    <div key={o.id} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "10px 14px" }}>
                      <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-dim)" }}>{o.customerName} · {o.rider}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>{getProducts(o).map(p => p.name).join(", ")}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {pending.length === 0 && delivered.length === 0 && failed.length === 0 && (
              <p style={{ textAlign: "center", padding: "48px 0", fontSize: "13px", color: "var(--text-faint)" }}>No orders in this period</p>
            )}
          </div>
        )}

        {/* ── RIDERS TAB ── */}
        {tab === "riders" && (
          <div className="fade-in">
            <SectionTitle title="Rider Summary" />
            <div style={{ background: "var(--navy)", borderRadius: "var(--r)", padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "2px" }}>Current Bonus Period</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{period.label}</p>
              </div>
              <Tag label="15th → 14th" type="navy" />
            </div>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {RIDERS[branch].map(name => {
                const rOrders = filterByPeriod(orders.filter(o => o.rider === name && o.status === "Delivered"), mode, customDate);
                const totalValue = rOrders.reduce((s, o) => s + (getProducts(o).reduce((ss, p) => ss + (Number(p.price) || 0), 0)), 0);
                const totalQty   = rOrders.reduce((s, o) => s + getProducts(o).reduce((ss, p) => ss + (Number(p.qty) || 1), 0), 0);
                const reKey      = `${name}-${TODAY}`;
                const roadExp    = roadExpenses[reKey]?.amount || 0;
                const bonusCount = orders.filter(o => o.rider === name && isInBonusPeriod(o.date) && o.status === "Delivered").length;
                return (
                  <Card key={name}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <RiderAvatar name={name} size={34} />
                        <span style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700 }}>{name}</span>
                      </div>
                      <Tag label={`Bonus ${fmt(calcBonus(bonusCount, name))}`} type="blue" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      {[
                        ["Orders", rOrders.length, "var(--text)"],
                        ["Items Delivered", totalQty, "var(--blue)"],
                        ["Total Value", fmt(totalValue), "var(--text)"],
                      ].map(([label, val, color]) => (
                        <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "8px", textAlign: "center" }}>
                          <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-faint)", marginBottom: "3px" }}>{label}</p>
                          <p style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color }}>{val}</p>
                        </div>
                      ))}
                    </div>
                    {roadExp > 0 && (
                      <p style={{ fontSize: "11px", color: "var(--red)", marginTop: "8px" }}>🛣 Road expense today: {fmt(roadExp)}</p>
                    )}
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

// ─── MINI ORDER CARD ──────────────────────────────────────────────────────────
function MiniOrderCard({ order, getProducts }) {
  const products = getProducts(order);
  const total    = products.reduce((s, p) => s + (Number(p.price) || 0), 0);
  return (
    <div style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "10px 14px", boxShadow: "var(--shadow)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600 }}>{order.customerName}</p>
          <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>{order.rider} · {order.address}</p>
        </div>
        <span style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color: "var(--blue)" }}>{fmt(total)}</span>
      </div>
    </div>
  );
}

// ─── BRANCH MANAGER VIEW ──────────────────────────────────────────────────────
// Flow: sees delivered orders per rider (total value only, not breakdown)
//       inputs cash + POS received from each rider
//       POS auto goes to boss, cash is remitted to boss
//       outstanding tracker per rider until fully cleared
function ManagerView({ branch, onLogout }) {
  const [tab, setTab]               = useState("remittance");
  const [orders, setOrders]         = useState([]);
  const [roadExpenses, setRoadExpenses] = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [remittances, setRemittances] = useState([]);
  // riderPayments: { riderId: { cash, pos, outstanding, cleared } }
  const [riderPayments, setRiderPayments] = useState({});
  const [syncing, setSyncing]       = useState(true);
  const [mode, setMode]             = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [showExpForm, setShowExpForm] = useState(false);

  const [remitSaved, setRemitSaved] = useState(false);
  const blankExp   = { date: TODAY, description: "", category: "Fuel", amount: "" };
  const blankRemit = { date: TODAY, remittedAmount: "", txID: "", note: "" };
  const [expForm, setExpForm]     = useState(blankExp);
  const [remitForm, setRemitForm] = useState(blankRemit);
  // payment input per rider
  const [payInput, setPayInput] = useState({}); // { rider: { cash:"", pos:"" } }

  useEffect(() => {
    setSyncing(true);
    Promise.all([sheetGet("Orders"), sheetGet("RoadExpenses"), sheetGet("Expenses"), sheetGet("Remittances"), sheetGet("RiderPayments")])
      .then(([o, re, e, r, rp]) => {
        setOrders(o.filter(x => x.branch === branch && x.status === "Delivered"));
        setRoadExpenses(re.filter(x => x.branch === branch));
        setExpenses(e.filter(x => x.branch === branch));
        setRemittances(r.filter(x => x.branch === branch));
        const rpMap = {};
        rp.filter(x => x.branch === branch).forEach(x => { rpMap[`${x.rider}-${x.date}`] = x; });
        setRiderPayments(rpMap);
      }).catch(() => {}).finally(() => setSyncing(false));
  }, [branch]);

  // helper
  function getProducts(order) {
    if (!order.products) return [];
    if (typeof order.products === "string") { try { return JSON.parse(order.products); } catch { return []; } }
    return order.products;
  }
  function orderTotal(order) {
    return getProducts(order).reduce((s, p) => s + (Number(p.price) || 0), 0);
  }
  function getRoadExp(rider, date) {
    return roadExpenses.find(r => r.rider === rider && r.date === date)?.amount || 0;
  }

  // Save rider payment (cash + POS received from rider)
  function saveRiderPayment(rider, date) {
    const key  = `${rider}-${date}`;
    const pi   = payInput[key] || {};
    const cash = Number(pi.cash) || 0;
    const pos  = Number(pi.pos)  || 0;
    if (!cash && !pos) return;

    const riderOrders   = orders.filter(o => o.rider === rider && o.date === date);
    const totalExpected = riderOrders.reduce((s, o) => s + orderTotal(o), 0);
    const roadExp       = getRoadExp(rider, date);
    const netExpected   = Math.max(0, totalExpected - roadExp);

    const existing    = riderPayments[key];
    const totalCash   = (existing?.cash || 0) + cash;
    const totalPOS    = (existing?.pos  || 0) + pos;
    const totalPaid   = totalCash + totalPOS;
    // Only mark cleared if netExpected > 0 AND fully paid
    const outstanding = netExpected > 0 ? Math.max(0, netExpected - totalPaid) : 0;
    const cleared     = netExpected > 0 && outstanding === 0;

    const rec = {
      id:           existing?.id || Date.now(),
      branch,
      rider,
      date,
      cash:         totalCash,
      pos:          totalPOS,
      totalExpected,
      roadExp,
      netExpected,
      outstanding,
      cleared,
    };

    setRiderPayments(p => ({ ...p, [key]: rec }));
    setPayInput(p => ({ ...p, [key]: { cash: "", pos: "" } }));
    if (existing) {
      sheetUpdate("RiderPayments", rec).catch(() => {});
    } else {
      sheetAdd("RiderPayments", rec).catch(() => {});
    }
  }

  function clearRider(rider, date, method="cash") {
    const key      = `${rider}-${date}`;
    const existing = riderPayments[key];
    if (!existing) return;
    const outstanding = existing.outstanding || 0;
    const rec = {
      ...existing,
      cash:        method === "cash" ? (existing.cash || 0) + outstanding : (existing.cash || 0),
      pos:         method === "pos"  ? (existing.pos  || 0) + outstanding : (existing.pos  || 0),
      outstanding: 0,
      cleared:     true,
      clearMethod: method,
    };
    setRiderPayments(p => ({ ...p, [key]: rec }));
    sheetUpdate("RiderPayments", rec).catch(() => {});
  }

  function saveExpense() {
    if (!expForm.date || !expForm.description || !expForm.amount) return;
    const e = { ...expForm, id: Date.now(), amount: Number(expForm.amount), branch };
    setExpenses(p => [e, ...p]); setExpForm(blankExp); setShowExpForm(false);
    sheetAdd("Expenses", e).catch(() => {});
  }

  const fOrders   = filterByPeriod(orders,     mode, customDate, customDateEnd);
  const fExpenses = filterByPeriod(expenses,    mode, customDate, customDateEnd);

  // Send to Boss calculations — driven by mode/customDate filter
  const filteredRiderPayments = Object.values(riderPayments).filter(r => filterByPeriod([{date:r.date}], mode, customDate, customDateEnd).length > 0);
  const todayRiderTotal  = fOrders.reduce((s, o) => s + orderTotal(o), 0);
  const todayBranchExp   = fExpenses.reduce((s, e) => s + e.amount, 0);
  // POS collected in period (auto to boss)
  const todayPOS  = filteredRiderPayments.reduce((s, r) => s + (r.pos || 0), 0);
  // Cash collected in period (including cleared outstanding)
  const todayCash = filteredRiderPayments.reduce((s, r) => s + (r.cash || 0), 0);
  // Cash to remit to boss = cash collected - branch expenses
  const todayCashToRemit = Math.max(0, todayCash - todayBranchExp);
  const todayAlreadySent = filterByPeriod(remittances, mode, customDate, customDateEnd).reduce((s, r) => s + r.remittedAmount, 0);
  const todayRemaining   = Math.max(0, todayCashToRemit - todayAlreadySent);

  // Get unique rider-date combos from delivered orders in filtered period
  const riderDates = [...new Set(fOrders.map(o => `${o.rider}||${o.date}`))].map(k => {
    const [rider, date] = k.split("||");
    return { rider, date };
  });

  function saveRemittance() {
    if (!remitForm.remittedAmount || !remitForm.txID) return;
    const r = { ...remitForm, id: Date.now(), branch, expectedAmount: todayRemaining, remittedAmount: Number(remitForm.remittedAmount) };
    setRemittances(p => [r, ...p]); setRemitForm(blankRemit);
    setRemitSaved(true); setTimeout(() => setRemitSaved(false), 3000);
    sheetAdd("Remittances", r).catch(() => {});
  }

  const TABS = [
    { id: "remittance", label: "Rider Remittance" },
    { id: "send",       label: "Send to Boss" },
    { id: "riders",     label: "Riders" },
    { id: "expenses",   label: "Expenses" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{GS}</style>
      <TopNav subtitle={`${branch} · Branch Manager`} tabs={TABS} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} syncing={syncing} />
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "20px 16px" }}>

        {/* ── RIDER REMITTANCE TAB ── */}
        {tab === "remittance" && (
          <div className="fade-in">
            <SectionTitle title="Rider Remittance" sub="Input cash and POS received from each rider" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <StatCard label="Total Orders Value" value={fmt(fOrders.reduce((s, o) => s + orderTotal(o), 0))} accent="blue" />
              <StatCard label="Cash Collected"     value={fmt(Object.values(riderPayments).filter(r => filterByPeriod([{ date: r.date }], mode, customDate, customDateEnd).length > 0).reduce((s, r) => s + (r.cash || 0), 0))} accent="green" />
              <StatCard label="POS Collected"      value={fmt(Object.values(riderPayments).filter(r => filterByPeriod([{ date: r.date }], mode, customDate, customDateEnd).length > 0).reduce((s, r) => s + (r.pos || 0), 0))} accent="blue" />
            </div>

            {/* Rider payment cards */}
            {riderDates.length === 0 && <p style={{ textAlign: "center", padding: "48px 0", fontSize: "13px", color: "var(--text-faint)" }}>No delivered orders in this period</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {riderDates.map(({ rider, date }) => {
                const key         = `${rider}-${date}`;
                const rOrders     = fOrders.filter(o => o.rider === rider && o.date === date);
                const totalVal    = rOrders.reduce((s, o) => s + orderTotal(o), 0);
                const roadExp     = getRoadExp(rider, date);
                const netExpected = Math.max(0, totalVal - roadExp);
                const payment     = riderPayments[key];
                const paidCash    = payment?.cash || 0;
                const paidPOS     = payment?.pos  || 0;
                const outstanding = payment?.outstanding ?? netExpected;
                const cleared     = payment?.cleared || false;
                const pi          = payInput[key] || {};

                return (
                  <div key={key} style={{
                    background: cleared ? "#ecfdf5" : outstanding > 0 && (paidCash || paidPOS) ? "#fef2f2" : "#fff",
                    border: `1.5px solid ${cleared ? "#a7f3d0" : outstanding > 0 && (paidCash || paidPOS) ? "#fecaca" : "#dde6f5"}`,
                    borderRadius: "var(--r)", padding: "16px", boxShadow: "var(--shadow)"
                  }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <RiderAvatar name={rider} size={34} />
                        <div>
                          <p style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700 }}>{rider}</p>
                          <p style={{ fontSize: "11px", color: "var(--text-faint)" }}>{date} · {rOrders.length} orders</p>
                        </div>
                      </div>
                      {cleared
                        ? <Tag label="✓ Cleared" type="green" />
                        : outstanding > 0 && (paidCash || paidPOS)
                          ? <Tag label={`Owes ${fmt(outstanding)}`} type="red" />
                          : null}
                    </div>

                    {/* Summary */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                      {[
                        ["Total Value",    fmt(totalVal),    "var(--text)"],
                        ["− Road Exp",     fmt(roadExp),     "var(--red)"],
                        ["Should Remit",   fmt(netExpected), "var(--blue)"],
                      ].map(([label, val, color]) => (
                        <div key={label} style={{ background: "rgba(255,255,255,.7)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "8px", textAlign: "center" }}>
                          <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-faint)", marginBottom: "3px" }}>{label}</p>
                          <p style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color }}>{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Already paid summary */}
                    {(paidCash > 0 || paidPOS > 0) && (
                      <div style={{ background: "rgba(255,255,255,.6)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "8px 12px", marginBottom: "10px", display: "flex", gap: "16px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Cash paid: <strong style={{ color: "var(--text)" }}>{fmt(paidCash)}</strong></span>
                        <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>POS paid: <strong style={{ color: "var(--blue)" }}>{fmt(paidPOS)}</strong></span>
                        {outstanding > 0 && <span style={{ fontSize: "11px", color: "var(--red)", marginLeft: "auto", fontWeight: 600 }}>Outstanding: {fmt(outstanding)}</span>}
                      </div>
                    )}

                    {/* Input cash + POS (only if not cleared) */}
                    {!cleared && (
                      <div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"8px" }}>
                          <div>
                            <label className="k-label">Cash Received (₦)</label>
                            <input type="number" className="k-input" placeholder="0" value={pi.cash || ""}
                              onChange={e => setPayInput(p => ({ ...p, [key]: { ...pi, cash: e.target.value } }))} />
                            {pi.cash > 0 && <p style={{ fontSize:"13px", fontWeight:700, color:"var(--blue)", marginTop:"4px", fontFamily:"var(--display)" }}>= {fmt(Number(pi.cash))}</p>}
                          </div>
                          <div>
                            <label className="k-label">POS Received (₦)</label>
                            <input type="number" className="k-input" placeholder="0" value={pi.pos || ""}
                              onChange={e => setPayInput(p => ({ ...p, [key]: { ...pi, pos: e.target.value } }))} />
                            {pi.pos > 0 && <p style={{ fontSize:"13px", fontWeight:700, color:"var(--blue)", marginTop:"4px", fontFamily:"var(--display)" }}>= {fmt(Number(pi.pos))}</p>}
                          </div>
                        </div>
                        {(Number(pi.cash) > 0 || Number(pi.pos) > 0) && (
                          <div style={{ background:"var(--blue-pale)", border:"1.5px solid var(--blue-pale2)", borderRadius:"var(--r-sm)", padding:"8px 12px", marginBottom:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:"12px", color:"var(--text-dim)", fontWeight:600 }}>Total entering</span>
                            <span style={{ fontFamily:"var(--display)", fontSize:"15px", fontWeight:800, color:"var(--blue)" }}>{fmt((Number(pi.cash)||0)+(Number(pi.pos)||0))}</span>
                          </div>
                        )}
                        <button onClick={() => saveRiderPayment(rider, date)}
                          disabled={!pi.cash && !pi.pos}
                          style={{ width:"100%", padding:"9px", background:!pi.cash&&!pi.pos?"#f1f5f9":"var(--blue)", border:"none", borderRadius:"var(--r-sm)", color:!pi.cash&&!pi.pos?"#94a3b8":"#fff", fontFamily:"var(--display)", fontSize:"12px", fontWeight:700, cursor:!pi.cash&&!pi.pos?"not-allowed":"pointer" }}>
                          Confirm
                        </button>
                      </div>
                    )}

                    {/* Outstanding clear button */}
                    {!cleared && outstanding > 0 && (paidCash > 0 || paidPOS > 0) && (
                      <div style={{ marginTop:"10px", display:"flex", gap:"8px" }}>
                        <button onClick={() => clearRider(rider, date, "cash")} style={{ flex:1, padding:"8px", background:"#ecfdf5", border:"1.5px solid #a7f3d0", borderRadius:"var(--r-sm)", color:"var(--green)", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                          ✓ Cleared by Cash
                        </button>
                        <button onClick={() => clearRider(rider, date, "pos")} style={{ flex:1, padding:"8px", background:"#eff4ff", border:"1.5px solid #bfdbfe", borderRadius:"var(--r-sm)", color:"var(--blue)", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                          ✓ Cleared by POS
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SEND TO BOSS TAB ── */}
        {tab === "send" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <SectionTitle title="Send to Boss" sub="Cash only — POS goes directly to boss" />
              {remitSaved && <Tag label="✓ Logged" type="green" />}
            </div>

            <div style={{ background: "var(--navy)", borderRadius: "var(--r)", padding: "20px", marginBottom: "16px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "4px" }}>Cash to Send Boss Today</p>
              <p style={{ fontFamily: "var(--display)", fontSize: "32px", fontWeight: 800, color: todayRemaining === 0 && todayAlreadySent > 0 ? "#34d399" : "#fff", lineHeight: 1, marginBottom: "12px" }}>
                {todayRemaining === 0 && todayAlreadySent > 0 ? "✓ All Sent" : fmt(todayRemaining)}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                {[
                  ["Cash Collected",    fmt(todayCash),       "#fff"],
                  ["− Branch Expenses", fmt(todayBranchExp),  "#fca5a5"],
                  ["= Net Cash",        fmt(todayCashToRemit), "#93c5fd"],
                  ["POS (to boss)",     fmt(todayPOS),         "#6ee7b7"],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background: "rgba(255,255,255,.07)", borderRadius: "var(--r-sm)", padding: "8px", textAlign: "center" }}>
                    <p style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "4px" }}>{label}</p>
                    <p style={{ fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700, color }}>{val}</p>
                  </div>
                ))}
              </div>
              {todayAlreadySent > 0 && (
                <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(52,211,153,.15)", border: "1px solid rgba(52,211,153,.3)", borderRadius: "var(--r-sm)", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", color: "#6ee7b7" }}>Already sent today</span>
                  <span style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color: "#34d399" }}>{fmt(todayAlreadySent)}</span>
                </div>
              )}
            </div>

            <Card accent="blue">
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--blue)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "14px" }}>Log Cash Transfer to Boss</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div><label className="k-label">Date</label><input type="date" className="k-input" value={remitForm.date} onChange={e => setRemitForm(p => ({ ...p, date: e.target.value }))} /></div>
                <div><label className="k-label">Amount Sent (₦)</label><input type="number" className="k-input" placeholder="0" value={remitForm.remittedAmount} onChange={e => setRemitForm(p => ({ ...p, remittedAmount: e.target.value }))} /></div>
                <div style={{ gridColumn: "1/-1" }}><label className="k-label">Transaction ID</label><input className="k-input" style={{ fontFamily: "monospace" }} placeholder="TRF20260305ABCD" value={remitForm.txID} onChange={e => setRemitForm(p => ({ ...p, txID: e.target.value }))} /></div>
                <div style={{ gridColumn: "1/-1" }}><label className="k-label">Note (optional)</label><input className="k-input" placeholder="Any remarks..." value={remitForm.note} onChange={e => setRemitForm(p => ({ ...p, note: e.target.value }))} /></div>
              </div>
              {remitForm.remittedAmount && (() => {
                const sending   = Number(remitForm.remittedAmount || 0);
                const diff      = sending - todayRemaining;
                const ok        = Math.abs(diff) < 1;
                const afterSend = Math.max(0, todayRemaining - sending);
                return (
                  <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "12px", marginBottom: "16px" }}>
                    {[["Still to send", fmt(todayRemaining)], ["Sending", fmt(sending)]].map(([label, val]) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>{label}</span>
                        <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500 }}>{val}</span>
                      </div>
                    ))}
                    <div style={{ height: "1px", background: "var(--border)", margin: "8px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: afterSend > 0 ? "6px" : "0" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-faint)" }}>Difference</span>
                      <span style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color: ok ? "var(--green)" : diff < 0 ? "var(--red)" : "var(--amber)" }}>
                        {ok ? "✓ Exact" : diff < 0 ? `Short ${fmt(Math.abs(diff))}` : `Over ${fmt(diff)}`}
                      </span>
                    </div>
                    {afterSend > 0 && (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "var(--r-sm)", padding: "6px 10px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "11px", color: "var(--amber)" }}>Remaining after this</span>
                        <span style={{ fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700, color: "var(--amber)" }}>{fmt(afterSend)}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
              <button onClick={saveRemittance} disabled={!remitForm.remittedAmount || !remitForm.txID} style={{
                width: "100%", padding: "12px",
                background: !remitForm.remittedAmount || !remitForm.txID ? "#f1f5f9" : "linear-gradient(135deg,var(--blue),var(--blue-dk))",
                border: "none", borderRadius: "var(--r-sm)",
                color: !remitForm.remittedAmount || !remitForm.txID ? "#94a3b8" : "#fff",
                fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700,
                cursor: !remitForm.remittedAmount || !remitForm.txID ? "not-allowed" : "pointer",
                boxShadow: !remitForm.remittedAmount || !remitForm.txID ? "none" : "0 4px 14px rgba(26,86,219,.3)",
              }}>Submit to Boss →</button>
            </Card>

            {remittances.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "8px" }}>Past Remittances</p>
                <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd}/>
                {filterByPeriod(remittances, mode, customDate, customDateEnd).length === 0
                  ? <p style={{ textAlign:"center", padding:"24px 0", fontSize:"13px", color:"var(--text-faint)" }}>No remittances in this period</p>
                  : filterByPeriod(remittances, mode, customDate, customDateEnd).map(r => <RemitCard key={r.id} rec={r} />)
                }
              </div>
            )}
          </div>
        )}

        {/* ── RIDERS TAB ── */}
        {tab === "riders" && (
          <div className="fade-in">
            <SectionTitle title="Rider Performance" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {RIDERS[branch].map(name => {
                const rOrders   = fOrders.filter(o => o.rider === name);
                const totalVal  = rOrders.reduce((s, o) => s + orderTotal(o), 0);
                const totalQty  = rOrders.reduce((s, o) => s + (typeof o.products === "string" ? JSON.parse(o.products || "[]") : (o.products || [])).reduce((ss, p) => ss + (Number(p.qty) || 1), 0), 0);
                const bonusCount = orders.filter(o => o.rider === name && isInBonusPeriod(o.date)).length;
                const outstanding = [...new Set(rOrders.map(o => o.date))].reduce((s, date) => {
                  const key = `${name}-${date}`;
                  return s + (riderPayments[key]?.outstanding || 0);
                }, 0);
                return (
                  <Card key={name}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <RiderAvatar name={name} size={34} />
                        <span style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700 }}>{name}</span>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {outstanding > 0 && <Tag label={`Owes ${fmt(outstanding)}`} type="red" />}
                        <Tag label={`Bonus ${fmt(calcBonus(bonusCount, name))}`} type="blue" />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      {[
                        ["Orders",      rOrders.length,  "var(--text)"],
                        ["Items",       totalQty,        "var(--blue)"],
                        ["Total Value", fmt(totalVal),   "var(--text)"],
                      ].map(([label, val, color]) => (
                        <div key={label} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "8px", textAlign: "center" }}>
                          <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-faint)", marginBottom: "3px" }}>{label}</p>
                          <p style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color }}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {/* ── EXPENSES TAB ── */}
        {tab === "expenses" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <SectionTitle title="Branch Expenses" />
              <button onClick={() => setShowExpForm(p => !p)} style={{ background: "var(--blue)", color: "#fff", border: "none", borderRadius: "var(--r-sm)", padding: "7px 16px", fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(26,86,219,.3)" }}>+ Add Expense</button>
            </div>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} />
            {showExpForm && (
              <Card accent="blue" style={{ marginBottom: "16px" }} className="slide-down">
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--blue)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "14px" }}>New Branch Expense</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div><label className="k-label">Date</label><input type="date" className="k-input" value={expForm.date} onChange={e => setExpForm(p => ({ ...p, date: e.target.value }))} /></div>
                  <div>
                    <label className="k-label">Category</label>
                    <input className="k-input" placeholder="e.g. Fuel, Office, Repairs..." value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))}/>
                  </div>
                  <div style={{ gridColumn: "1/-1" }}><label className="k-label">Description</label><input className="k-input" placeholder="What was this for?" value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} /></div>
                  <div><label className="k-label">Amount (₦)</label><input type="number" className="k-input" placeholder="0" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} /></div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={saveExpense} style={{ flex: 1, padding: "9px", background: "var(--blue)", border: "none", borderRadius: "var(--r-sm)", color: "#fff", fontFamily: "var(--display)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Save</button>
                  <button onClick={() => setShowExpForm(false)} style={{ padding: "9px 16px", background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", color: "var(--text-dim)", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
                </div>
              </Card>
            )}
            <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "var(--r)", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: ".06em" }}>Total</span>
              <span style={{ fontFamily: "var(--display)", fontSize: "16px", fontWeight: 800, color: "var(--red)" }}>{fmt(fExpenses.reduce((s, e) => s + e.amount, 0))}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {fExpenses.map(e => (
                <div key={e.id} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "var(--shadow)" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600 }}>{e.description}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>{e.category} · {e.date}</p>
                  </div>
                  <p style={{ fontFamily: "var(--display)", fontSize: "14px", fontWeight: 700, color: "var(--red)" }}>{fmt(e.amount)}</p>
                </div>
              ))}
              {fExpenses.length === 0 && <p style={{ textAlign: "center", padding: "48px 0", fontSize: "13px", color: "var(--text-faint)" }}>No expenses in this period</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Shared stock map builder used by BossView and InventoryAdminView
function buildBossStockMap(targetBranch, inventory, orders) {
  const vendorMap = {};
  function ensure(v, n) {
    if (!vendorMap[v]) vendorMap[v] = {};
    if (!vendorMap[v][n]) vendorMap[v][n] = {
      received:0, delivered:0, returnedTotal:0,
      transferredOut:0, transferredIn:0,
      sentTo:{}, returnedFrom:{}, receivedFrom:{}
    };
  }
  // Waybill in
  inventory.filter(i=>i.branch==="IDIMU" && i.type==="waybill-in").forEach(i=>{
    const v=(i.vendor||"").trim(), n=(i.product||"").trim();
    if(!v||!n) return; ensure(v,n);
    if(targetBranch==="IDIMU") vendorMap[v][n].received += Number(i.qty)||0;
  });
  // Waybill out
  inventory.filter(i=>i.type==="waybill-out").forEach(i=>{
    const v=(i.vendor||"").trim(), n=(i.product||"").trim(), b=i.branch||"IDIMU";
    if(!v||!n) return; ensure(v,n);
    if(targetBranch===b){
      vendorMap[v][n].returnedTotal += Number(i.qty)||0;
      if(!vendorMap[v][n].returnedFrom[b]) vendorMap[v][n].returnedFrom[b]=0;
      vendorMap[v][n].returnedFrom[b] += Number(i.qty)||0;
    }
  });
  // Transfer out
  inventory.filter(i=>i.type==="transfer-out").forEach(i=>{
    const v=(i.vendor||"").trim(), n=(i.product||"").trim();
    if(!v||!n) return; ensure(v,n);
    const from=i.fromBranch||i.branch, to=i.toBranch||"";
    if(targetBranch===from){
      vendorMap[v][n].transferredOut += Number(i.qty)||0;
      if(to){ if(!vendorMap[v][n].sentTo[to]) vendorMap[v][n].sentTo[to]=0; vendorMap[v][n].sentTo[to]+=Number(i.qty)||0; }
    }
  });
  // Transfer in
  inventory.filter(i=>i.type==="transfer-in" && i.branch===targetBranch).forEach(i=>{
    const v=(i.vendor||"").trim(), n=(i.product||"").trim();
    if(!v||!n) return; ensure(v,n);
    vendorMap[v][n].transferredIn += Number(i.qty)||0;
    const from=i.fromBranch||"";
    if(from){ if(!vendorMap[v][n].receivedFrom[from]) vendorMap[v][n].receivedFrom[from]=0; vendorMap[v][n].receivedFrom[from]+=Number(i.qty)||0; }
  });
  // Deliveries
  orders.filter(o=>o.branch===targetBranch && o.status==="Delivered").forEach(o=>{
    const prods=typeof o.products==="string"?(()=>{try{return JSON.parse(o.products);}catch{return [];}})():(o.products||[]);
    prods.forEach(p=>{
      const v=(p.vendor||"").trim(), n=(p.name||"").trim();
      if(!v||!n||!vendorMap[v]?.[n]) return;
      vendorMap[v][n].delivered += Number(p.qty)||1;
    });
  });
  return vendorMap;
}

function BossView({ onLogout }) {
  const [tab, setTab]               = useState("overview");
  const [mode, setMode]             = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [orders, setOrders]         = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [remittances, setRemittances] = useState([]);
  const [syncing, setSyncing]       = useState(true);

  const [riderPayments, setRiderPayments] = useState([]);
  const [inventory, setInventory]         = useState([]);
  const [bossInvSearch, setBossInvSearch] = useState("");
  useEffect(() => {
    setSyncing(true);
    Promise.all([sheetGet("Orders"),sheetGet("Expenses"),sheetGet("Remittances"),sheetGet("RiderPayments"),sheetGet("RoadExpenses"),sheetGet("Inventory")])
      .then(([o,e,r,rp,re,inv]) => { setOrders(o); setExpenses(e); setRemittances(r); setRiderPayments(rp); setInventory(inv);
        console.log("Inventory loaded:", inv.length, "records"); })
      .catch(()=>{}).finally(()=>setSyncing(false));
  }, []);

  const fOrders   = filterByPeriod(orders,     mode, customDate, customDateEnd);
  const fExpenses = filterByPeriod(expenses,    mode, customDate, customDateEnd);
  const fRemit    = filterByPeriod(remittances, mode, customDate, customDateEnd);
  const period    = getBonusPeriod();

  function getOrderTotal(order) {
    if (order.totalPrice) return Number(order.totalPrice) || 0;
    if (order.products) {
      const prods = typeof order.products === "string" ? (() => { try { return JSON.parse(order.products); } catch { return []; } })() : order.products;
      return prods.reduce((s,p) => s + (Number(p.price)||0), 0);
    }
    return 0;
  }

  const branchStats = BRANCHES.map(b => {
    const bo        = fOrders.filter(o=>o.branch===b);
    const done      = bo.filter(o=>o.status==="Delivered");
    const totalVal  = done.reduce((s,o)=>s+getOrderTotal(o),0);
    const branchExp = fExpenses.filter(e=>e.branch===b).reduce((s,e)=>s+e.amount,0);
    const remitRecs = fRemit.filter(r=>r.branch===b);
    const totalSent = remitRecs.reduce((s,r)=>s+r.remittedAmount,0);
    // Cash and POS from RiderPayments for this branch in this period
    const bRiderPays = riderPayments.filter(rp=>rp.branch===b && filterByPeriod([{date:rp.date}],mode,customDate, customDateEnd).length>0);
    const cashCollected = bRiderPays.reduce((s,rp)=>s+(Number(rp.cash)||0),0);
    const posCollected  = bRiderPays.reduce((s,rp)=>s+(Number(rp.pos)||0),0);
    // Net cash expected to remit = cash collected - branch expenses
    const expected     = Math.max(0, cashCollected - branchExp);
    // Remaining = expected - already sent
    const cashRemaining = Math.max(0, expected - totalSent);
    const diff          = totalSent - expected;
    // Outstanding riders — from RiderPayments
    const branchPayments   = riderPayments.filter(rp=>rp.branch===b && !rp.cleared && (rp.outstanding||0)>0);
    const totalOutstanding = branchPayments.reduce((s,rp)=>s+(Number(rp.outstanding)||0),0);
    const bonus = RIDERS[b].reduce((s,n)=>{
      const c = orders.filter(o=>o.rider===n&&isInBonusPeriod(o.date)&&o.status==="Delivered").length;
      return s+calcBonus(c,n);
    },0);
    return {branch:b,total:bo.length,delivered:done.length,totalVal,branchExp,expected,cashCollected,posCollected,cashRemaining,totalSent,diff,remitRecs,bonus,branchPayments,totalOutstanding};
  });

  const grand = {
    totalVal:      branchStats.reduce((s,b)=>s+b.totalVal,0),
    cashCollected: branchStats.reduce((s,b)=>s+b.cashCollected,0),
    posCollected:  branchStats.reduce((s,b)=>s+b.posCollected,0),
    expected:      branchStats.reduce((s,b)=>s+b.expected,0),
    sent:          branchStats.reduce((s,b)=>s+b.totalSent,0),
    remaining:     branchStats.reduce((s,b)=>s+b.cashRemaining,0),
    exp:           branchStats.reduce((s,b)=>s+b.branchExp,0),
    orders:        branchStats.reduce((s,b)=>s+b.total,0),
    bonus:         branchStats.reduce((s,b)=>s+b.bonus,0),
    outstanding:   branchStats.reduce((s,b)=>s+b.totalOutstanding,0),
  };


  const grandDiff = grand.sent - grand.expected;

  const TABS = [{id:"overview",label:"Overview"},{id:"remittances",label:"Remittances"},{id:"branches",label:"Branches"},{id:"riders",label:"All Riders"},{id:"inventory",label:"Inventory"},{id:"orders",label:"Orders"}];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <style>{GS}</style>
      <TopNav subtitle="All Branches · Boss" tabs={TABS} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} syncing={syncing}/>
      <div style={{ maxWidth:"960px", margin:"0 auto", padding:"20px 16px" }}>

        {tab==="overview" && (
          <div className="fade-in">
            <SectionTitle title="Overview"/>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd}/>

            {/* ── SECTION 1: REMITTANCE STATUS PER BRANCH ── */}
            <p style={{fontSize:"12px",fontWeight:800,color:"var(--navy)",letterSpacing:".02em",marginBottom:"8px"}}>Remittance Status</p>
            <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>
              {branchStats.map(b => {
                const allSent   = b.cashRemaining <= 0 && b.totalSent > 0;
                const noneSent  = b.totalSent === 0 && b.expected > 0;
                const partial   = b.totalSent > 0 && b.cashRemaining > 0;
                const noOrders  = b.expected === 0 && b.totalSent === 0;
                return (
                  <div key={b.branch} style={{
                    background: allSent?"#ecfdf5":noneSent?"#fef2f2":partial?"#fffbeb":"#fff",
                    border:`1.5px solid ${allSent?"#a7f3d0":noneSent?"#fecaca":partial?"#fde68a":"var(--border)"}`,
                    borderRadius:"var(--r)", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between"
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                      <div style={{width:"36px",height:"36px",borderRadius:"10px",
                        background:allSent?"#dcfce7":noneSent?"#fee2e2":partial?"#fef9c3":"#eff4ff",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontFamily:"var(--display)",fontSize:"14px",fontWeight:800,
                        color:allSent?"var(--green)":noneSent?"var(--red)":partial?"var(--amber)":"var(--blue)"}}>
                        {b.branch[0]}
                      </div>
                      <div>
                        <p style={{fontFamily:"var(--display)",fontSize:"14px",fontWeight:700,marginBottom:"2px"}}>{b.branch}</p>
                        <p style={{fontSize:"11px",color:"var(--text-faint)"}}>
                          {b.delivered} order{b.delivered!==1?"s":""} · {fmt(b.totalVal)} collected
                        </p>
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      {allSent && <p style={{fontFamily:"var(--display)",fontSize:"13px",fontWeight:700,color:"var(--green)"}}>✓ All Sent</p>}
                      {noneSent && <p style={{fontFamily:"var(--display)",fontSize:"13px",fontWeight:700,color:"var(--red)"}}>⚠ Not Sent</p>}
                      {partial && <p style={{fontFamily:"var(--display)",fontSize:"13px",fontWeight:700,color:"var(--amber)"}}>Partial</p>}
                      {noOrders && <p style={{fontSize:"12px",color:"var(--text-faint)"}}>No orders</p>}
                      {(noneSent||partial) && b.expected>0 && (
                        <p style={{fontSize:"11px",color:"var(--text-faint)",marginTop:"2px"}}>
                          {partial?`${fmt(b.cashRemaining)} remaining`:`${fmt(b.expected)} expected`}
                        </p>
                      )}
                      {allSent && <p style={{fontSize:"11px",color:"var(--text-faint)",marginTop:"2px"}}>{fmt(b.totalSent)} sent</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── SECTION 2: TOTALS SUMMARY ── */}
            <p style={{fontSize:"12px",fontWeight:800,color:"var(--navy)",letterSpacing:".02em",marginBottom:"8px"}}>Today's Totals</p>
            <div style={{background:"var(--navy)",borderRadius:"var(--r)",padding:"16px",marginBottom:"20px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
                {[
                  ["Orders Value",   fmt(grand.totalVal),      "#fff"],
                  ["Cash Collected", fmt(grand.cashCollected),  "#93c5fd"],
                  ["POS Collected",  fmt(grand.posCollected),   "#6ee7b7"],
                  ["Branch Expenses",fmt(grand.exp),            "#fca5a5"],
                ].map(([label,val,color])=>(
                  <div key={label} style={{background:"rgba(255,255,255,.07)",borderRadius:"var(--r-sm)",padding:"10px 12px"}}>
                    <p style={{fontSize:"10px",fontWeight:600,color:"rgba(255,255,255,.45)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"4px"}}>{label}</p>
                    <p style={{fontFamily:"var(--display)",fontSize:"16px",fontWeight:800,color}}>{val}</p>
                  </div>
                ))}
              </div>
              <div style={{height:"1px",background:"rgba(255,255,255,.1)",margin:"0 0 10px"}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}>
                {[
                  ["Net Expected",  fmt(grand.expected),  "#fff"],
                  ["Cash Sent",     fmt(grand.sent),       grand.remaining<=0&&grand.sent>0?"#34d399":"#93c5fd"],
                  ["Still to Send", fmt(grand.remaining),  grand.remaining>0?"#fbbf24":"#34d399"],
                ].map(([label,val,color])=>(
                  <div key={label} style={{textAlign:"center"}}>
                    <p style={{fontSize:"9px",fontWeight:600,color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"3px"}}>{label}</p>
                    <p style={{fontFamily:"var(--display)",fontSize:"15px",fontWeight:800,color}}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── SECTION 3: OUTSTANDING RIDERS ── */}
            {branchStats.some(b=>b.branchPayments.length>0) && (
              <>
                <p style={{fontSize:"12px",fontWeight:800,color:"var(--navy)",letterSpacing:".02em",marginBottom:"8px"}}>Outstanding Riders</p>
                <div style={{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"20px"}}>
                  {branchStats.filter(b=>b.branchPayments.length>0).map(b=>(
                    b.branchPayments.map(rp=>(
                      <div key={rp.id||rp.rider} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"var(--r-sm)",padding:"7px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          <RiderAvatar name={rp.rider} size={24}/>
                          <div>
                            <p style={{fontSize:"12px",fontWeight:600}}>{rp.rider}</p>
                            <p style={{fontSize:"10px",color:"var(--text-faint)"}}>{b.branch} · {rp.date}</p>
                          </div>
                        </div>
                        <p style={{fontFamily:"var(--display)",fontSize:"13px",fontWeight:800,color:"var(--red)"}}>{fmt(rp.outstanding)}</p>
                      </div>
                    ))
                  ))}
                </div>
              </>
            )}

            {/* ── SECTION 4: QUICK STATS ── */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}>
              <StatCard label="Total Orders"    value={String(grand.orders)}/>
              <StatCard label="Bonus Due"       value={fmt(grand.bonus)} accent="blue" sub={period.label}/>
              <StatCard label="Outstanding"     value={fmt(grand.outstanding)} accent={grand.outstanding>0?"red":"green"}/>
            </div>
          </div>
        )}

        {tab==="remittances" && (
          <div className="fade-in">
            <SectionTitle title="Branch Remittances"/>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd}/>
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
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd}/>
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
                      ["Cash Collected",  fmt(b.cashCollected),  "var(--blue)"],
                      ["POS Collected",   fmt(b.posCollected),   "var(--green)"],
                      ["Net Expected",    fmt(b.expected),       "var(--text)"],
                      ["Cash Sent",       fmt(b.totalSent),      b.diff<0?"var(--red)":Math.abs(b.diff)<1&&b.totalSent>0?"var(--green)":"var(--text)"],
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
                    return <BonusRow key={name} name={name} count={count} period={period.label}/>;
                  })}
                  <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:"1.5px solid var(--border)",
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:"11px", fontWeight:600, color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:".04em" }}>{b} Total</span>
                    <span style={{ fontFamily:"var(--display)", fontSize:"15px", fontWeight:800, color:"var(--blue)" }}>
                      {fmt(RIDERS[b].reduce((s,n)=>s+calcBonus(orders.filter(o=>o.rider===n&&isInBonusPeriod(o.date)&&o.status==="Delivered").length,n),0))}
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        {tab==="inventory" && (
          <div className="fade-in">
            <SectionTitle title="All Branches Inventory"/>
            <input className="k-input" placeholder="🔍 Search vendor or product..." value={bossInvSearch} onChange={e=>setBossInvSearch(e.target.value)} style={{marginBottom:"16px"}}/>
            {BRANCHES.map(b => {
              // Use same buildStockMap logic as inventory admin
              const vendorMap = buildBossStockMap(b, inventory, orders);
              const vendorList = Object.keys(vendorMap).filter(v =>
                !bossInvSearch ||
                v.toLowerCase().includes(bossInvSearch.toLowerCase()) ||
                Object.keys(vendorMap[v]).some(p=>p.toLowerCase().includes(bossInvSearch.toLowerCase()))
              ).sort();
              if (vendorList.length===0) return null;
              return (
                <div key={b} style={{marginBottom:"24px"}}>
                  <div style={{background:"var(--navy)",borderRadius:"var(--r)",padding:"10px 16px",marginBottom:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <p style={{fontFamily:"var(--display)",fontSize:"15px",fontWeight:800,color:"#fff"}}>{b} Branch</p>
                    <span style={{fontSize:"11px",color:"rgba(255,255,255,.5)"}}>{vendorList.length} vendors</span>
                  </div>
                  {vendorList.map(vendor=>{
                    const products = Object.entries(vendorMap[vendor])
                      .filter(([name])=> !bossInvSearch || vendor.toLowerCase().includes(bossInvSearch.toLowerCase()) || name.toLowerCase().includes(bossInvSearch.toLowerCase()))
                      .map(([name,s])=>{
                        const remaining = b==="IDIMU"
                          ? s.received - s.returnedTotal - s.transferredOut + s.transferredIn - s.delivered
                          : s.transferredIn - s.transferredOut - s.delivered;
                        return {name,...s,remaining};
                      });
                    return (
                      <div key={vendor} style={{marginBottom:"10px"}}>
                        <p style={{fontSize:"11px",fontWeight:700,color:"var(--blue)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:"6px",paddingLeft:"4px"}}>{vendor}</p>
                        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                          {products.map(item=>(
                            <div key={item.name} style={{
                              background:item.remaining<=0?"#fef2f2":"#fff",
                              border:`1.5px solid ${item.remaining<=0?"#fecaca":"var(--border)"}`,
                              borderRadius:"var(--r-sm)", padding:"8px 14px",
                              display:"flex", alignItems:"center", justifyContent:"space-between"
                            }}>
                              <p style={{fontSize:"12px",fontWeight:600,color:item.remaining<=0?"var(--red)":"var(--text)"}}>{item.name}</p>
                              <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
                                {b==="IDIMU"
                                  ? [["Received",item.received,"var(--green)"],["Sent Out",item.transferredOut,"var(--amber)"],["Delivered",item.delivered,"var(--blue)"],["Remaining",item.remaining,item.remaining<=0?"var(--red)":"var(--blue)"]]
                                  : [["Transferred In",item.transferredIn,"var(--green)"],["Delivered",item.delivered,"var(--blue)"],["Remaining",item.remaining,item.remaining<=0?"var(--red)":"var(--blue)"]]
                                }.map(([label,val,color])=>(
                                  <div key={label} style={{textAlign:"center",minWidth:"52px"}}>
                                    <p style={{fontSize:"8px",color:"var(--text-faint)",fontWeight:600,marginBottom:"2px"}}>{label}</p>
                                    <p style={{fontFamily:"var(--display)",fontSize:"14px",fontWeight:800,color}}>{val}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {tab==="orders" && (
          <div className="fade-in">
            <SectionTitle title="All Orders"/>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd}/>
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

// ─── INVENTORY ADMIN VIEW (IDIMU) ────────────────────────────────────────────
function InventoryAdminView({ branch, onLogout }) {
  const [tab, setTab] = useState("stock");
  const [inventory, setInventory] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [syncing, setSyncing] = useState(true);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [saved, setSaved] = useState("");

  // Forms
  const [waybillInForm, setWaybillInForm]   = useState({ date: TODAY, vendor: VENDOR_NAMES[0], product: "", qty: "", note: "" });
  const [waybillOutForm, setWaybillOutForm] = useState({ date: TODAY, vendor: VENDOR_NAMES[0], product: "", qty: "", note: "" });
  const [transferForm, setTransferForm]     = useState({ date: TODAY, vendor: VENDOR_NAMES[0], product: "", qty: "", fromBranch: "IDIMU", toBranch: "KETU", note: "" });

  useEffect(() => {
    setSyncing(true);
    Promise.all([sheetGet("Inventory"), sheetGet("Orders")])
      .then(([inv, ord]) => { setInventory(inv); setAllOrders(ord.filter(o => o.status === "Delivered")); })
      .catch(() => {}).finally(() => setSyncing(false));
  }, []);

  function saveEntry(type, form, resetForm) {
    if (!form.vendor || !form.product || !form.qty) return;
    const fromBranch = form.fromBranch || "IDIMU";
    const toBranch   = form.toBranch || "";
    const qty        = Number(form.qty) || 0;
    // Build record cleanly — branch = where it originates
    const rec = {
      id: Date.now(), type,
      branch: fromBranch,
      date: form.date || TODAY,
      vendor: form.vendor,
      product: form.product,
      qty,
      note: form.note || "",
      fromBranch,
      toBranch,
    };
    setInventory(p => [rec, ...p]);
    resetForm();
    setSaved(type); setTimeout(() => setSaved(""), 3000);
    sheetAdd("Inventory", rec).catch(() => {});
    // For transfers, also save a transfer-in record for the receiving branch
    if (type === "transfer-out" && toBranch) {
      const recIn = {
        ...rec,
        id: Date.now() + 1,
        type: "transfer-in",
        branch: toBranch,
        fromBranch,
        toBranch,
      };
      setInventory(p => [recIn, ...p]);
      sheetAdd("Inventory", recIn).catch(() => {});
    }
  }

  // Build stock map for a given branch with optional date filter
  function buildStockMap(targetBranch, filteredInv, filteredOrds) {
    const inv  = filteredInv  || inventory;
    const ords = filteredOrds || allOrders;
    const vendorMap = {};

    function ensure(v, n) {
      if (!vendorMap[v]) vendorMap[v] = {};
      if (!vendorMap[v][n]) vendorMap[v][n] = {
        received: 0, delivered: 0, returnedTotal: 0,
        transferredOut: 0, transferredIn: 0,
        sentTo: {}, returnedFrom: {}, receivedFrom: {}
      };
    }

    // Waybill in
    inv.filter(i => i.branch === "IDIMU" && i.type === "waybill-in").forEach(i => {
      const v = (i.vendor||"").trim(), n = (i.product||"").trim();
      if (!v||!n) return;
      ensure(v, n);
      if (targetBranch === "IDIMU") vendorMap[v][n].received += Number(i.qty)||0;
    });

    // Waybill out (returned to vendor) — track who returned
    inv.filter(i => i.type === "waybill-out").forEach(i => {
      const v=(i.vendor||"").trim(), n=(i.product||"").trim(), b=i.branch||"IDIMU";
      if (!v||!n) return;
      ensure(v, n);
      if (targetBranch === b) {
        vendorMap[v][n].returnedTotal += Number(i.qty)||0;
        if (!vendorMap[v][n].returnedFrom[b]) vendorMap[v][n].returnedFrom[b] = 0;
        vendorMap[v][n].returnedFrom[b] += Number(i.qty)||0;
      }
    });

    // Transfer out — any branch sending to another (deduct from sender)
    inv.filter(i => i.type === "transfer-out").forEach(i => {
      const v=(i.vendor||"").trim(), n=(i.product||"").trim();
      if (!v||!n) return;
      ensure(v, n);
      const from = i.fromBranch || i.branch;
      const to   = i.toBranch || "";
      if (targetBranch === from) {
        vendorMap[v][n].transferredOut += Number(i.qty)||0;
        if (to) {
          if (!vendorMap[v][n].sentTo[to]) vendorMap[v][n].sentTo[to] = 0;
          vendorMap[v][n].sentTo[to] += Number(i.qty)||0;
        }
      }
    });

    // Transfer in — ONLY use transfer-in records for receiving branches
    inv.filter(i => i.type === "transfer-in" && i.branch === targetBranch).forEach(i => {
      const v=(i.vendor||"").trim(), n=(i.product||"").trim();
      if (!v||!n) return;
      ensure(v, n);
      vendorMap[v][n].transferredIn += Number(i.qty)||0;
      // Track which branch sent it
      const from = i.fromBranch || "";
      if (from) {
        if (!vendorMap[v][n].receivedFrom) vendorMap[v][n].receivedFrom = {};
        if (!vendorMap[v][n].receivedFrom[from]) vendorMap[v][n].receivedFrom[from] = 0;
        vendorMap[v][n].receivedFrom[from] += Number(i.qty)||0;
      }
    });

    // Deliveries
    ords.filter(o => o.branch === targetBranch).forEach(o => {
      const prods = typeof o.products==="string"?(()=>{try{return JSON.parse(o.products);}catch{return [];}})():(o.products||[]);
      prods.forEach(p => {
        const v=(p.vendor||"").trim(), n=(p.name||"").trim();
        if (!v||!n||!vendorMap[v]?.[n]) return;
        vendorMap[v][n].delivered += Number(p.qty)||1;
      });
    });

    return vendorMap;
  }

  const TABS = [
    { id: "stock",       label: "📦 All Stock" },
    { id: "waybill-in",  label: "⬇ Waybill In" },
    { id: "waybill-out", label: "⬆ Waybill Out" },
    { id: "transfer",    label: "↔ Transfer" },
    { id: "history",     label: "📋 History" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{GS}</style>
      <TopNav subtitle="Inventory Admin · IDIMU" tabs={TABS} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} syncing={syncing} />
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "20px 16px" }}>

        {/* ── ALL STOCK ── */}
        {tab === "stock" && (
          <div className="fade-in">
            <SectionTitle title="Stock Overview — All Branches" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd}/>
            <input className="k-input" placeholder="🔍 Search vendor or product..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: "16px" }} />
            {BRANCHES.map(b => {
              const filteredInv  = filterByPeriod(inventory, mode, customDate, customDateEnd);
              const filteredOrds = filterByPeriod(allOrders, mode, customDate, customDateEnd);
              const vendorMap = buildStockMap(b, filteredInv, filteredOrds);
              const vendorList = Object.keys(vendorMap).filter(v =>
                !search || v.toLowerCase().includes(search.toLowerCase()) ||
                Object.keys(vendorMap[v]).some(p => p.toLowerCase().includes(search.toLowerCase()))
              ).sort();
              if (vendorList.length === 0) return null;
              return (
                <div key={b} style={{ marginBottom: "24px" }}>
                  <div style={{ background: "var(--navy)", borderRadius: "var(--r)", padding: "10px 16px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontFamily: "var(--display)", fontSize: "15px", fontWeight: 800, color: "#fff" }}>{b} Branch</p>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,.5)" }}>{vendorList.length} vendors</span>
                  </div>
                  {vendorList.map(vendor => {
                    const products = Object.entries(vendorMap[vendor])
                      .filter(([name]) => !search || vendor.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase()))
                      .map(([name, s]) => {
                        const remaining = b === "IDIMU"
                          ? s.received - s.returnedTotal - s.transferredOut + s.transferredIn - s.delivered
                          : s.transferredIn - s.transferredOut - s.delivered;
                        return { name, ...s, remaining };
                      });
                    return (
                      <div key={vendor} style={{ marginBottom: "12px" }}>
                        <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--blue)", marginBottom: "6px", paddingLeft: "4px" }}>{vendor}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {products.map(item => (
                            <div key={item.name} style={{
                              background: item.remaining <= 0 ? "#fef2f2" : "#fff",
                              border: `1.5px solid ${item.remaining <= 0 ? "#fecaca" : "var(--border)"}`,
                              borderRadius: "var(--r-sm)", padding: "12px 14px",
                            }}>
                              {/* Product name + remaining */}
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                                <p style={{ fontSize: "13px", fontWeight: 700, color: item.remaining <= 0 ? "var(--red)" : "var(--text)" }}>{item.name}</p>
                                <div style={{ textAlign:"center", background: item.remaining <= 0 ? "#fecaca" : "var(--blue-pale)", border:`1px solid ${item.remaining<=0?"#fca5a5":"var(--blue-pale2)"}`, borderRadius:"var(--r-sm)", padding:"4px 14px" }}>
                                  <p style={{ fontSize:"9px", fontWeight:700, color:item.remaining<=0?"var(--red)":"var(--blue)", marginBottom:"1px" }}>Remaining</p>
                                  <p style={{ fontFamily:"var(--display)", fontSize:"20px", fontWeight:800, color:item.remaining<=0?"var(--red)":"var(--blue)", lineHeight:1 }}>{item.remaining}</p>
                                </div>
                              </div>
                              {/* Stats row */}
                              {b === "IDIMU" ? (
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"8px" }}>
                                  <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"8px" }}>
                                    <p style={{ fontSize:"10px", color:"var(--text-faint)", fontWeight:600, marginBottom:"4px" }}>Received</p>
                                    <p style={{ fontFamily:"var(--display)", fontSize:"18px", fontWeight:800, color:"var(--green)" }}>{item.received}</p>
                                  </div>
                                  <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"8px" }}>
                                    <p style={{ fontSize:"10px", color:"var(--text-faint)", fontWeight:600, marginBottom:"4px" }}>Delivered</p>
                                    <p style={{ fontFamily:"var(--display)", fontSize:"18px", fontWeight:800, color:"var(--blue)" }}>{item.delivered}</p>
                                  </div>
                                  <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:"var(--r-sm)", padding:"8px" }}>
                                    <p style={{ fontSize:"10px", color:"var(--amber)", fontWeight:700, marginBottom:"4px" }}>Sent Out — {item.transferredOut}</p>
                                    {Object.entries(item.sentTo||{}).map(([br, qty]) => (
                                      <div key={br} style={{ display:"flex", justifyContent:"space-between" }}>
                                        <span style={{ fontSize:"12px", color:"var(--text-dim)", fontWeight:600 }}>{br}</span>
                                        <span style={{ fontSize:"12px", fontWeight:800, color:"var(--amber)" }}>{qty}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"8px" }}>
                                    <p style={{ fontSize:"10px", color:"var(--text-dim)", fontWeight:700, marginBottom:"4px" }}>Returned — {item.returnedTotal}</p>
                                    {Object.entries(item.returnedFrom||{}).map(([br, qty]) => (
                                      <div key={br} style={{ display:"flex", justifyContent:"space-between" }}>
                                        <span style={{ fontSize:"12px", color:"var(--text-dim)", fontWeight:600 }}>{br}</span>
                                        <span style={{ fontSize:"12px", fontWeight:800, color:"var(--text-dim)" }}>{qty}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
                                  <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"8px" }}>
                                    <p style={{ fontSize:"10px", color:"var(--text-faint)", fontWeight:600, marginBottom:"4px" }}>Received In</p>
                                    <p style={{ fontFamily:"var(--display)", fontSize:"18px", fontWeight:800, color:"var(--green)" }}>{item.transferredIn}</p>
                                    {Object.entries(item.receivedFrom||{}).map(([br,qty])=>(
                                      <div key={br} style={{display:"flex",justifyContent:"space-between"}}>
                                        <span style={{fontSize:"11px",color:"var(--text-dim)",fontWeight:600}}>{br}</span>
                                        <span style={{fontSize:"11px",fontWeight:800,color:"var(--green)"}}>{qty}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"8px" }}>
                                    <p style={{ fontSize:"10px", color:"var(--text-faint)", fontWeight:600, marginBottom:"4px" }}>Delivered</p>
                                    <p style={{ fontFamily:"var(--display)", fontSize:"18px", fontWeight:800, color:"var(--blue)" }}>{item.delivered}</p>
                                  </div>
                                  {item.transferredOut > 0 && (
                                    <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:"var(--r-sm)", padding:"8px" }}>
                                      <p style={{ fontSize:"10px", color:"var(--amber)", fontWeight:700, marginBottom:"4px" }}>Sent Out — {item.transferredOut}</p>
                                      {Object.entries(item.sentTo||{}).map(([br,qty])=>(
                                        <div key={br} style={{display:"flex",justifyContent:"space-between"}}>
                                          <span style={{fontSize:"11px",color:"var(--text-dim)",fontWeight:600}}>{br}</span>
                                          <span style={{fontSize:"11px",fontWeight:800,color:"var(--amber)"}}>{qty}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ── WAYBILL IN ── */}
        {tab === "waybill-in" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <SectionTitle title="Waybill In" sub="Products received from vendors" />
              {saved === "waybill-in" && <Tag label="✓ Saved" type="green" />}
            </div>
            <Card accent="blue">
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--blue)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "14px" }}>Log Stock Received</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div><label className="k-label">Date</label><input type="date" className="k-input" value={waybillInForm.date} onChange={e => setWaybillInForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div>
                  <label className="k-label">Vendor</label>
                  <select className="k-input" value={waybillInForm.vendor} onChange={e => setWaybillInForm(f => ({ ...f, vendor: e.target.value, product: "" }))}>
                    {VENDOR_NAMES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="k-label">Product</label>
                  <select className="k-input" value={waybillInForm.product} onChange={e => setWaybillInForm(f => ({ ...f, product: e.target.value }))} disabled={!waybillInForm.vendor}>
                    <option value="">Select product...</option>
                    {(VENDORS[waybillInForm.vendor] || []).map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div><label className="k-label">Quantity</label><input type="number" className="k-input" min="1" placeholder="0" value={waybillInForm.qty} onChange={e => setWaybillInForm(f => ({ ...f, qty: e.target.value }))} /></div>
                <div style={{ gridColumn: "1/-1" }}><label className="k-label">Note (optional)</label><input className="k-input" placeholder="Waybill no., remarks..." value={waybillInForm.note} onChange={e => setWaybillInForm(f => ({ ...f, note: e.target.value }))} /></div>
              </div>
              <button disabled={!waybillInForm.product || !waybillInForm.qty}
                onClick={() => saveEntry("waybill-in", waybillInForm, () => setWaybillInForm({ date: TODAY, vendor: VENDOR_NAMES[0], product: "", qty: "", note: "" }))}
                style={{ width: "100%", padding: "10px", background: !waybillInForm.product || !waybillInForm.qty ? "#f1f5f9" : "var(--green)", border: "none", borderRadius: "var(--r-sm)", color: !waybillInForm.product || !waybillInForm.qty ? "#94a3b8" : "#fff", fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, cursor: !waybillInForm.product || !waybillInForm.qty ? "not-allowed" : "pointer" }}>
                Save Waybill In
              </button>
            </Card>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd} />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {filterByPeriod(inventory.filter(i => i.type === "waybill-in"), mode, customDate, customDateEnd).map(i => (
                <div key={i.id} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow)" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600 }}>{i.product}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>{i.vendor} · {i.date}{i.note ? ` · ${i.note}` : ""}</p>
                  </div>
                  <Tag label={`+${i.qty}`} type="green" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── WAYBILL OUT ── */}
        {tab === "waybill-out" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <SectionTitle title="Waybill Out" sub="Products returned to vendors" />
              {saved === "waybill-out" && <Tag label="✓ Saved" type="green" />}
            </div>
            <Card accent="blue">
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--blue)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "14px" }}>Log Return to Vendor</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div><label className="k-label">Date</label><input type="date" className="k-input" value={waybillOutForm.date} onChange={e => setWaybillOutForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div>
                  <label className="k-label">Vendor</label>
                  <select className="k-input" value={waybillOutForm.vendor} onChange={e => setWaybillOutForm(f => ({ ...f, vendor: e.target.value, product: "" }))}>
                    {VENDOR_NAMES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="k-label">Product</label>
                  <select className="k-input" value={waybillOutForm.product} onChange={e => setWaybillOutForm(f => ({ ...f, product: e.target.value }))} disabled={!waybillOutForm.vendor}>
                    <option value="">Select product...</option>
                    {(VENDORS[waybillOutForm.vendor] || []).map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div><label className="k-label">Quantity</label><input type="number" className="k-input" min="1" placeholder="0" value={waybillOutForm.qty} onChange={e => setWaybillOutForm(f => ({ ...f, qty: e.target.value }))} /></div>
                <div style={{ gridColumn: "1/-1" }}><label className="k-label">Note (optional)</label><input className="k-input" placeholder="Reason, waybill no..." value={waybillOutForm.note} onChange={e => setWaybillOutForm(f => ({ ...f, note: e.target.value }))} /></div>
              </div>
              <button disabled={!waybillOutForm.product || !waybillOutForm.qty}
                onClick={() => saveEntry("waybill-out", waybillOutForm, () => setWaybillOutForm({ date: TODAY, vendor: VENDOR_NAMES[0], product: "", qty: "", note: "" }))}
                style={{ width: "100%", padding: "10px", background: !waybillOutForm.product || !waybillOutForm.qty ? "#f1f5f9" : "var(--amber)", border: "none", borderRadius: "var(--r-sm)", color: !waybillOutForm.product || !waybillOutForm.qty ? "#94a3b8" : "#fff", fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, cursor: !waybillOutForm.product || !waybillOutForm.qty ? "not-allowed" : "pointer" }}>
                Save Waybill Out
              </button>
            </Card>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd} />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {filterByPeriod(inventory.filter(i => i.type === "waybill-out"), mode, customDate, customDateEnd).map(i => (
                <div key={i.id} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow)" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600 }}>{i.product}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>{i.vendor} · {i.date}{i.note ? ` · ${i.note}` : ""}</p>
                  </div>
                  <Tag label={`-${i.qty}`} type="amber" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TRANSFER ── */}
        {tab === "transfer" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <SectionTitle title="Transfer Stock" sub="Move products between branches" />
              {saved === "transfer-out" && <Tag label="✓ Transferred" type="green" />}
            </div>
            <Card accent="blue">
              <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--blue)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "14px" }}>Log Transfer</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div><label className="k-label">Date</label><input type="date" className="k-input" value={transferForm.date} onChange={e => setTransferForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div>
                  <label className="k-label">Vendor</label>
                  <select className="k-input" value={transferForm.vendor} onChange={e => setTransferForm(f => ({ ...f, vendor: e.target.value, product: "" }))}>
                    {VENDOR_NAMES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="k-label">Product</label>
                  <select className="k-input" value={transferForm.product} onChange={e => setTransferForm(f => ({ ...f, product: e.target.value }))} disabled={!transferForm.vendor}>
                    <option value="">Select product...</option>
                    {(VENDORS[transferForm.vendor] || []).map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div><label className="k-label">Quantity</label><input type="number" className="k-input" min="1" placeholder="0" value={transferForm.qty} onChange={e => setTransferForm(f => ({ ...f, qty: e.target.value }))} /></div>
                <div>
                  <label className="k-label">From Branch</label>
                  <select className="k-input" value={transferForm.fromBranch} onChange={e => setTransferForm(f => ({ ...f, fromBranch: e.target.value }))}>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="k-label">To Branch</label>
                  <select className="k-input" value={transferForm.toBranch} onChange={e => setTransferForm(f => ({ ...f, toBranch: e.target.value }))}>
                    {BRANCHES.filter(b => b !== transferForm.fromBranch).map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1/-1" }}><label className="k-label">Note (optional)</label><input className="k-input" placeholder="Any remarks..." value={transferForm.note} onChange={e => setTransferForm(f => ({ ...f, note: e.target.value }))} /></div>
              </div>
              {(() => {
                // Check remaining stock in fromBranch
                const fromMap = buildStockMap(transferForm.fromBranch, inventory, allOrders);
                const fromProduct = fromMap[transferForm.vendor]?.[transferForm.product];
                const fromRemaining = fromProduct
                  ? (transferForm.fromBranch === "IDIMU"
                      ? fromProduct.received - fromProduct.returnedTotal - fromProduct.transferredOut + fromProduct.transferredIn - fromProduct.delivered
                      : fromProduct.transferredIn - fromProduct.transferredOut - fromProduct.delivered)
                  : 0;
                const transferQty = Number(transferForm.qty) || 0;
                const overStock = transferQty > fromRemaining && transferForm.product && transferQty > 0;
                const disabled = !transferForm.product || !transferForm.qty || transferForm.fromBranch === transferForm.toBranch || overStock;
                return (
                  <>
                    {overStock && (
                      <div style={{ background:"#fef2f2", border:"1.5px solid #fecaca", borderRadius:"var(--r-sm)", padding:"10px 14px", marginBottom:"12px" }}>
                        <p style={{ fontSize:"12px", fontWeight:600, color:"var(--red)" }}>⚠ Not enough stock</p>
                        <p style={{ fontSize:"11px", color:"#f87171", marginTop:"2px" }}>
                          {transferForm.fromBranch} only has {fromRemaining} units of {transferForm.product} remaining. You are trying to transfer {transferQty}.
                        </p>
                      </div>
                    )}
                    {transferForm.product && fromRemaining >= 0 && !overStock && transferForm.qty && (
                      <div style={{ background:"var(--blue-pale)", border:"1.5px solid var(--blue-pale2)", borderRadius:"var(--r-sm)", padding:"8px 14px", marginBottom:"12px", display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:"12px", color:"var(--text-dim)" }}>{transferForm.fromBranch} remaining after transfer</span>
                        <span style={{ fontFamily:"var(--display)", fontSize:"13px", fontWeight:700, color:"var(--blue)" }}>{fromRemaining - transferQty}</span>
                      </div>
                    )}
                    <button disabled={disabled}
                      onClick={() => saveEntry("transfer-out", transferForm, () => setTransferForm({ date: TODAY, vendor: VENDOR_NAMES[0], product: "", qty: "", fromBranch: "IDIMU", toBranch: "KETU", note: "" }))}
                      style={{ width:"100%", padding:"10px", background:disabled?"#f1f5f9":"var(--blue)", border:"none", borderRadius:"var(--r-sm)", color:disabled?"#94a3b8":"#fff", fontFamily:"var(--display)", fontSize:"13px", fontWeight:700, cursor:disabled?"not-allowed":"pointer" }}>
                      Confirm Transfer
                    </button>
                  </>
                );
              })()}
            </Card>
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd} />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {filterByPeriod(inventory.filter(i => i.type === "transfer-out"), mode, customDate, customDateEnd).map(i => (
                <div key={i.id} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow)" }}>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600 }}>{i.product}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>{i.vendor} · {i.fromBranch} → {i.toBranch} · {i.date}</p>
                  </div>
                  <Tag label={`${i.qty} units`} type="blue" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          <div className="fade-in">
            <SectionTitle title="Full History" />
            <PeriodFilter mode={mode} setMode={setMode} customDate={customDate} setCustomDate={setCustomDate} customDateEnd={customDateEnd} setCustomDateEnd={setCustomDateEnd} />
            <input className="k-input" placeholder="🔍 Search product or vendor..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: "12px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {filterByPeriod(inventory, mode, customDate, customDateEnd)
                .filter(i => !search || i.product?.toLowerCase().includes(search.toLowerCase()) || i.vendor?.toLowerCase().includes(search.toLowerCase()))
                .sort((a, b) => b.id - a.id)
                .map(i => {
                  const typeMap = { "waybill-in": ["⬇ Waybill In", "green"], "waybill-out": ["⬆ Waybill Out", "amber"], "transfer-out": ["→ Transfer Out", "blue"], "transfer-in": ["← Transfer In", "blue"] };
                  const [label, type] = typeMap[i.type] || ["?", "default"];
                  return (
                    <div key={i.id} style={{ background: "#fff", border: "1.5px solid var(--border)", borderRadius: "var(--r-sm)", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow)" }}>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600 }}>{i.product}</p>
                        <p style={{ fontSize: "11px", color: "var(--text-faint)", marginTop: "2px" }}>
                          {i.vendor} · {i.branch} · {i.date}
                          {i.type === "transfer-out" ? ` → ${i.toBranch}` : ""}
                          {i.note ? ` · ${i.note}` : ""}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <Tag label={label} type={type} />
                        <span style={{ fontFamily: "var(--display)", fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{i.qty}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── INVENTORY VIEW ONLY (KETU / AJA) ────────────────────────────────────────
function InventoryViewOnly({ branch, onLogout }) {
  const [inventory, setInventory] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [syncing, setSyncing] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSyncing(true);
    Promise.all([sheetGet("Inventory"), sheetGet("Orders")])
      .then(([inv, ord]) => { setInventory(inv); setAllOrders(ord.filter(o => o.status === "Delivered" && o.branch === branch)); })
      .catch(() => {}).finally(() => setSyncing(false));
  }, [branch]);

  // Build stock for this branch: transfers in - deliveries
  const vendorMap = {};
  inventory.filter(i => i.branch === branch && i.type === "transfer-in").forEach(i => {
    const v = (i.vendor || "").trim(), n = (i.product || "").trim();
    if (!v || !n) return;
    if (!vendorMap[v]) vendorMap[v] = {};
    if (!vendorMap[v][n]) vendorMap[v][n] = { transferredIn: 0, delivered: 0 };
    vendorMap[v][n].transferredIn += Number(i.qty) || 0;
  });
  allOrders.forEach(o => {
    const prods = typeof o.products === "string" ? (() => { try { return JSON.parse(o.products); } catch { return []; } })() : (o.products || []);
    prods.forEach(p => {
      const v = (p.vendor || "").trim(), n = (p.name || "").trim();
      if (!v || !n || !vendorMap[v]?.[n]) return;
      vendorMap[v][n].delivered += Number(p.qty) || 1;
    });
  });

  const vendorList = Object.keys(vendorMap).filter(v =>
    !search || v.toLowerCase().includes(search.toLowerCase()) ||
    Object.keys(vendorMap[v]).some(p => p.toLowerCase().includes(search.toLowerCase()))
  ).sort();

  const TABS = [{ id: "stock", label: "Stock" }];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{GS}</style>
      <TopNav subtitle={`${branch} · Inventory (View Only)`} tabs={TABS} activeTab="stock" setActiveTab={() => {}} onLogout={onLogout} syncing={syncing} />
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "20px 16px" }}>
        <SectionTitle title={`${branch} Branch Stock`} sub="Read only — managed by IDIMU inventory admin" />
        <input className="k-input" placeholder="🔍 Search vendor or product..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: "16px" }} />
        {vendorList.length === 0 && <p style={{ textAlign: "center", padding: "48px 0", fontSize: "13px", color: "var(--text-faint)" }}>No stock transferred to {branch} yet</p>}
        {vendorList.map(vendor => {
          const products = Object.entries(vendorMap[vendor])
            .filter(([name]) => !search || vendor.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase()))
            .map(([name, s]) => ({ name, ...s, remaining: s.transferredIn - s.delivered }));
          return (
            <div key={vendor} style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--navy)", marginBottom: "8px", paddingLeft: "2px" }}>{vendor}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {products.map(item => (
                  <div key={item.name} style={{
                    background: item.remaining <= 0 ? "#fef2f2" : "#fff",
                    border: `1.5px solid ${item.remaining <= 0 ? "#fecaca" : "var(--border)"}`,
                    borderRadius: "var(--r-sm)", padding: "10px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                  }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: item.remaining <= 0 ? "var(--red)" : "var(--text)" }}>{item.name}</p>
                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                      {[["Transferred In", item.transferredIn, "var(--green)"], ["Delivered", item.delivered, "var(--blue)"]].map(([label, val, color]) => (
                        <div key={label} style={{ textAlign: "center", minWidth: "60px" }}>
                          <p style={{ fontSize: "8px", color: "var(--text-faint)", fontWeight: 600, marginBottom: "2px" }}>{label}</p>
                          <p style={{ fontFamily: "var(--display)", fontSize: "14px", fontWeight: 800, color }}>{val}</p>
                        </div>
                      ))}
                      <div style={{ textAlign: "center", background: item.remaining <= 0 ? "#fecaca" : "var(--blue-pale)", border: `1px solid ${item.remaining <= 0 ? "#fca5a5" : "var(--blue-pale2)"}`, borderRadius: "var(--r-sm)", padding: "6px 14px", minWidth: "64px" }}>
                        <p style={{ fontSize: "8px", fontWeight: 700, color: item.remaining <= 0 ? "var(--red)" : "var(--blue)", marginBottom: "2px" }}>Remaining</p>
                        <p style={{ fontFamily: "var(--display)", fontSize: "18px", fontWeight: 800, color: item.remaining <= 0 ? "var(--red)" : "var(--blue)", lineHeight: 1 }}>{item.remaining}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem("kyne_session");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  function handleLogin(role, branch) {
    const s = { role, branch };
    setSession(s);
    try { sessionStorage.setItem("kyne_session", JSON.stringify(s)); } catch {}
  }

  function handleLogout() {
    setSession(null);
    try { sessionStorage.removeItem("kyne_session"); } catch {}
  }

  if (!session) return <LoginScreen onLogin={handleLogin}/>;
  if (session.role === "boss")            return <BossView           onLogout={handleLogout}/>;
  if (session.role === "manager")         return <ManagerView        branch={session.branch} onLogout={handleLogout}/>;
  if (session.role === "rider-manager")   return <RiderManagerView   branch={session.branch} onLogout={handleLogout}/>;
  if (session.role === "inventory-admin") return <InventoryAdminView branch={session.branch} onLogout={handleLogout}/>;
  if (session.role === "inventory-view")  return <InventoryViewOnly  branch={session.branch} onLogout={handleLogout}/>;
}
