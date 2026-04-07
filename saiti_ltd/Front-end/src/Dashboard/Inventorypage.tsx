// pages/InventoryPage.tsx
import type { InventoryItem } from "./Types";
import { INVENTORY } from "./Types";
import PaginatedTable from "./Paginatedtable"

const inStock    = INVENTORY.filter((i) => i.stockLevel === "In Stock").length;
const lowStock   = INVENTORY.filter((i) => i.stockLevel === "Low Stock").length;
const outOfStock = INVENTORY.filter((i) => i.stockLevel === "Out of Stock").length;
const totalValue = INVENTORY.reduce((s, i) => s + i.price * i.quantity, 0);

// Tabs mirror the wireframe header tabs
const TABS = ["In-stock", "Low Stock", "Out of Stock"] as const;
type Tab = (typeof TABS)[number];

const tabFilter: Record<Tab, InventoryItem["stockLevel"]> = {
  "In-stock":     "In Stock",
  "Low Stock":    "Low Stock",
  "Out of Stock": "Out of Stock",
};

import { useState } from "react";

const COLUMNS = [
  { key: "product",     label: "Product" },
  { key: "quantity",    label: "Quantity", render: (row: InventoryItem) => `${row.quantity} pc` },
  { key: "price",       label: "Price",   render: (row: InventoryItem) => `${row.price.toLocaleString()} KSH` },
  { key: "lastOrdered", label: "Last Ordered" },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("In-stock");

  const filtered = INVENTORY.filter((i) => i.stockLevel === tabFilter[activeTab]);

  return (
    <div className="p-3 d-flex flex-column gap-3 h-100" style={{ minHeight: 0, overflowY: "auto" }}>

      {/* Stat row */}
      <div className="row g-2">
        {[
          { label: "Total Inventory pc", value: INVENTORY.reduce((s, i) => s + i.quantity, 0) },
          { label: "Inventory Value",    value: `${(totalValue / 1000).toFixed(0)}K KSH` },
          { label: "Inventory Health",   value: `${Math.round((inStock / INVENTORY.length) * 100)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="col-4">
            <div className="card border rounded-3 px-3 py-2 h-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111", fontFamily: "'DM Mono', monospace" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="btn btn-sm rounded-pill"
            style={{
              fontSize: 10,
              fontFamily: "'DM Sans', sans-serif",
              background: activeTab === tab ? "#111" : "#f0f0f0",
              color: activeTab === tab ? "#fff" : "#555",
              border: "none",
              padding: "3px 10px",
            }}
          >
            {tab}
            <span
              className="ms-1 rounded-pill px-1"
              style={{
                fontSize: 9,
                background: activeTab === tab ? "#F5C800" : "#ddd",
                color: "#111",
              }}
            >
              {tab === "In-stock" ? inStock : tab === "Low Stock" ? lowStock : outOfStock}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card border rounded-3 flex-grow-1 overflow-hidden d-flex flex-column">
        <PaginatedTable<InventoryItem>
          columns={COLUMNS}
          data={filtered}
          pageSize={6}
          searchKeys={["product"]}
        />
      </div>
    </div>
  );
}