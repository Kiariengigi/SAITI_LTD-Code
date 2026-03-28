// pages/DashboardPage.tsx
import DonutChart   from "./Docutchart"
import MiniBarChart from "./MiniBarChart";

const SCHEDULE_ITEMS = [
  { label: "In Stock",     count: 42, status: "green"  },
  { label: "In Delivery",  count: 18, status: "yellow" },
  { label: "Out of Stock", count: 7,  status: "red"    },
  { label: "Monthly",      count: 24, status: "gray"   },
];

const statusColor: Record<string, string> = {
  green:  "#22C55E",
  yellow: "#F5C800",
  red:    "#EF4444",
  gray:   "#999",
};

export default function DashboardPage() {
  return (
    <div className="p-3 d-flex flex-column gap-3" style={{ minHeight: 0, overflowY: "auto" }}>

      {/* ── Row 1: Stat cards ── */}
      <div className="row g-2">
        {[
          { label: "Orders",          value: "100",  delta: null },
          { label: "Stock Value",     value: "120K", delta: null },
          { label: "Customers",       value: "35",   delta: null },
          { label: "Producers",       value: "35",   delta: null },
          { label: "Orders Pending",  value: "10",   delta: "+4%" },
          { label: "Efficiency Score",value: "64%",  delta: "+4%" },
        ].map(({ label, value, delta }) => (
          <div key={label} className="col-6 col-md-4 col-lg-2">
            <div
              className="card border rounded-3 px-3 py-2 h-100"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111", lineHeight: 1.1, fontFamily: "'DM Mono', monospace" }}>
                {value}
              </div>
              {delta && (
                <div style={{ fontSize: 10, color: "#22C55E", marginTop: 2 }}>{delta}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Chart + Donut + Scheduling ── */}
      <div className="row g-2 flex-grow-1">

        {/* Products Chart */}
        <div className="col-12 col-lg-4">
          <div className="card border rounded-3 p-3 h-100">
            <div
              className="fw-semibold mb-2"
              style={{ fontSize: 11, color: "#111", fontFamily: "'DM Sans', sans-serif" }}
            >
              Products Chart
            </div>
            <div className="d-flex align-items-end gap-1 mt-2">
              <MiniBarChart
                data={[30, 55, 40, 80, 65, 90, 45, 70]}
                width={160}
                height={70}
                highlightIndex={5}
              />
            </div>
            <div className="mt-3">
              <button
                className="btn btn-sm fw-semibold d-flex align-items-center gap-1"
                style={{
                  background: "#111",
                  color: "#fff",
                  fontSize: 10,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Generate New Order
              </button>
            </div>
            {/* Tiny date details */}
            <div className="mt-2 d-flex flex-column gap-1">
              {["Start date • —", "End date • —", "Start date • —", "End date • —"].map((t, i) => (
                <div key={i} style={{ fontSize: 9, color: "#bbb", fontFamily: "'DM Mono', monospace" }}>{t}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Donut — Efficiency */}
        <div className="col-12 col-lg-4">
          <div className="card border rounded-3 p-3 h-100 d-flex flex-column align-items-center justify-content-center gap-2">
            <div style={{ fontSize: 11, fontWeight: 600, color: "#111", fontFamily: "'DM Sans', sans-serif" }}>
              Fulfillment
            </div>
            <DonutChart value={64} size={80} color="#F5C800" label="64%" sublabel="score" />
            <DonutChart value={45} size={60} color="#22C55E" label="45" sublabel="rating" />
          </div>
        </div>

        {/* Scheduling */}
        <div className="col-12 col-lg-4">
          <div className="card border rounded-3 p-3 h-100">
            <div
              className="fw-semibold mb-2"
              style={{ fontSize: 11, color: "#111", fontFamily: "'DM Sans', sans-serif" }}
            >
              Scheduling
            </div>
            <div className="d-flex flex-column gap-2 mt-1">
              {SCHEDULE_ITEMS.map(({ label, count, status }) => (
                <div
                  key={label}
                  className="d-flex align-items-center justify-content-between rounded-2 px-2 py-1"
                  style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="rounded-circle"
                      style={{ width: 7, height: 7, background: statusColor[status] }}
                    />
                    <span style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: "#333" }}>
                      {label}
                    </span>
                  </div>
                  <span
                    className="fw-bold"
                    style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: "#111" }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 d-flex flex-column gap-1">
              {["Pending ——", "Per Delivery ——", "Monthly ——"].map((t) => (
                <div key={t} style={{ fontSize: 9, color: "#bbb", fontFamily: "'DM Mono', monospace" }}>{t}</div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}