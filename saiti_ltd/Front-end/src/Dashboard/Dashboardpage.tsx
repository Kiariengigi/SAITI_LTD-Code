// pages/DashboardPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import DonutChart from "./Docutchart";
import axios from "../api/axios";

type DashboardMetrics = {
  ordersPastWeek: number;
  currentStockValue: number;
  customerCount: number;
  producerCount: number;
  pendingOrders: number;
  deliveredOrders: number;
  efficiencyScore: number;
  roleType: string;
};

type InventoryRow = {
  id: string;
  productName: string;
  quantity: number;
  inventoryValue: number;
  stockLevel: "In Stock" | "Low Stock" | "Out of Stock";
};

type InventoryAnalytics = {
  metrics: {
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
  items: InventoryRow[];
};

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
  products: OrderProduct[];
  totalPrice: number;
  status: "pending" | "confirmed" | "processing" | "dispatched" | "delivered" | "cancelled" | "returned";
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

type ScheduleColumn = "inbox" | "delivering" | "fulfilled";
type OrderStatus = OrderRow["status"];

const SCHEDULE_STORAGE_KEY = "saiti.dashboard.schedule.v1";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) => new Date(value).toLocaleDateString();

const scheduleColumns: Array<{ key: ScheduleColumn; label: string; description: string }> = [
  { key: "inbox", label: "Inbox", description: "Received orders" },
  { key: "delivering", label: "Delivering", description: "Scheduled for delivery" },
  { key: "fulfilled", label: "Fulfilled", description: "Completed this session" },
];

const scheduleStatusMap: Record<ScheduleColumn, OrderStatus> = {
  inbox: "pending",
  delivering: "dispatched",
  fulfilled: "delivered",
};

const statusToScheduleColumn = (status: OrderStatus): ScheduleColumn => {
  switch (status) {
    case "dispatched":
      return "delivering";
    case "delivered":
      return "fulfilled";
    default:
      return "inbox";
  }
};

