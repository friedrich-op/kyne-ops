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

// FULL UPDATED VENDOR CATALOG
const VENDOR_CATALOG = {
  "A-Z": ["A-Z Multi-vitamin"],
  "ALOE VERA": ["Aloe Vera gel"],
  "BMP Group": ["Lenstone Herbal", "M-Power", "Sea-Moss"],
  "CHARZZY GROUP": ["Gotura", "Latein capsule"],
  "DR MIKE": [
    "Sureza", "Hyperfom capsule", "Hyperfom tea", 
    "Fayamax capsule", "Fayamax tea", "Fayamax oil"
  ],
  "DSP": [
    "Snore Spray", "Mask", "Nylon", "Batana oil", 
    "Batana Cream", "Front Hair & scalp", "Eelhoe vitamin c"
  ],
  "EDDY": ["Soursoup", "Sealant spray", "Mosquito swatter", "Aloe vera gel"],
  "HEALTH & BEAUTY": ["Glow Serum", "Face Cream", "Body Lotion"],
  "KENDUMA": ["Pet collar"],
  "KIDS MULTIVITAMIN": ["Kids multivitamin gummies"],
  "KYNE-RANDOM": ["Random energy capsule"],
  "KYNE LENSTONE": ["Lenstone capsule"],
  "LADEX": [
    "Handheld Fan", "Rechargeable Fan", "Mini Juicer", "Portable Blender",
    "Smart Watch", "Bluetooth Speaker", "Wireless Earbuds"
  ],
  "LOPGRADE": ["Yoxier scar repair cream"],
  "Madam gift": [
    "Building block", "Magnetic drawing board", "Finger Arithmetic", 
    "Bubble gun", "Charrzy capsule"
  ],
  "MEN GUMMIES": ["Men power gummies"],
  "PAVENA": [
    "Retinol Serum", "Retinol Cream", "Vitamin C Soap", "Salicylic Soap", 
    "Niacinamide Soap", "Vibrant Suncreen", "Estlein Sunscreen", 
    "Retinol Eye cream", "Cayman Eye cream", "Collagen Eye Mask", "Retinol Mask"
  ],
  "SMART CLEANSER KYNE": ["Smart Cleanser", "Sanora capsule", "Sanora balm"],
  "TOPMO": ["Power Bank 10k", "Power Bank 20k", "Fast Charger", "USB-C Cable"],
  "ZEGOODIES": [
    "Big solar lamp", "Small solar lamp", "Green flat tummy gummies", 
    "Red flat tummy gummies", "Apple Cider gummies", "Keto Active gummies"
  ],
  "ZEMA": ["Orange exfoliating gel"]
};

const VENDORS = Object.keys(VENDOR_CATALOG).sort();

const TODAY = (() => {
  const d = new Date();
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})();

const API_URL = "https://script.google.com/macros/s/AKfycbx0n97CWtI-uRQ_k58uuN2c8TBCd8xl37z-sxtcDz2agi0IzfI2-r7k9dpg6NP7KDYL/exec";

// ─── UTILS ───────────────────────────────────────────────────────────────────
function parseSheetRows(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = r[i];
      if (typeof val === "number" && val > 40000 && val < 60000) {
        val = new Date((val - 25569) * 86400 * 1000).toISOString().split("T")[0];
      }
      if (h === "products" && typeof val === "string" && val.startsWith("[")) {
        try { val = JSON.parse(val); } catch { val = []; }
      }
      obj[h] = val;
    });
    return obj;
  });
}

