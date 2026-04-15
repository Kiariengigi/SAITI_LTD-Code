// pages/InventoryPage.tsx
import { useEffect, useMemo, useState } from "react";
import PaginatedTable from "./Paginatedtable";
import axios from "../api/axios";

type InventoryStockLevel = "In Stock" | "Low Stock" | "Out of Stock";

type InventoryRow = {
  id: string;
  productName: string;
  category: string;
  unitOfMeasure: string;
  quantity: number;
  price: number;
  inventoryValue: number;
  reorderPoint: number;
  stockLevel: InventoryStockLevel;
};

type InventoryMetrics = {
  totalInventoryPieces: number;
  inventoryValue: number;
  cogs: number;
  averageInventoryValue: number;
  inventoryHealth: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  roleType: string;
};

type InventoryAnalyticsResponse = {
  metrics: InventoryMetrics;
  items: InventoryRow[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

const tabs = [
  { key: "all", label: "All Inventory" },
  { key: "in-stock", label: "In Stock" },
  { key: "low-stock", label: "Low Stock" },
  { key: "out-of-stock", label: "Out of Stock" },
] as const;

type InventoryFilter = (typeof tabs)[number]["key"];

const stockLevelBadge = (stockLevel: InventoryStockLevel) => {
  const map: Record<InventoryStockLevel, string> = {
    "In Stock": "success",
    "Low Stock": "warning",
    "Out of Stock": "danger",
  };

  return <span className={`badge bg-${map[stockLevel]} rounded-pill`} style={{ fontSize: 9 }}>{stockLevel}</span>;
};

export default function InventoryPage() {
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [activeTab, setActiveTab] = useState<InventoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadInventory = async () => {
      try {
        setLoading(true);
        const response = await axios.get("user/inventory-analytics");
        const payload = response.data?.data as InventoryAnalyticsResponse | undefined;

        if (isMounted) {
          setMetrics(payload?.metrics ?? null);
          setItems(payload?.items ?? []);
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Failed to load inventory analytics.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case "in-stock":
        return items.filter((item) => item.stockLevel === "In Stock");
      case "low-stock":
        return items.filter((item) => item.stockLevel === "Low Stock");
      case "out-of-stock":
        return items.filter((item) => item.stockLevel === "Out of Stock");
      default:
        return items;
    }
  }, [activeTab, items]);

  const columns = [
    { key: "productName", label: "Inventory Item" },
    { key: "category", label: "Category" },
    {
      key: "quantity",
      label: "Quantity",
      render: (row: InventoryRow) => `${row.quantity} pc`,
    },
    {
      key: "price",
      label: "Unit Price",
      render: (row: InventoryRow) => formatCurrency(row.price),
    },
    {
      key: "inventoryValue",
      label: "Inventory Value",
      render: (row: InventoryRow) => formatCurrency(row.inventoryValue),
    },
    {
      key: "stockLevel",
      label: "Stock Status",
      render: (row: InventoryRow) => stockLevelBadge(row.stockLevel),
    },
  ];

  const statCards = [
    { label: "Total Inventory (pc)", value: loading ? "..." : `${metrics?.totalInventoryPieces ?? 0}` },
    { label: "Inventory Value", value: loading ? "..." : formatCurrency(metrics?.inventoryValue ?? 0) },
    { label: "Inventory Health", value: loading ? "..." : `${(metrics?.inventoryHealth ?? 0).toFixed(2)}x` },
  ];

  const tabCounts: Record<InventoryFilter, number> = {
    all: items.length,
    "in-stock": metrics?.inStockCount ?? 0,
    "low-stock": metrics?.lowStockCount ?? 0,
    "out-of-stock": metrics?.outOfStockCount ?? 0,
  };

  return (
    <div className="p-3 d-flex flex-column gap-3 h-100" style={{ minHeight: 0, overflowY: "auto" }}>
      {error && (
        <div className="alert alert-danger mb-0" role="alert">
          {error}
        </div>
      )}

      <div className="row g-2">
        {statCards.map(({ label, value }) => (
          <div key={label} className="col-12 col-md-4">
            <div className="card border rounded-3 px-3 py-2 h-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111", fontFamily: "'DM Mono', monospace" }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="btn btn-sm rounded-pill"
            style={{
              fontSize: 10,
              fontFamily: "'DM Sans', sans-serif",
              background: activeTab === tab.key ? "#111" : "#f0f0f0",
              color: activeTab === tab.key ? "#fff" : "#555",
              border: "none",
              padding: "3px 10px",
            }}
          >
            {tab.label}
            <span
              className="ms-1 rounded-pill px-1"
              style={{
                fontSize: 9,
                background: activeTab === tab.key ? "#F5C800" : "#ddd",
                color: "#111",
              }}
            >
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="card border rounded-3 flex-grow-1 overflow-hidden d-flex flex-column">
        <PaginatedTable<InventoryRow>
          columns={columns}
          data={filteredItems}
          pageSize={6}
          searchKeys={["productName", "category", "stockLevel"]}
        />
      </div>
    </div>
  );
}