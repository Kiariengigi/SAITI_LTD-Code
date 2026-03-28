// pages/CustomersPage.tsx
import type { Customer } from "./Types";
import { CUSTOMERS } from "./Types"
import PaginatedTable from "./Paginatedtable";

const statusBadge = (status: Customer["stockStatus"]) => {
  const map: Record<Customer["stockStatus"], string> = {
    "In Stock":     "success",
    "Low Stock":    "warning",
    "Out of Stock": "danger",
  };
  return (
    <span className={`badge bg-${map[status]} text-white rounded-pill`} style={{ fontSize: 9 }}>
      {status}
    </span>
  );
};

const COLUMNS = [
  { key: "name",          label: "Customer" },
  { key: "location",      label: "Location" },
  { key: "lastOrderDate", label: "Last Order Date" },
  {
    key: "stockStatus",
    label: "Stock Status",
    render: (row: Customer) => statusBadge(row.stockStatus),
  },
];

const totalRevenue = CUSTOMERS.reduce((s, c) => s + c.totalBought, 0);
const avgOrder     = Math.round(totalRevenue / CUSTOMERS.length);
const topCustomer  = CUSTOMERS.reduce((a, b) => (a.totalBought > b.totalBought ? a : b));

export default function CustomersPage() {
  return (
    <div className="p-3 d-flex flex-column gap-3 h-100" style={{ minHeight: 0, overflowY: "auto" }}>

      {/* Stat row */}
      <div className="row g-2">
        {[
          { label: "Total Products Bought", value: CUSTOMERS.reduce((s, c) => s + c.totalBought, 0).toLocaleString() + " KSH" },
          { label: "Customer Revenue",      value: totalRevenue.toLocaleString() + " KSH" },
          { label: "Avg Order Value",       value: avgOrder.toLocaleString() + " KSH" },
          { label: "Top Customer",          value: topCustomer.name },
        ].map(({ label, value }) => (
          <div key={label} className="col-6 col-md-3">
            <div className="card border rounded-3 px-3 py-2 h-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111", lineHeight: 1.2 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="card border rounded-3 flex-grow-1 overflow-hidden d-flex flex-column">
        <PaginatedTable<Customer>
          columns={COLUMNS}
          data={CUSTOMERS}
          pageSize={6}
          searchKeys={["name", "location"]}
        />
      </div>
    </div>
  );
}