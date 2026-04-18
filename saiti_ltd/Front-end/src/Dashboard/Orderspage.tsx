// pages/OrdersPage.tsx
import { useEffect, useMemo, useState } from "react";
import PaginatedTable from "./Paginatedtable";
import axios from "../api/axios";

type OrderStatus = "pending" | "confirmed" | "processing" | "dispatched" | "delivered" | "cancelled" | "returned";

type OrderProduct = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type OrderRow = {
  id: string;
  orderDate: string;
  buyerName: string;
  soldByName: string;
  products: OrderProduct[];
  totalPrice: number;
  status: OrderStatus;
};

type OrderAnalytics = {
  newOrdersPastWeek: number;
  pendingOrders: number;
  deliveredOrdersWeek: number;
  totalOrders: number;
  roleType: string;
};

type OrderAnalyticsResponse = {
  metrics: OrderAnalytics;
  orders: OrderRow[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

const pendingStatuses: OrderStatus[] = ["pending", "confirmed", "processing", "dispatched"];

const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Pending",
  processing: "Pending",
  dispatched: "Pending",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const statusBadge = (status: OrderStatus) => {
  const label = statusLabel[status];
  const map: Record<string, string> = {
    Pending: "warning",
    Delivered: "success",
    Cancelled: "danger",
    Returned: "secondary",
  };

  return (
    <span className={`badge bg-${map[label]} rounded-pill`} style={{ fontSize: 9 }}>
      {label}
    </span>
  );
};

const filterButtons = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending Orders" },
  { key: "delivered", label: "Delivered Orders" },
] as const;

type FilterType = (typeof filterButtons)[number]["key"];

export default function OrdersPage() {
  const [metrics, setMetrics] = useState<OrderAnalytics | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get("user/order-analytics");
        const payload = response.data?.data as OrderAnalyticsResponse | undefined;

        if (isMounted) {
          setMetrics(payload?.metrics ?? null);
          setOrders(payload?.orders ?? []);
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Failed to load order analytics.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    switch (activeFilter) {
      case "pending":
        return orders.filter((order) => pendingStatuses.includes(order.status));
      case "delivered":
        return orders.filter((order) => order.status === "delivered");
      default:
        return orders;
    }
  }, [activeFilter, orders]);

  const columns = [
    { key: "id", label: "Order ID" },
    {
      key: "orderDate",
      label: "Order Date",
      render: (row: OrderRow) => new Date(row.orderDate).toLocaleDateString(),
    },
    {
      key: "products",
      label: "Products Bought",
      render: (row: OrderRow) => (
        <div className="d-flex flex-wrap gap-1">
          {row.products.map((product) => (
            <span
              key={product.id}
              className="badge rounded-pill text-bg-light border"
              style={{ fontSize: 9, color: "#333" }}
              title={`${product.quantity} x ${formatCurrency(product.unitPrice)}`}
            >
              {product.name} x{product.quantity}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "totalPrice",
      label: "Total Price",
      render: (row: OrderRow) => formatCurrency(row.totalPrice),
    },
    {
      key: "status",
      label: "Order Status",
      render: (row: OrderRow) => statusBadge(row.status),
    },
  ];

  const statCards = [
    { label: "New Orders This Week", value: loading ? "..." : metrics?.newOrdersPastWeek ?? 0 },
    { label: "Orders Yet To Be Delivered", value: loading ? "..." : metrics?.pendingOrders ?? 0 },
    { label: "Delivered Orders This Week", value: loading ? "..." : metrics?.deliveredOrdersWeek ?? 0 },
    { label: "Total Orders", value: loading ? "..." : metrics?.totalOrders ?? 0 },
  ];

  return (
    <>
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
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111", fontFamily: "'DM Mono', monospace" }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="d-flex flex-wrap gap-2">
        {filterButtons.map((button) => (
          <button
            key={button.key}
            onClick={() => setActiveFilter(button.key)}
            className="btn btn-sm rounded-pill"
            style={{
              fontSize: 10,
              fontFamily: "'DM Sans', sans-serif",
              background: activeFilter === button.key ? "#111" : "#f0f0f0",
              color: activeFilter === button.key ? "#fff" : "#555",
              border: "none",
              padding: "3px 10px",
            }}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className="card border rounded-3 flex-grow-1 overflow-hidden d-flex flex-column">
        <PaginatedTable<OrderRow>
          columns={columns}
          data={filteredOrders}
          pageSize={6}
          searchKeys={["id", "buyerName", "status"]}
          onRowClick={setSelectedOrder}
        />
      </div>
    </div>

    {selectedOrder && (
      <div
        role="dialog"
        aria-modal="true"
        onClick={() => setSelectedOrder(null)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(8, 14, 26, 0.55)",
          zIndex: 1300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: "min(900px, 100%)",
            maxHeight: "90vh",
            overflow: "auto",
            background: "#fff",
            borderRadius: 18,
            border: "1px solid #e9ecef",
            boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
          }}
        >
          <div className="d-flex align-items-start justify-content-between gap-3 p-3 border-bottom">
            <div>
              <div style={{ fontSize: 12, color: "#6c757d" }}>Order Details</div>
              <h5 className="mb-1" style={{ fontWeight: 800 }}>{selectedOrder.id}</h5>
              <div style={{ fontSize: 13, color: "#495057" }}>
                Bought from <strong>{selectedOrder.soldByName}</strong> by <strong>{selectedOrder.buyerName}</strong>
              </div>
            </div>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedOrder(null)}>
              Close
            </button>
          </div>

          <div className="p-3">
            <div className="row g-3 mb-3">
              <div className="col-6 col-lg-3">
                <div className="border rounded-3 p-3 h-100">
                  <div style={{ fontSize: 11, color: "#6c757d" }}>Order Date</div>
                  <div style={{ fontWeight: 700 }}>{new Date(selectedOrder.orderDate).toLocaleString()}</div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="border rounded-3 p-3 h-100">
                  <div style={{ fontSize: 11, color: "#6c757d" }}>Status</div>
                  <div>{statusBadge(selectedOrder.status)}</div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="border rounded-3 p-3 h-100">
                  <div style={{ fontSize: 11, color: "#6c757d" }}>Buyer</div>
                  <div style={{ fontWeight: 700 }}>{selectedOrder.buyerName}</div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="border rounded-3 p-3 h-100">
                  <div style={{ fontSize: 11, color: "#6c757d" }}>Bought From</div>
                  <div style={{ fontWeight: 700 }}>{selectedOrder.soldByName}</div>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.products.map((product) => (
                    <tr key={product.id}>
                      <td style={{ fontWeight: 600 }}>{product.name}</td>
                      <td>{product.quantity}</td>
                      <td>{formatCurrency(product.unitPrice)}</td>
                      <td>{formatCurrency(product.unitPrice * product.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end mt-3">
              <div className="text-end border rounded-3 px-3 py-2" style={{ minWidth: 240 }}>
                <div style={{ fontSize: 11, color: "#6c757d" }}>Full Order Total</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#111" }}>
                  {formatCurrency(selectedOrder.totalPrice)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
