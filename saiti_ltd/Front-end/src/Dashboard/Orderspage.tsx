// pages/OrdersPage.tsx
import type { Order } from "./Types";
import { ORDERS } from "./Types"
import PaginatedTable from "./Paginatedtable";

const statusBadge = (status: Order["status"]) => {
  const map: Record<Order["status"], string> = {
    New:       "dark",
    Pending:   "warning",
    Delivered: "success",
  };
  return (
    <span className={`badge bg-${map[status]} rounded-pill`} style={{ fontSize: 9 }}>
      {status}
    </span>
  );
};

const COLUMNS = [
  { key: "id",        label: "Orders" },
  { key: "orderDate", label: "Order Date" },
  { key: "products",  label: "Products" },
  { key: "price",     label: "Price",   render: (row: Order) => `${row.price.toLocaleString()} KSH` },
  { key: "status",    label: "Order Status", render: (row: Order) => statusBadge(row.status) },
];

const newOrders       = ORDERS.filter((o) => o.status === "New").length;
const pendingOrders   = ORDERS.filter((o) => o.status === "Pending").length;
const deliveredOrders = ORDERS.filter((o) => o.status === "Delivered").length;

export default function OrdersPage() {
  return (
    <div className="p-3 d-flex flex-column gap-3 h-100" style={{ minHeight: 0, overflowY: "auto" }}>

      {/* Stat row */}
      <div className="row g-2">
        {[
          { label: "New Orders",       value: newOrders },
          { label: "Pending Orders",   value: pendingOrders },
          { label: "Delivered Orders", value: deliveredOrders },
        ].map(({ label, value }) => (
          <div key={label} className="col-4">
            <div className="card border rounded-3 px-3 py-2 h-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111", fontFamily: "'DM Mono', monospace" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab pills */}
      <div className="d-flex gap-2">
        {["All Orders", "Pending Orders", "Delivered Orders"].map((tab, i) => (
          <button
            key={tab}
            className="btn btn-sm rounded-pill"
            style={{
              fontSize: 10,
              fontFamily: "'DM Sans', sans-serif",
              background: i === 0 ? "#111" : "#f0f0f0",
              color: i === 0 ? "#fff" : "#555",
              border: "none",
              padding: "3px 10px",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card border rounded-3 flex-grow-1 overflow-hidden d-flex flex-column">
        <PaginatedTable<Order>
          columns={COLUMNS}
          data={ORDERS}
          pageSize={6}
          searchKeys={["id", "products", "status"]}
        />
      </div>
    </div>
  );
}