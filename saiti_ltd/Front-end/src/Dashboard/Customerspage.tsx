// pages/CustomersPage.tsx
import { useEffect, useState } from "react";
import PaginatedTable from "./Paginatedtable";
import axios from "../api/axios";

type CustomerRow = {
  id: string;
  name: string;
  location: string;
  lastOrderDate: string;
  totalProductsBought: number;
  totalProductsBoughtWeek: number;
  totalOrderValue: number;
  orderCount: number;
  hasLowStockProducts: boolean;
  lowStockProductsCount: number;
};

type CustomerAnalytics = {
  totalProductsBoughtWeek: number;
  profitReceived: number;
  averageOrderValue: number;
  customerCount: number;
  topCustomer: null | {
    id: string;
    name: string;
    totalProductsBought: number;
    totalOrderValue: number;
  };
  roleType: string;
};

type CustomerAnalyticsResponse = {
  metrics: CustomerAnalytics;
  customers: CustomerRow[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

const statusBadge = (hasLowStockProducts: boolean, lowStockProductsCount: number) => (
  <span
    className={`badge rounded-pill ${hasLowStockProducts ? "bg-warning text-dark" : "bg-success text-white"}`}
    style={{ fontSize: 9 }}
  >
    {hasLowStockProducts ? `${lowStockProductsCount} low stock` : "Healthy"}
  </span>
);

export default function CustomersPage() {
  const [metrics, setMetrics] = useState<CustomerAnalytics | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("user/customer-analytics");
        const payload = response.data?.data as CustomerAnalyticsResponse | undefined;

        if (isMounted) {
          setMetrics(payload?.metrics ?? null);
          setCustomers(payload?.customers ?? []);
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Failed to load customer analytics.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const topCustomer = metrics?.topCustomer?.name ?? "-";

  const columns = [
    { key: "name", label: "Customer" },
    { key: "location", label: "Location" },
    {
      key: "lastOrderDate",
      label: "Last Order Date",
      render: (row: CustomerRow) => new Date(row.lastOrderDate).toLocaleDateString(),
    },
    {
      key: "stockStatus",
      label: "Low Stock",
      render: (row: CustomerRow) => statusBadge(row.hasLowStockProducts, row.lowStockProductsCount),
    },
  ];

  const statCards = [
    { label: "Total Products Bought This Week", value: loading ? "..." : `${metrics?.totalProductsBoughtWeek ?? 0}` },
    { label: "Profit Received", value: loading ? "..." : formatCurrency(metrics?.profitReceived ?? 0) },
    { label: "Average Order Value", value: loading ? "..." : formatCurrency(metrics?.averageOrderValue ?? 0) },
    { label: "Top Customer", value: loading ? "..." : topCustomer },
  ];

  return (
    <div className="p-3 d-flex flex-column gap-3 h-100" style={{ minHeight: 0, overflowY: "auto" }}>
      {error && (
        <div className="alert alert-danger mb-0" role="alert">
          {error}
        </div>
      )}

      <div className="row g-2">
        {statCards.map(({ label, value }) => (
          <div key={label} className="col-6 col-md-3">
            <div className="card border rounded-3 px-3 py-2 h-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111", lineHeight: 1.2 }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border rounded-3 flex-grow-1 overflow-hidden d-flex flex-column">
        <PaginatedTable<CustomerRow>
          columns={columns}
          data={customers}
          pageSize={6}
          searchKeys={["name", "location"]}
        />
      </div>
    </div>
  );
}