export default function DashboardPage() {
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [scheduleState, setScheduleState] = useState<Record<string, ScheduleColumn>>({});
  const [scheduleReady, setScheduleReady] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardResponse, inventoryResponse, orderResponse] = await Promise.all([
        axios.get("user/dashboard-analytics"),
        axios.get("user/inventory-analytics"),
        axios.get("user/order-analytics"),
      ]);

      setDashboardMetrics(dashboardResponse.data?.data?.metrics ?? null);

      const inventoryPayload = inventoryResponse.data?.data as InventoryAnalytics | undefined;
      setInventoryItems(inventoryPayload?.items ?? []);

      const orderPayload = orderResponse.data?.data as OrderAnalyticsResponse | undefined;
      setOrders(orderPayload?.orders ?? []);
      setError("");
    } catch {
      setError("Failed to load dashboard analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDashboardData();
  }, [refreshDashboardData]);

  useEffect(() => {
    if (orders.length === 0) {
      return;
    }

    const defaultState = Object.fromEntries(
      orders.map((order) => [order.id, statusToScheduleColumn(order.status)] as const)
    ) as Record<string, ScheduleColumn>;

    try {
      const saved = sessionStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, ScheduleColumn>;
        const merged = { ...defaultState, ...parsed };
        setScheduleState(merged);
        setScheduleReady(true);
        return;
      }
    } catch {
      // Ignore malformed session state and rebuild from live orders.
    }

    setScheduleState(defaultState);
    setScheduleReady(true);
  }, [orders]);

  useEffect(() => {
    if (!scheduleReady) {
      return;
    }

    sessionStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(scheduleState));
  }, [scheduleReady, scheduleState]);

  const topInventoryItems = useMemo(
    () => [...inventoryItems].sort((a, b) => b.quantity - a.quantity).slice(0, 6),
    [inventoryItems]
  );

  const inboxOrders = useMemo(
    () => orders.filter((order) => (scheduleState[order.id] ?? "inbox") === "inbox"),
    [orders, scheduleState]
  );

  const deliveringOrders = useMemo(
    () => orders.filter((order) => scheduleState[order.id] === "delivering"),
    [orders, scheduleState]
  );

  const fulfilledOrders = useMemo(
    () => orders.filter((order) => scheduleState[order.id] === "fulfilled"),
    [orders, scheduleState]
  );

  const scheduleCounts: Record<ScheduleColumn, number> = {
    inbox: inboxOrders.length,
    delivering: deliveringOrders.length,
    fulfilled: fulfilledOrders.length,
  };

  const moveOrder = async (orderId: string, target: ScheduleColumn) => {
    const previousColumn = scheduleState[orderId] ?? statusToScheduleColumn("pending");

    if (previousColumn === target) {
      return;
    }

    setScheduleError("");
    setScheduleState((current) => ({
      ...current,
      [orderId]: target,
    }));

    try {
      await axios.patch(`orders/${orderId}/status`, {
        status: scheduleStatusMap[target],
      });
      await refreshDashboardData();
    } catch {
      setScheduleState((current) => ({
        ...current,
        [orderId]: previousColumn,
      }));
      setScheduleError("Failed to update order status. Please try again.");
    }
  };

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, orderId: string) => {
    event.dataTransfer.setData("text/plain", orderId);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDropToColumn = (event: React.DragEvent<HTMLDivElement>, target: ScheduleColumn) => {
    event.preventDefault();
    const orderId = event.dataTransfer.getData("text/plain");

    if (!orderId) {
      return;
    }

    void moveOrder(orderId, target);
  };

  const statCards = [
    { label: "Orders This Week", value: dashboardMetrics?.ordersPastWeek ?? 0 },
    { label: "Stock Value", value: dashboardMetrics ? formatCurrency(dashboardMetrics.currentStockValue) : formatCurrency(0) },
    { label: "Customers", value: dashboardMetrics?.customerCount ?? 0 },
    { label: "Producers", value: dashboardMetrics?.producerCount ?? 0 },
    { label: "Orders Pending", value: dashboardMetrics?.pendingOrders ?? 0 },
    { label: "Efficiency Score", value: `${dashboardMetrics?.efficiencyScore ?? 0}%` },
  ];

  return (
    <div className="p-3 d-flex flex-column gap-3" style={{ minHeight: 0, overflowY: "auto" }}>
      {error && (
        <div className="alert alert-danger mb-0" role="alert">
          {error}
        </div>
      )}
      {scheduleError && (
        <div className="alert alert-warning mb-0" role="alert">
          {scheduleError}
        </div>
      )}

      <div className="row g-2">
        {statCards.map(({ label, value }) => (
          <div key={label} className="col-6 col-md-4 col-lg-2">
            <div className="card border rounded-3 px-3 py-2 h-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>{label}</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#111",
                  lineHeight: 1.1,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {loading ? "..." : value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-2 flex-grow-1">
        <div className="col-12 col-lg-5">
          <div className="card border rounded-3 p-3 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <div className="fw-semibold" style={{ fontSize: 11, color: "#111", fontFamily: "'DM Sans', sans-serif" }}>
                Order Scheduling
              </div>
              <div style={{ fontSize: 9, color: "#999", fontFamily: "'DM Mono', monospace" }}>
                Drag inbox orders into delivery and fulfillment
              </div>
            </div>

            <div className="row g-2 flex-grow-1" style={{ minHeight: 0 }}>
              {scheduleColumns.map((column) => {
                const items =
                  column.key === "inbox"
                    ? inboxOrders
                    : column.key === "delivering"
                      ? deliveringOrders
                      : fulfilledOrders;

                return (
                  <div key={column.key} className="col-12 col-md-4">
                    <div
                      className="card border rounded-3 h-100 d-flex flex-column"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => onDropToColumn(event, column.key)}
                      style={{ background: column.key === "fulfilled" ? "#fcfcfc" : "#fff" }}
                    >
                      <div className="px-2 pt-2 pb-1 border-bottom d-flex align-items-center justify-content-between gap-2">
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#111", fontFamily: "'DM Sans', sans-serif" }}>
                            {column.label}
                          </div>
                          <div style={{ fontSize: 9, color: "#999", fontFamily: "'DM Mono', monospace" }}>
                            {column.description}
                          </div>
                        </div>
                        <span className="badge rounded-pill text-bg-dark" style={{ fontSize: 9 }}>
                          {scheduleCounts[column.key]}
                        </span>
                      </div>

                      <div className="p-2 d-flex flex-column gap-2 flex-grow-1 overflow-auto" style={{ minHeight: 260 }}>
                        {items.length > 0 ? (
                          items.map((order) => (
                            <div
                              key={order.id}
                              draggable
                              onDragStart={(event) => onDragStart(event, order.id)}
                              className="rounded-3 border p-2"
                              style={{
                                cursor: "grab",
                                background: column.key === "fulfilled" ? "#fffef3" : "#fafafa",
                                boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
                              }}
                            >
                              <div className="d-flex align-items-start justify-content-between gap-2">
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#111", fontFamily: "'DM Sans', sans-serif" }}>
                                    {order.id}
                                  </div>
                                  <div style={{ fontSize: 9, color: "#777", fontFamily: "'DM Mono', monospace" }}>
                                    {order.buyerName} • {formatDate(order.orderDate)}
                                  </div>
                                </div>
                                <span
                                  className={`badge rounded-pill ${column.key === "fulfilled" ? "bg-success" : column.key === "delivering" ? "bg-primary" : "bg-warning text-dark"}`}
                                  style={{ fontSize: 9 }}
                                >
                                  {column.label}
                                </span>
                              </div>

                              <div className="d-flex flex-wrap gap-1 mt-2">
                                {order.products.map((product) => (
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

                              <div className="d-flex align-items-center justify-content-between gap-2 mt-2">
                                <div style={{ fontSize: 9, color: "#888", fontFamily: "'DM Mono', monospace" }}>
                                  Total {formatCurrency(order.totalPrice)}
                                </div>
                                <div style={{ fontSize: 9, color: "#888", fontFamily: "'DM Mono', monospace" }}>
                                  {order.products.length} item{order.products.length === 1 ? "" : "s"}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex-grow-1 d-flex align-items-center justify-content-center text-muted" style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
                            {column.key === "fulfilled"
                              ? "No fulfilled orders in this session"
                              : column.key === "delivering"
                                ? "Drop orders here to schedule delivery"
                                : "All incoming orders start here"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 d-flex align-items-center justify-content-between gap-2">
              <div style={{ fontSize: 9, color: "#bbb", fontFamily: "'DM Mono', monospace" }}>
                Fulfilled items stay only for this browser session.
              </div>
              <div style={{ fontSize: 9, color: "#bbb", fontFamily: "'DM Mono', monospace" }}>
                Inbox: {scheduleCounts.inbox} • Delivering: {scheduleCounts.delivering} • Fulfilled: {scheduleCounts.fulfilled}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-3">
          <div className="card border rounded-3 p-3 h-100 d-flex flex-column align-items-center justify-content-center gap-2">
            <div style={{ fontSize: 11, fontWeight: 600, color: "#111", fontFamily: "'DM Sans', sans-serif" }}>
              Efficiency
            </div>
            <DonutChart
              value={dashboardMetrics?.efficiencyScore ?? 0}
              size={80}
              color="#F5C800"
              label={`${dashboardMetrics?.efficiencyScore ?? 0}%`}
              sublabel="score"
            />
            <DonutChart
              value={dashboardMetrics?.pendingOrders ?? 0}
              size={60}
              color="#22C55E"
              label={`${dashboardMetrics?.pendingOrders ?? 0}`}
              sublabel="pending"
            />
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border rounded-3 p-3 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
              <div className="fw-semibold" style={{ fontSize: 11, color: "#111", fontFamily: "'DM Sans', sans-serif" }}>
                Top Inventory Items
              </div>
              <div style={{ fontSize: 9, color: "#999", fontFamily: "'DM Mono', monospace" }}>
                by units on hand
              </div>
            </div>

            <div className="flex-grow-1 d-flex align-items-end justify-content-between gap-2" style={{ minHeight: 160 }}>
              {topInventoryItems.length > 0 ? (
                (() => {
                  const maxQuantity = Math.max(...topInventoryItems.map((item) => item.quantity), 1);

                  return topInventoryItems.map((item) => {
                    const barHeight = Math.max(16, (item.quantity / maxQuantity) * 120);

                    return (
                      <div key={item.id} className="d-flex flex-column align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex flex-column align-items-center justify-content-end w-100" style={{ height: 130 }}>
                          <div
                            className="w-100 rounded-top"
                            style={{
                              height: barHeight,
                              background: "linear-gradient(180deg, #111 0%, #F5C800 100%)",
                              minHeight: 16,
                              borderRadius: 4,
                            }}
                            title={`${item.productName}: ${item.quantity} pc`}
                          />
                        </div>
                        <div
                          className="mt-2 text-center text-truncate"
                          style={{ width: "100%", fontSize: 9, color: "#444", fontFamily: "'DM Sans', sans-serif" }}
                          title={item.productName}
                        >
                          {item.productName}
                        </div>
                        <div style={{ fontSize: 9, color: "#999", fontFamily: "'DM Mono', monospace" }}>
                          {item.quantity} pc
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="w-100 text-center text-muted" style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
                  {loading ? "Loading inventory..." : "No inventory items available"}
                </div>
              )}
            </div>

            <div className="mt-3 d-flex flex-wrap gap-2 justify-content-between">
              <div style={{ fontSize: 9, color: "#bbb", fontFamily: "'DM Mono', monospace" }}>
                Stock value: {loading ? "..." : formatCurrency(dashboardMetrics?.currentStockValue ?? 0)}
              </div>
              <div style={{ fontSize: 9, color: "#bbb", fontFamily: "'DM Mono', monospace" }}>
                Inventory items: {loading ? "..." : inventoryItems.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
