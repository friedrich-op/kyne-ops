// --- START OF ASSIGN TAB REWRITE ---
{activeTab === "assign" && (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <input
      type="text"
      placeholder="Search name, phone, or address..."
      value={phoneSearch}
      onChange={e => setPhoneSearch(e.target.value)}
      style={{
        width: "100%", padding: 12, borderRadius: 8,
        border: "1px solid #ddd", fontSize: 14, outline: "none"
      }}
    />

    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {(phoneSearch.trim() ? unassigned.filter(o => {
        const q = phoneSearch.trim().toLowerCase();
        // Safety: ensure every field is a string before searching
        const p = String(o?.phone || "").replace(/^'/, "").replace(/\s/g, "");
        const n = String(o?.customerName || "").toLowerCase();
        const a = String(o?.address || "").toLowerCase();
        return p.includes(q) || n.includes(q) || a.includes(a);
      }) : unassigned).map((o, idx) => {
        // Safety: Handle product data parsing carefully
        let prods = [];
        try {
          if (typeof o.products === 'string') {
            prods = JSON.parse(o.products || "[]");
          } else if (Array.isArray(o.products)) {
            prods = o.products;
          }
        } catch (e) {
          prods = []; // Fallback to empty list if JSON is broken
        }

        // Safety: Calculate total without crashing on missing prices
        const total = Array.isArray(prods) 
          ? prods.reduce((sum, p) => sum + (Number(p?.price) || 0), 0) 
          : 0;

        return (
          <div key={o.id || idx} className="card" style={{ padding: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: "var(--dark)" }}>{o.customerName || "No Name"}</p>
              <p style={{ fontSize: 13, color: "#666" }}>{o.address || "No Address"}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--blue)" }}>{String(o.phone || "").replace(/^'/, "")}</p>
            </div>

            <div style={{ background: "#f9f9f9", padding: 8, borderRadius: 6, marginBottom: 10 }}>
              {prods.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>{p.qty}x {p.name}</span>
                  <span>₦{(Number(p.price) || 0).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #eee", marginTop: 4, paddingTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>
                <span>Total:</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <select
                className="input-field"
                style={{ flex: 1, padding: "8px 4px" }}
                onChange={(e) => {
                  if (e.target.value) handleAssign(o.id, e.target.value);
                }}
                defaultValue=""
              >
                <option value="" disabled>Assign Rider...</option>
                {(RIDERS[branch] || []).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        );
      })}
      {unassigned.length === 0 && <p style={{ textAlign: "center", color: "#999", marginTop: 20 }}>No pending orders to assign.</p>}
    </div>
  </div>
)}
// --- END OF ASSIGN TAB REWRITE ---
