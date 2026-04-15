import React from "react";
import type { SelectedOrderItem } from "./Products_main";

interface OrderModalProps {
    isOpen: boolean;
    items: SelectedOrderItem[];
    notes: string;
    submitting: boolean;
    error: string | null;
    success: string | null;
    onClose: () => void;
    onNotesChange: (notes: string) => void;
    onQuantityChange: (productId: string, quantity: number) => void;
    onRemoveItem: (productId: string) => void;
    onSubmit: () => void;
}

const money = (value: number) => `KSH ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const OrderModal: React.FC<OrderModalProps> = ({
    isOpen,
    items,
    notes,
    submitting,
    error,
    success,
    onClose,
    onNotesChange,
    onQuantityChange,
    onRemoveItem,
    onSubmit,
}) => {
    if (!isOpen) {
        return null;
    }

    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    return (
        <div
            role="dialog"
            aria-modal="true"
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(8, 14, 26, 0.55)",
                zIndex: 1200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
            }}
        >
            <div
                style={{
                    width: "min(920px, 100%)",
                    maxHeight: "90vh",
                    overflow: "auto",
                    background: "#ffffff",
                    borderRadius: 16,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
                    border: "1px solid #e9ecef",
                }}
            >
                <div className="d-flex align-items-center justify-content-between p-3" style={{ borderBottom: "1px solid #edf0f3" }}>
                    <div>
                        <h5 style={{ marginBottom: 2 }}>Create Order</h5>
                        <small style={{ color: "#6c757d" }}>{items.length} selected product{items.length === 1 ? "" : "s"}</small>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
                </div>

                <div className="p-3">
                    {error && <div className="alert alert-danger py-2">{error}</div>}
                    {success && <div className="alert alert-success py-2">{success}</div>}

                    {items.length === 0 ? (
                        <div className="text-center py-5 text-muted">Select products to prepare an order.</div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Supplier</th>
                                            <th>Unit Price</th>
                                            <th style={{ width: 130 }}>Quantity</th>
                                            <th>Subtotal</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.productId}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                                                    <small style={{ color: "#6c757d" }}>
                                                        {item.category ?? "Uncategorized"} · Stock {item.stockLevel.toLocaleString()} {item.unitOfMeasure}
                                                    </small>
                                                </td>
                                                <td>{item.producerName}</td>
                                                <td>{money(item.unitPrice)}</td>
                                                <td>
                                                    <input
                                                        className="form-control form-control-sm"
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={(e) => onQuantityChange(item.productId, Number(e.target.value))}
                                                    />
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{money(item.unitPrice * item.quantity)}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => onRemoveItem(item.productId)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-3">
                                <label className="form-label" style={{ fontWeight: 600 }}>Order notes</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => onNotesChange(e.target.value)}
                                    placeholder="Any delivery instructions or notes for the seller"
                                />
                            </div>

                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <div>
                                    <div style={{ color: "#6c757d", fontSize: 13 }}>Order total</div>
                                    <div style={{ fontSize: 24, fontWeight: 700, color: "#0b3f88" }}>{money(total)}</div>
                                </div>
                                <button className="btn btn-primary px-4" disabled={submitting || items.length === 0} onClick={onSubmit}>
                                    {submitting ? "Sending..." : "Send Order"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderModal;
