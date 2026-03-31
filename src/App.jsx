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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})();

const API_URL = "https://script.google.com/macros/s/AKfycbx0n97CWtI-uRQ_k58uuN2c8TBCd8xl37z-sxtcDz2agi0IzfI2-r7k9dpg6NP7KDYL/exec";

// ─── STYLES ──────────────────────────────────────────────────────────────────
const GS = {
  colors: {
    bg: "#f8fafc",
    card: "#ffffff",
    navy: "#0f172a",
    blue: "#2563eb",
    blueLight: "#eff6ff",
    border: "#e2e8f0",
    text: "#1e293b",
    textMuted: "#64748b",
    green: "#10b981",
    red: "#ef4444",
    gold: "#f59e0b",
  },
  shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "16px",
    background: "#fff",
  },
  btn: {
    padding: "12px 24px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
    fontSize: "15px",
    transition: "all 0.2s",
  },
};

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
    const key = `${tx.branch}|${tx.vendor}|${tx.product}`;
    if (!map[key]) map[key] = 0;
    const q = Number(tx.qty) || 0;
    if (tx.type === "WAYBILL IN") map[key] += q;
    else if (tx.type === "WAYBILL OUT") map[key] -= q;
    else if (tx.type === "BRANCH TRANSFER") {
      if (tx.fromBranch) {
        const kFrom = `${tx.fromBranch}|${tx.vendor}|${tx.product}`;
        map[kFrom] = (map[kFrom] || 0) - q;
      }
      if (tx.toBranch) {
        const kTo = `${tx.toBranch}|${tx.vendor}|${tx.product}`;
        map[kTo] = (map[kTo] || 0) + q;
      }
    }
    else if (tx.type === "DELIVERED") map[key] -= q;
    else if (tx.type === "RESTOCK") map[key] += q;
  });
  return map;
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────
function TopNav({ title, onLogout, syncing, onRefresh }) {
  return (
    <div style={{
      background: GS.colors.navy, color: "#fff", padding: "16px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      position: "sticky", top: 0, zIndex: 100
    }}>
      <div>
        <h1 style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px" }}>KYNE PORTAL</h1>
        <p style={{ fontSize: "11px", opacity: 0.7, textTransform: "uppercase" }}>{title}</p>
      </div>
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {syncing && <span style={{ fontSize: "10px", color: GS.colors.green, fontWeight: "700" }}>SYNCING...</span>}
        {onRefresh && (
          <button onClick={onRefresh} style={{
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
            width: "32px", height: "32px", borderRadius: "50%", display: "flex", 
            alignItems: "center", justifyContent: "center"
          }}>↻</button>
        )}
        <button onClick={onLogout} style={{
          background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
          padding: "6px 12px", borderRadius: "6px", fontSize: "12px"
        }}>LOGOUT</button>
      </div>
    </div>
  );
}

function LoadingScreen({ message = "Loading data..." }) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: GS.colors.bg }}>
      <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid #e2e8f0", borderTopColor: GS.colors.blue, borderRadius: "50%" }} />
      <p style={{ marginTop: "16px", color: GS.colors.textMuted, fontWeight: "500" }}>{message}</p>
      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
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

  const handleLogin = (e) => {
    e.preventDefault();
    const found = CREDENTIALS.find((c) => c.u === user && c.p === pass);
    if (found) onLogin(found.r, found.b);
    else setErr("Invalid credentials");
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: GS.colors.navy }}>
      <form onSubmit={handleLogin} style={{ ...GS.card, width: "90%", maxWidth: "360px", padding: "32px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "24px", color: GS.colors.navy, fontWeight: "800" }}>KYNE PORTAL</h2>
        <input style={{ ...GS.input, marginBottom: "16px" }} placeholder="Username" value={user} onChange={(e) => setUser(e.target.value)} />
        <input style={{ ...GS.input, marginBottom: "24px" }} placeholder="Password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        {err && <p style={{ color: GS.colors.red, fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>{err}</p>}
        <button type="submit" style={{ ...GS.btn, background: GS.colors.blue, color: "#fff", width: "100%" }}>LOG IN</button>
      </form>
    </div>
  );
}