function buildBossStockMap(allInv) {
  const map = {};
  allInv.forEach((tx) => {
    const q = Number(tx.qty) || 0;
    const type = (tx.type || "").toUpperCase();
    const vendor = tx.vendor || "UNKNOWN";
    const product = tx.product || "UNKNOWN";

    const addStock = (branch, amount) => {
      if (!branch) return;
      const key = `${branch}|${vendor}|${product}`;
      map[key] = (map[key] || 0) + amount;
    };

    if (type === "WAYBILL IN") {
      addStock(tx.branch, q);
    } else if (type === "WAYBILL OUT") {
      addStock(tx.branch, -q);
    } else if (type === "BRANCH TRANSFER") {
      addStock(tx.fromBranch, -q);
      addStock(tx.toBranch, q);
    } else if (type === "DELIVERED") {
      addStock(tx.branch, -q);
    } else if (type === "RESTOCK") {
      addStock(tx.branch, q);
    }
  });
  return map;
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
  :root {
    --navy: #0f172a;
    --blue: #2563eb;
    --bg: #f8fafc;
    --border: #e2e8f0;
    --text: #1e293b;
    --text-muted: #64748b;
    --green: #10b981;
    --red: #ef4444;
  }
  body { margin: 0; font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); -webkit-tap-highlight-color: transparent; }
  * { box-sizing: border-box; }
  .card { background: #fff; border-radius: 12px; padding: 16px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .input { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 16px; outline: none; }
  .btn { padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 15px; transition: 0.2s; }
  .grid { display: grid; gap: 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: var(--blue); border-radius: 50%; animation: spin 1s linear infinite; }
`;

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function TopNav({ title, onLogout, syncing, onRefresh }) {
  return (
    <div style={{ background: "var(--navy)", color: "#fff", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>KYNE PORTAL</h1>
        <p style={{ margin: 0, fontSize: "11px", opacity: 0.7 }}>{title}</p>
      </div>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {syncing && <span style={{ fontSize: "10px", color: "var(--green)", fontWeight: "700" }}>SYNCING...</span>}
        {onRefresh && <button onClick={onRefresh} style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" }}>↻</button>}
        <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px" }}>LOGOUT</button>
      </div>
    </div>
  );
}

function LoadingScreen({ message = "Syncing..." }) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ width: "40px", height: "40px" }} />
      <p style={{ marginTop: "16px", color: "var(--text-muted)" }}>{message}</p>
    </div>
  );
}

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const CREDENTIALS = [
    { u: "kyne@boss2025", p: "kyne@boss2025", r: "boss", b: "ALL" },
    { u: "idimumanager@2024", p: "idimumanager@2024", r: "manager", b: "IDIMU" },
    { u: "idimurider@2024", p: "idimurider@2024", r: "rider-manager", b: "IDIMU" },
    { u: "idimuinv@2024", p: "idimuinv@2024", r: "inventory-admin", b: "IDIMU" },
    { u: "idimustock@2024", p: "idimustock@2024", r: "inventory-view", b: "IDIMU" },
    { u: "ketumanager@2024", p: "ketumanager@2024", r: "manager", b: "KETU" },
    { u: "keturider@2024", p: "keturider@2024", r: "rider-manager", b: "KETU" },
    { u: "ketustock@2024", p: "ketustock@2024", r: "inventory-view", b: "KETU" },
    { u: "ajamanager@2024", p: "ajamanager@2024", r: "manager", b: "AJA" },
    { u: "ajarider@2024", p: "ajarider@2024", r: "rider-manager", b: "AJA" },
    { u: "ajastock@2024", p: "ajastock@2024", r: "inventory-view", b: "AJA" },
  ];

  const handle = (e) => {
    e.preventDefault();
    const found = CREDENTIALS.find(c => c.u === u && c.p === p);
    if (found) onLogin(found.r, found.b);
    else setErr("Invalid login");
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--navy)" }}>
      <form onSubmit={handle} className="card" style={{ width: "90%", maxWidth: "340px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>KYNE LOGISTICS</h2>
        <input className="input" style={{ marginBottom: "12px" }} placeholder="Username" value={u} onChange={e => setU(e.target.value)} />
        <input className="input" style={{ marginBottom: "20px" }} placeholder="Password" type="password" value={p} onChange={e => setP(e.target.value)} />
        {err && <p style={{ color: "var(--red)", textAlign: "center", fontSize: "12px" }}>{err}</p>}
        <button className="btn" style={{ background: "var(--blue)", color: "#fff", width: "100%" }}>ENTER PORTAL</button>
      </form>
    </div>
  );
}

// ─── MANAGER VIEW (LOG ORDERS) ───────────────────────────────────────────────
function ManagerView({ branch, onLogout }) {
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ customerName: "", phone: "", address: "", vendor: "", products: [], totalPrice: "" });

  const toggle = (p) => {
    setForm(f => ({ ...f, products: f.products.includes(p) ? f.products.filter(x => x !== p) : [...f.products, p] }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.vendor || form.products.length === 0) return alert("Select products");
    setSyncing(true);
    try {
      const payload = { action: "logOrder", branch, ...form, products: JSON.stringify(form.products), date: "'" + TODAY };
      await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
      setForm({ customerName: "", phone: "", address: "", vendor: "", products: [], totalPrice: "" });
      alert("Success");
    } catch { alert("Failed"); }
    setSyncing(false);
  };

  return (
    <div>
      <TopNav title={`${branch} Manager`} onLogout={onLogout} syncing={syncing} />
      <div style={{ padding: "16px", maxWidth: "500px", margin: "0 auto" }}>
        <form onSubmit={submit} className="card grid">
          <h3>Log Daily Order</h3>
          <input className="input" placeholder="Customer Name" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} required />
          <input className="input" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          <input className="input" placeholder="Delivery Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
          <select className="input" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value, products: [] })} required>
            <option value="">Select Vendor</option>
            {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          {form.vendor && (
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {VENDOR_CATALOG[form.vendor].map(p => (
                <button type="button" key={p} onClick={() => toggle(p)} style={{ padding: "8px", borderRadius: "6px", fontSize: "11px", border: "1px solid #cbd5e1", background: form.products.includes(p) ? "var(--blue)" : "#fff", color: form.products.includes(p) ? "#fff" : "var(--text)" }}>{p}</button>
              ))}
            </div>
          )}
          <input className="input" type="number" placeholder="Total Price" value={form.totalPrice} onChange={e => setForm({ ...form, totalPrice: e.target.value })} required />
          <button className="btn" style={{ background: "var(--blue)", color: "#fff" }} disabled={syncing}>LOG ORDER</button>
        </form>
      </div>
    </div>
  );
}

// ─── RIDER MANAGER VIEW ──────────────────────────────────────────────────────
function RiderManagerView({ branch, onLogout }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?branch=${branch}`);
      const json = await res.json();
      setData(parseSheetRows(json.orders));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = async (id, rider, status) => {
    setSyncing(true);
    try {
      const order = data.find(o => o.id === id);
      const payload = { action: "updateRiderStatus", id, rider, status, branch, date: "'" + TODAY, vendor: order.vendor, products: JSON.stringify(order.products) };
      await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
      await load();
    } catch { alert("Failed"); }
    setSyncing(false);
  };

  if (loading) return <LoadingScreen />;

  const pending = data.filter(o => o.status === "LOGGED");
  const out = data.filter(o => o.status === "ASSIGNED");

  return (
    <div>
      <TopNav title={`${branch} Logistics`} onLogout={onLogout} syncing={syncing} onRefresh={load} />
      <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
        <h3 style={{ marginBottom: "12px" }}>Incoming ({pending.length})</h3>
        <div className="grid" style={{ marginBottom: "32px" }}>
          {pending.map(o => (
            <div key={o.id} className="card grid">
              <div>
                <p style={{ fontWeight: "700", margin: "0" }}>{o.customerName}</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0" }}>{o.address}</p>
                <p style={{ fontSize: "11px", color: "var(--blue)" }}>{o.vendor}: {Array.isArray(o.products) ? o.products.join(", ") : o.products}</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <select id={`r-${o.id}`} className="input" style={{ padding: "8px" }}>
                  <option value="">Rider...</option>
                  {RIDERS[branch].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button className="btn" style={{ background: "var(--navy)", color: "#fff", padding: "8px" }} onClick={() => {
                  const r = document.getElementById(`r-${o.id}`).value;
                  if (r) update(o.id, r, "ASSIGNED");
                }}>GO</button>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ marginBottom: "12px" }}>Out for Delivery ({out.length})</h3>
        <div className="grid">
          {out.map(o => (
            <div key={o.id} className="card grid">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: "700", margin: 0 }}>{o.customerName} <span style={{ fontWeight: 400, fontSize: 12 }}>({o.rider})</span></p>
                  <p style={{ fontSize: 12 }}>{o.address}</p>
                </div>
                <a href={`tel:${o.phone}`} style={{ textDecoration: "none", fontSize: 20 }}>📞</a>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn" style={{ flex: 1, background: "var(--green)", color: "#fff", padding: "8px" }} onClick={() => update(o.id, o.rider, "DELIVERED")}>DONE</button>
                <button className="btn" style={{ flex: 1, background: "var(--red)", color: "#fff", padding: "8px" }} onClick={() => update(o.id, o.rider, "FAILED")}>FAIL</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── INVENTORY ADMIN VIEW ────────────────────────────────────────────────────
function InventoryAdminView({ branch, onLogout }) {
  const [inv, setInv] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ type: "WAYBILL IN", vendor: "", product: "", qty: "", note: "", toBranch: "" });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?branch=ALL`);
      const json = await res.json();
      setInv(parseSheetRows(json.inventory));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const payload = { action: "logInventory", branch, ...form, date: "'" + TODAY };
      await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
      setForm({ ...form, qty: "", note: "" });
      await load();
    } catch { alert("Failed"); }
    setSyncing(false);
  };

  if (loading) return <LoadingScreen />;
  const stockMap = buildBossStockMap(inv);

  return (
    <div>
      <TopNav title="Inventory Central" onLogout={onLogout} syncing={syncing} onRefresh={load} />
      <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
        <form onSubmit={submit} className="card grid" style={{ marginBottom: "24px" }}>
          <h3>Movement Log</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="WAYBILL IN">WAYBILL IN</option>
              <option value="WAYBILL OUT">WAYBILL OUT</option>
              <option value="BRANCH TRANSFER">TRANSFER</option>
              <option value="RESTOCK">RESTOCK</option>
            </select>
            <select className="input" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value, product: "" })}>
              <option value="">Vendor...</option>
              {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          {form.vendor && (
            <select className="input" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}>
              <option value="">Product...</option>
              {VENDOR_CATALOG[form.vendor].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          {form.type === "BRANCH TRANSFER" && (
            <select className="input" value={form.toBranch} onChange={e => setForm({ ...form, toBranch: e.target.value })}>
              <option value="">To Branch...</option>
              {BRANCHES.filter(b => b !== branch).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          <input className="input" type="number" placeholder="Quantity" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} required />
          <button className="btn" style={{ background: "var(--blue)", color: "#fff" }}>LOG STOCK</button>
        </form>

        {BRANCHES.map(b => (
          <div key={b} className="card" style={{ marginBottom: "16px" }}>
            <h4 style={{ borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>{b} STOCK</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {Object.entries(stockMap).filter(([k]) => k.startsWith(b)).map(([k, q]) => (
                <div key={k} style={{ fontSize: "12px", display: "flex", justifyContent: "space-between", background: "var(--bg)", padding: "6px", borderRadius: "4px" }}>
                  <span>{k.split("|")[2]}</span>
                  <span style={{ fontWeight: 700, color: q < 5 ? "var(--red)" : "inherit" }}>{q}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── INVENTORY VIEW ONLY ─────────────────────────────────────────────────────
function InventoryViewOnly({ branch, onLogout }) {
  const [inv, setInv] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?branch=ALL`);
      const json = await res.json();
      setInv(parseSheetRows(json.inventory));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  if (loading) return <LoadingScreen />;
  const stockMap = buildBossStockMap(inv);

  return (
    <div>
      <TopNav title={`${branch} Inventory`} onLogout={onLogout} onRefresh={load} />
      <div style={{ padding: "16px", maxWidth: "500px", margin: "0 auto" }}>
        <div className="card">
          <h3 style={{ marginBottom: "16px", textAlign: "center" }}>Stock Levels</h3>
          {Object.entries(stockMap).filter(([k]) => k.startsWith(branch)).map(([k, q]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{k.split("|")[2]}</span>
              <span style={{ fontWeight: 800 }}>{q}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BOSS VIEW ───────────────────────────────────────────────────────────────
function BossView({ onLogout }) {
  const [data, setData] = useState({ orders: [], inv: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("FIN");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?branch=ALL`);
      const json = await res.json();
      setData({ orders: parseSheetRows(json.orders), inv: parseSheetRows(json.inventory) });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingScreen />;

  const stock = buildBossStockMap(data.inv);
  const del = data.orders.filter(o => o.status === "DELIVERED");
  const rev = del.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);

  return (
    <div>
      <TopNav title="Executive Overview" onLogout={onLogout} onRefresh={load} />
      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setTab("FIN")} style={{ flex: 1, padding: "14px", border: "none", background: "none", fontWeight: 700, color: tab === "FIN" ? "var(--blue)" : "#94a3b8", borderBottom: tab === "FIN" ? "3px solid var(--blue)" : "none" }}>FINANCE</button>
        <button onClick={() => setTab("STK")} style={{ flex: 1, padding: "14px", border: "none", background: "none", fontWeight: 700, color: tab === "STK" ? "var(--blue)" : "#94a3b8", borderBottom: tab === "STK" ? "3px solid var(--blue)" : "none" }}>STOCK</button>
      </div>

      <div style={{ padding: "16px" }}>
        {tab === "FIN" ? (
          <div className="grid" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="card" style={{ borderLeft: "5px solid var(--green)" }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>GROSS REVENUE</p>
              <h2 style={{ margin: 0 }}>₦{rev.toLocaleString()}</h2>
            </div>
            {BRANCHES.map(b => {
              const bOrders = del.filter(o => o.branch === b);
              const bRev = bOrders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);
              return (
                <div key={b} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800 }}>{b}</span>
                  <span style={{ color: "var(--green)", fontWeight: 700 }}>₦{bRev.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid" style={{ maxWidth: "800px", margin: "0 auto" }}>
            {BRANCHES.map(b => (
              <div key={b} className="card">
                <h4 style={{ margin: "0 0 12px 0" }}>{b} BRANCH</h4>
                <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  {Object.entries(stock).filter(([k]) => k.startsWith(b)).map(([k, q]) => (
                    <div key={k} style={{ fontSize: 12, padding: "8px", background: "var(--bg)", borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
                      <span>{k.split("|")[2]}</span>
                      <b>{q}</b>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem("kyne_session");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (role, branch) => {
    const s = { role, branch };
    setSession(s);
    sessionStorage.setItem("kyne_session", JSON.stringify(s));
  };

  const logout = () => {
    setSession(null);
    sessionStorage.removeItem("kyne_session");
  };

  return (
    <>
      <style>{STYLES}</style>
      {!session ? <LoginScreen onLogin={login} /> : (
        <>
          {session.role === "boss" && <BossView onLogout={logout} />}
          {session.role === "manager" && <ManagerView branch={session.branch} onLogout={logout} />}
          {session.role === "rider-manager" && <RiderManagerView branch={session.branch} onLogout={logout} />}
          {session.role === "inventory-admin" && <InventoryAdminView branch={session.branch} onLogout={logout} />}
          {session.role === "inventory-view" && <InventoryViewOnly branch={session.branch} onLogout={logout} />}
        </>
      )}
    </>
  );
}
