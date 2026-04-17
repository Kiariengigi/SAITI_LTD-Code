// Products_Page/AI_Insights.tsx
// ================================================================
// Reads real InsightItem[] and InsightsSummary from the API.
// Falls back gracefully when loading or empty.
// ================================================================

import { Container, Row } from "react-bootstrap";
import { Popover, OverlayTrigger, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfo, faTriangleExclamation, faBoxOpen, faCartShopping } from "@fortawesome/free-solid-svg-icons";
import type { InsightItem, InsightsSummary } from "./Products_main";

interface Props {
    insights:  InsightItem[];
    summary:   InsightsSummary | null;
    loading:   boolean;
    onOrderSuggestion: (item: InsightItem) => void;
    onOrderAllSuggestions: (items: InsightItem[]) => void;
}

const getPopover = (title: string, body: string) => (
    <Popover id={`pop-${title}`}>
        <Popover.Header as="h3">{title}</Popover.Header>
        <Popover.Body style={{ fontSize: 13 }}>{body}</Popover.Body>
    </Popover>
);

// Severity badge colours
const severityColor: Record<string, string> = {
    critical: "#dc3545",
    high:     "#fd7e14",
    medium:   "#ffc107",
    low:      "#20c997",
};

function AI_Insights({ insights, summary, loading, onOrderSuggestion, onOrderAllSuggestions }: Props) {
    const getSuggestedQuantity = (item: InsightItem) => Math.max(1, Math.floor(Number(item.forecastValue ?? item.product.reorderPoint) || 1));

    // Derive the display values from real data
    const reorderItems    = summary?.reorderSuggestions ?? [];
    const stockoutItems   = summary?.stockoutWarnings   ?? [];
    const demandItems     = summary?.demandForecasts     ?? [];

    // Primary metric: average demand forecast confidence
    const avgConfidence = demandItems.length
        ? Math.round(
            demandItems.reduce((acc, i) => acc + (parseFloat(i.forecastValue ?? "0")), 0) /
            demandItems.length
        )
        : null;

    // Soonest stockout
    const soonestStockout = stockoutItems.length
        ? stockoutItems[0]
        : null;

    // Total reorder value estimate: sum of (price × reorderPoint) for each suggestion
    const estimatedOrderTotal = reorderItems.reduce((acc, i) => {
        const price       = parseFloat(i.product.price ?? "0");
        const reorderQty  = getSuggestedQuantity(i);
        return acc + price * reorderQty;
    }, 0);

    return (
        <div style={{ borderBottom: "1px solid #e9ecef" }}>
            {/* Header */}
            <div className="d-flex align-items-center gap-2 px-3 pt-3 pb-1">
                <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: "linear-gradient(135deg, #667eea, #764ba2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="white">
                        <path d="M8 1l1.5 3 3.5.5-2.5 2.5.6 3.5L8 9l-3.1 1.5.6-3.5L3 4.5l3.5-.5z" />
                    </svg>
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1a1a2e" }}>
                    AI Suggested Orders
                </span>
                {summary && summary.criticalCount > 0 && (
                    <span className="badge ms-1" style={{ background: "#dc3545", fontSize: "0.65rem" }}>
                        {summary.criticalCount} critical
                    </span>
                )}
            </div>

            {/* Loading skeleton */}
            {loading && (
                <Container fluid className="p-3" style={{ background: "#f8f9fa" }}>
                    <div className="d-flex align-items-center justify-content-center py-4 gap-2 text-muted">
                        <Spinner animation="border" size="sm" />
                        <span style={{ fontSize: 13 }}>Loading AI insights…</span>
                    </div>
                </Container>
            )}

            {/* Empty state */}
            {!loading && insights.length === 0 && (
                <Container fluid className="p-3" style={{ background: "#f8f9fa" }}>
                    <div className="text-center py-4 text-muted">
                        <FontAwesomeIcon icon={faBoxOpen} size="2x" className="mb-2 d-block mx-auto" style={{ opacity: 0.3 }} />
                        <span style={{ fontSize: 13 }}>
                            No AI insights yet. They will appear here after your first orders are processed.
                        </span>
                    </div>
                </Container>
            )}

            {/* Populated state */}
            {!loading && insights.length > 0 && (
                <Container fluid className="p-3" style={{ background: "#f8f9fa" }}>
                    <div className="d-flex justify-content-end mb-2">
                        <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => onOrderAllSuggestions(reorderItems)}
                            disabled={reorderItems.length === 0}
                            style={{
                                fontSize: "0.7rem",
                                background: reorderItems.length === 0 ? "#adb5bd" : "#0b3f88",
                                color: "#fff",
                                borderRadius: 999,
                                padding: "5px 12px",
                            }}
                        >
                            Order entire suggested order
                        </button>
                    </div>
                    <Row className="g-3">
                        {/* Left: scrollable suggested order cards */}
                        <div
                            className="col-12 col-lg-9 d-flex overflow-auto py-2"
                            style={{ gap: "2rem" }}
                        >
                            {reorderItems.length > 0 ? (
                                reorderItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex-shrink-0 text-center"
                                        style={{
                                            width: 160,
                                            background: "#fff",
                                            borderRadius: 12,
                                            padding: "12px 10px",
                                            boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                                            border: `1.5px solid ${severityColor[item.severity] ?? "#e9ecef"}22`,
                                        }}
                                    >
                                        {/* Severity badge */}
                                        <span
                                            className="badge mb-2"
                                            style={{
                                                background: severityColor[item.severity] ?? "#adb5bd",
                                                fontSize: "0.6rem",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {item.severity}
                                        </span>

                                        <h6 className="text-muted mb-1" style={{ fontSize: "0.7rem" }}>
                                            {item.product.producer?.companyName ?? "Unknown supplier"}
                                        </h6>
                                        <h5 style={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.3 }}>
                                            {item.product.productName}
                                        </h5>
                                        <div
                                            style={{
                                                width: 48, height: 48, borderRadius: 8,
                                                background: "#f8f9fa",
                                                margin: "8px auto",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}
                                        >
                                            <FontAwesomeIcon
                                                icon={faBoxOpen}
                                                style={{ color: severityColor[item.severity] ?? "#adb5bd", fontSize: 22 }}
                                            />
                                        </div>
                                        <div style={{ fontSize: "0.7rem", color: "#6c757d", marginBottom: 4 }}>
                                            Suggested: <strong>{getSuggestedQuantity(item)} {item.product.unitOfMeasure}</strong>
                                        </div>
                                        <h4 style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                                            KSH {(parseFloat(item.product.price) * getSuggestedQuantity(item)).toLocaleString()}
                                        </h4>
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={getPopover("AI Reasoning", item.insightText)}
                                        >
                                            <span style={{ fontSize: "0.65rem", color: "#6c757d", cursor: "pointer" }}>
                                                Why? <FontAwesomeIcon icon={faInfo} size="xs" />
                                            </span>
                                        </OverlayTrigger>
                                        <button
                                            type="button"
                                            className="btn btn-sm mt-2"
                                            onClick={() => onOrderSuggestion(item)}
                                            style={{
                                                fontSize: "0.65rem",
                                                background: "#111",
                                                color: "#fff",
                                                borderRadius: 999,
                                                padding: "4px 10px",
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faCartShopping} className="me-1" />
                                            Order suggested
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="d-flex align-items-center text-muted" style={{ fontSize: 13 }}>
                                    No reorder suggestions at this time.
                                </div>
                            )}
                        </div>

                        {/* Right: metrics summary */}
                        <div className="col-12 col-lg-3 d-flex flex-column justify-content-center border-start ps-3">
                            {estimatedOrderTotal > 0 && (
                                <>
                                    <h6 style={{ fontSize: "0.75rem", color: "#6c757d", marginBottom: 2 }}>
                                        Estimated Order Total
                                    </h6>
                                    <h3 style={{ fontWeight: 800, color: "#1a1a2e" }}>
                                        KSH {estimatedOrderTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </h3>
                                </>
                            )}

                            <Container fluid className="px-0 mt-2">
                                <Row className="g-2">
                                    {/* Demand forecast */}
                                    {avgConfidence !== null && (
                                        <div className="col-6 text-center">
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={getPopover(
                                                    "Demand Forecasting",
                                                    demandItems[0]?.insightText ?? "AI-predicted demand for your top products."
                                                )}
                                            >
                                                <span style={{ cursor: "pointer" }}>
                                                    <h2 style={{ fontWeight: 800 }}>
                                                        <strong>{avgConfidence}%</strong>
                                                    </h2>
                                                    <h6 style={{ fontSize: "0.7rem" }}>
                                                        Demand Forecast <FontAwesomeIcon icon={faInfo} size="sm" />
                                                    </h6>
                                                </span>
                                            </OverlayTrigger>
                                        </div>
                                    )}

                                    {/* Stockout warning */}
                                    {soonestStockout && (
                                        <div className="col-6 text-center">
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={getPopover(
                                                    `Stockout: ${soonestStockout.product.productName}`,
                                                    soonestStockout.insightText
                                                )}
                                            >
                                                <span style={{ cursor: "pointer" }}>
                                                    <h2 style={{ fontWeight: 800, color: severityColor[soonestStockout.severity] }}>
                                                        <FontAwesomeIcon
                                                            icon={faTriangleExclamation}
                                                            size="sm"
                                                            className="me-1"
                                                        />
                                                        <strong>
                                                            {soonestStockout.forecastValue
                                                                ? `${parseFloat(soonestStockout.forecastValue).toFixed(0)}d`
                                                                : "!"}
                                                        </strong>
                                                    </h2>
                                                    <h6 style={{ fontSize: "0.7rem" }}>
                                                        Until Stockout <FontAwesomeIcon icon={faInfo} size="sm" />
                                                    </h6>
                                                </span>
                                            </OverlayTrigger>
                                        </div>
                                    )}

                                    {/* Counts */}
                                    <div className="col-6 text-center">
                                        <h2 style={{ fontWeight: 800 }}>
                                            <strong>{reorderItems.length}</strong>
                                        </h2>
                                        <h6 style={{ fontSize: "0.7rem" }}>Reorder Alerts</h6>
                                    </div>
                                    <div className="col-6 text-center">
                                        <h2 style={{ fontWeight: 800 }}>
                                            <strong>{summary?.totalInsights ?? 0}</strong>
                                        </h2>
                                        <h6 style={{ fontSize: "0.7rem" }}>Total Insights</h6>
                                    </div>
                                </Row>
                            </Container>
                        </div>
                    </Row>
                </Container>
            )}
        </div>
    );
}

export default AI_Insights;