// ─── MANAGER VIEW (LOG ORDERS) ───────────────────────────────────────────────
function ManagerView({ branch, onLogout }) {
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "", phone: "", address: "", vendor: "", products: [], totalPrice: ""
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.vendor || formData.products.length === 0) return alert("Select vendor and products");
    setSyncing(true);
    try {
      const payload = {
        action: "logOrder",
        branch,
        ...formData,
        products: JSON.stringify(formData.products),
        date: "'" + TODAY, // Ensure Sheets treats as string
      };
      await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
      setFormData({ customerName: "", phone: "", address: "", vendor: "", products: [], totalPrice: "" });
      alert("Order logged successfully");
    } catch (err) { alert("Error logging order"); }
    setSyncing(false);
  }

  const toggleProduct = (p) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(p) ? prev.products.filter(x => x !== p) : [...prev.products, p]
    }));
  };

  return (
    <div style={{ background: GS.colors.bg, minHeight: "100vh" }}>
      <TopNav title={`${branch} Manager`} onLogout={onLogout} syncing={syncing} />
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <form onSubmit={handleSubmit} style={GS.card}>
          <h3 style={{ marginBottom: "20px" }}>Log New Order</h3>
          <div style={{ display: "grid", gap: "16px" }}>
            <input style={GS.input} placeholder="Customer Name" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
            <input style={GS.input} placeholder="Phone (e.g. 080...)" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
            <input style={GS.input} placeholder="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
            <select style={GS.input} value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value, products: [] })} required>
              <option value="">Select Vendor</option>
              {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            {formData.vendor && (
              <div style={{ border: `1px solid ${GS.colors.border}`, borderRadius: "8px", padding: "12px", background: GS.colors.blueLight }}>
                <p style={{ fontSize: "12px", fontWeight: "700", marginBottom: "8px" }}>SELECT PRODUCTS:</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {VENDOR_CATALOG[formData.vendor].map(p => (
                    <button type="button" key={p} onClick={() => toggleProduct(p)} style={{
                      padding: "6px 12px", borderRadius: "20px", fontSize: "12px", border: "1px solid #cbd5e1",
                      background: formData.products.includes(p) ? GS.colors.blue : "#fff",
                      color: formData.products.includes(p) ? "#fff" : GS.colors.text
                    }}>{p}</button>
                  ))}
                </div>
              </div>
            )}

            <input style={GS.input} placeholder="Total Price (₦)" type="number" value={formData.totalPrice} onChange={e => setFormData({ ...formData, totalPrice: e.target.value })} required />
            <button type="submit" disabled={syncing} style={{ ...GS.btn, background: GS.colors.blue, color: "#fff" }}>
              {syncing ? "LOGGING..." : "LOG ORDER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── RIDER MANAGER VIEW ──────────────────────────────────────────────────────
function RiderManagerView({ branch, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?branch=${branch}`);
      const data = await res.json();
      setOrders(parseSheetRows(data.orders));
      setInventory(parseSheetRows(data.inventory));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id, rider, status) {
    setSyncing(true);
    const order = orders.find(o => o.id === id);
    try {
      const payload = { 
        action: "updateRiderStatus", id, rider, status, 
        branch, date: "'" + TODAY,
        products: JSON.stringify(order.products),
        vendor: order.vendor
      };
      await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
      await load();
    } catch (e) { alert("Update failed"); }
    setSyncing(false);
  }

  if (loading) return <LoadingScreen />;

  const pending = orders.filter(o => o.status === "LOGGED");
  const assigned = orders.filter(o => o.status === "ASSIGNED");

  return (
    <div style={{ background: GS.colors.bg, minHeight: "100vh" }}>
      <TopNav title={`${branch} Logistics`} onLogout={onLogout} syncing={syncing} onRefresh={load} />
      <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
        
        {/* PENDING ORDERS */}
        <section style={{ marginBottom: "32px" }}>
          <h3 style={{ marginBottom: "12px", color: GS.colors.navy }}>Pending Logistics ({pending.length})</h3>
          {pending.length === 0 ? <p style={{ color: GS.colors.textMuted }}>No new orders.</p> : (
            <div style={{ display: "grid", gap: "12px" }}>
              {pending.map(o => (
                <div key={o.id} style={GS.card}>
                  <div style={{ marginBottom: "12px" }}>
                    <p style={{ fontWeight: "800", fontSize: "16px" }}>{o.customerName}</p>
                    <p style={{ fontSize: "13px", color: GS.colors.blue, fontWeight: "600" }}>{o.phone}</p>
                    <p style={{ fontSize: "13px" }}>{o.address}</p>
                    <div style={{ marginTop: "8px", fontSize: "12px", color: GS.colors.textMuted }}>
                      {o.vendor}: {Array.isArray(o.products) ? o.products.join(", ") : o.products}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <select id={`rider-${o.id}`} style={{ ...GS.input, padding: "8px" }}>
                      <option value="">Select Rider</option>
                      {RIDERS[branch].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button onClick={() => {
                      const r = document.getElementById(`rider-${o.id}`).value;
                      if (r) updateStatus(o.id, r, "ASSIGNED");
                    }} style={{ ...GS.btn, background: GS.colors.navy, color: "#fff", padding: "8px 16px" }}>ASSIGN</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ASSIGNED ORDERS */}
        <section>
          <h3 style={{ marginBottom: "12px", color: GS.colors.navy }}>Currently Out ({assigned.length})</h3>
          <div style={{ display: "grid", gap: "12px" }}>
            {assigned.map(o => (
              <div key={o.id} style={GS.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontWeight: "700" }}>{o.customerName} <span style={{ fontWeight: "400", color: GS.colors.textMuted }}>({o.rider})</span></p>
                    <p style={{ fontSize: "13px" }}>{o.address}</p>
                  </div>
                  <a href={`tel:${o.phone}`} style={{ textDecoration: "none", background: GS.colors.blueLight, padding: "8px", borderRadius: "50%" }}>📞</a>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button onClick={() => updateStatus(o.id, o.rider, "DELIVERED")} style={{ ...GS.btn, flex: 1, background: GS.colors.green, color: "#fff", padding: "8px" }}>DELIVERED</button>
                  <button onClick={() => updateStatus(o.id, o.rider, "FAILED")} style={{ ...GS.btn, flex: 1, background: GS.colors.red, color: "#fff", padding: "8px" }}>FAILED</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── INVENTORY ADMIN VIEW (IDIMU) ─────────────────────────────────────────────
function InventoryAdminView({ branch, onLogout }) {
  const [data, setData] = useState([]);
  const [allInv, setAllInv] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ type: "WAYBILL IN", vendor: "", product: "", qty: "", note: "", toBranch: "" });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?branch=ALL`);
      const json = await res.json();
      setAllInv(parseSheetRows(json.inventory));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setSyncing(true);
    try {
      const payload = { action: "logInventory", branch, ...form, date: "'" + TODAY };
      await fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
      setForm({ ...form, qty: "", note: "" });
      await load();
    } catch (e) { alert("Error logging inventory"); }
    setSyncing(false);
  }

  if (loading) return <LoadingScreen />;

  const stockMap = buildBossStockMap(allInv);

  return (
    <div style={{ background: GS.colors.bg, minHeight: "100vh" }}>
      <TopNav title="Inventory Central" onLogout={onLogout} syncing={syncing} onRefresh={load} />
      <div style={{ padding: "16px", maxWidth: "900px", margin: "0 auto" }}>
        
        <form onSubmit={handleAdd} style={{ ...GS.card, marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "16px" }}>Log Stock Movement</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
            <select style={GS.input} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="WAYBILL IN">WAYBILL IN</option>
              <option value="WAYBILL OUT">WAYBILL OUT</option>
              <option value="BRANCH TRANSFER">BRANCH TRANSFER</option>
              <option value="RESTOCK">RESTOCK</option>
            </select>
            <select style={GS.input} value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value, product: ""})}>
              <option value="">Select Vendor</option>
              {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            {form.vendor && (
              <select style={GS.input} value={form.product} onChange={e => setForm({...form, product: e.target.value})}>
                <option value="">Select Product</option>
                {VENDOR_CATALOG[form.vendor].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            {form.type === "BRANCH TRANSFER" && (
              <select style={GS.input} value={form.toBranch} onChange={e => setForm({...form, toBranch: e.target.value})}>
                <option value="">To Branch...</option>
                {BRANCHES.filter(b => b !== "IDIMU").map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            <input style={GS.input} type="number" placeholder="Qty" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} required />
          </div>
          <button type="submit" style={{ ...GS.btn, background: GS.colors.blue, color: "#fff", width: "100%", marginTop: "16px" }}>SUBMIT MOVEMENT</button>
        </form>

        <div style={{ display: "grid", gap: "20px" }}>
          {BRANCHES.map(b => (
            <div key={b} style={GS.card}>
              <h4 style={{ color: GS.colors.blue, borderBottom: `2px solid ${GS.colors.blueLight}`, paddingBottom: "8px", marginBottom: "12px" }}>{b} STOCK LEVELS</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                {Object.entries(stockMap)
                  .filter(([k]) => k.startsWith(b))
                  .map(([k, qty]) => {
                    const [,,prod] = k.split("|");
                    return (
                      <div key={k} style={{ padding: "8px", background: GS.colors.bg, borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "13px" }}>{prod}</span>
                        <span style={{ fontWeight: "700", color: qty < 5 ? GS.colors.red : GS.colors.navy }}>{qty}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── INVENTORY VIEW ONLY (OTHER BRANCHES) ────────────────────────────────────
function InventoryViewOnly({ branch, onLogout }) {
  const [allInv, setAllInv] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?branch=ALL`);
      const json = await res.json();
      setAllInv(parseSheetRows(json.inventory));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingScreen />;

  const stockMap = buildBossStockMap(allInv);

  return (
    <div style={{ background: GS.colors.bg, minHeight: "100vh" }}>
      <TopNav title={`${branch} Inventory`} onLogout={onLogout} onRefresh={load} />
      <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={GS.card}>
          <h3 style={{ marginBottom: "16px", textAlign: "center" }}>Current Available Stock</h3>
          <div style={{ display: "grid", gap: "8px" }}>
            {Object.entries(stockMap)
              .filter(([k]) => k.startsWith(branch))
              .map(([k, qty]) => {
                const [,,prod] = k.split("|");
                return (
                  <div key={k} style={{ padding: "12px", borderBottom: `1px solid ${GS.colors.border}`, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: "500" }}>{prod}</span>
                    <span style={{ fontWeight: "800", color: qty <= 0 ? GS.colors.red : GS.colors.navy }}>{qty}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BOSS VIEW ───────────────────────────────────────────────────────────────
function BossView({ onLogout }) {
  const [data, setData] = useState({ orders: [], inventory: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState("FINANCE"); // FINANCE or STOCK

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?branch=ALL`);
      const json = await res.json();
      setData({ orders: parseSheetRows(json.orders), inventory: parseSheetRows(json.inventory) });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const stockMap = buildBossStockMap(data.inventory);

  // Stats Logic
  const totalRev = data.orders.filter(o => o.status === "DELIVERED").reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const deliveredOrders = data.orders.filter(o => o.status === "DELIVERED");

  return (
    <div style={{ background: GS.colors.bg, minHeight: "100vh" }}>
      <TopNav title="Executive Overview" onLogout={onLogout} syncing={syncing} onRefresh={load} />
      
      {/* BOSS TABS */}
      <div style={{ display: "flex", background: "#fff", borderBottom: `1px solid ${GS.colors.border}` }}>
        <button onClick={() => setView("FINANCE")} style={{ flex: 1, padding: "14px", border: "none", background: "none", fontWeight: "700", color: view === "FINANCE" ? GS.colors.blue : GS.colors.textMuted, borderBottom: view === "FINANCE" ? `3px solid ${GS.colors.blue}` : "none" }}>FINANCE</button>
        <button onClick={() => setView("STOCK")} style={{ flex: 1, padding: "14px", border: "none", background: "none", fontWeight: "700", color: view === "STOCK" ? GS.colors.blue : GS.colors.textMuted, borderBottom: view === "STOCK" ? `3px solid ${GS.colors.blue}` : "none" }}>STOCK</button>
      </div>

      <div style={{ padding: "16px" }}>
        {view === "FINANCE" ? (
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
              <div style={{ ...GS.card, borderLeft: `4px solid ${GS.colors.green}` }}>
                <p style={{ fontSize: "12px", color: GS.colors.textMuted }}>TOTAL REVENUE</p>
                <h2 style={{ color: GS.colors.navy }}>₦{totalRev.toLocaleString()}</h2>
              </div>
              <div style={{ ...GS.card, borderLeft: `4px solid ${GS.colors.blue}` }}>
                <p style={{ fontSize: "12px", color: GS.colors.textMuted }}>DELIVERED ORDERS</p>
                <h2 style={{ color: GS.colors.navy }}>{deliveredOrders.length}</h2>
              </div>
            </div>

            {/* BRANCH PERFORMANCE */}
            {BRANCHES.map(b => {
              const bOrders = deliveredOrders.filter(o => o.branch === b);
              const bRev = bOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
              return (
                <div key={b} style={{ ...GS.card, marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h4 style={{ fontWeight: "800" }}>{b} BRANCH</h4>
                    <span style={{ fontWeight: "700", color: GS.colors.green }}>₦{bRev.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: GS.colors.textMuted }}>
                    {bOrders.length} orders completed.
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ maxWidth: "800px", margin: "0 auto", display: "grid", gap: "16px" }}>
            {BRANCHES.map(b => (
              <div key={b} style={GS.card}>
                <h3 style={{ marginBottom: "12px", borderBottom: `1px solid ${GS.colors.border}`, paddingBottom: "8px" }}>{b} Stock</h3>
                <div style={{ display: "grid", gap: "8px" }}>
                  {Object.entries(stockMap).filter(([k]) => k.startsWith(b)).map(([k, qty]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                      <span>{k.split("|")[2]}</span>
                      <span style={{ fontWeight: "700" }}>{qty}</span>
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

  switch (session.role) {
    case "boss": return <BossView onLogout={handleLogout}/>;
    case "manager": return <ManagerView branch={session.branch} onLogout={handleLogout}/>;
    case "rider-manager": return <RiderManagerView branch={session.branch} onLogout={handleLogout}/>;
    case "inventory-admin": return <InventoryAdminView branch={session.branch} onLogout={handleLogout}/>;
    case "inventory-view": return <InventoryViewOnly branch={session.branch} onLogout={handleLogout}/>;
    default: return <LoginScreen onLogin={handleLogin}/>;
  }
}
