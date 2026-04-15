// Products_Page/ProductCard.tsx
// ================================================================
// Now accepts real product fields from the API.
// ================================================================

import React from "react";

interface ProductCardProps {
    id?:            string;
    name?:          string;
    price?:         number;
    category?:      string;
    unitOfMeasure?: string;
    stockLevel?:    number;
    producerName?:  string;
    isActive?:      boolean;
    image?:         React.ReactNode;
    isEmpty?:       boolean;
    isSelected?:    boolean;
    onToggleSelect?: (nextSelected: boolean) => void;
}

// Generic box icon when no product image
const BoxIcon: React.FC<{ category?: string }> = ({ category }) => {
    const color = category === "Beverages"   ? "#0050c8"
               : category === "Dairy"        ? "#20c997"
               : category === "Fresh Produce" ? "#28a745"
               : "#6c757d";
    return (
        <svg viewBox="0 0 40 50" width="40" height="50" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="15" width="30" height="28" rx="3" fill={color} opacity="0.15" />
            <rect x="5" y="15" width="30" height="28" rx="3" fill="none" stroke={color} strokeWidth="1.5" />
            <rect x="5" y="15" width="30" height="9"  rx="3" fill={color} opacity="0.3" />
            <line x1="20" y1="15" x2="20" y2="43" stroke={color} strokeWidth="1" opacity="0.5" />
            <rect x="14" y="5"  width="12" height="12" rx="2" fill={color} opacity="0.8" />
        </svg>
    );
};

const ProductCard: React.FC<ProductCardProps> = ({
    name,
    price,
    category,
    unitOfMeasure,
    stockLevel,
    producerName,
    isActive = true,
    image,
    isEmpty = false,
    isSelected = false,
    onToggleSelect,
}) => {
    if (isEmpty) {
        return (
            <div style={{
                border:    "1.5px solid #e9ecef",
                borderRadius: 12,
                background: "#fff",
                minHeight: 90,
                height:    "100%",
            }} />
        );
    }

    const isLowStock = stockLevel !== undefined && stockLevel > 0 && stockLevel <= 10;
    const isOutOfStock = stockLevel !== undefined && stockLevel === 0;

    return (
        <div
            className="card border-0 position-relative"
            style={{
                borderRadius: 12,
                boxShadow:   "0 1px 6px rgba(0,0,0,0.07)",
                padding:     "10px 8px 8px",
                cursor:      "pointer",
                transition:  "box-shadow 0.2s",
                minHeight:   120,
                background:  isActive ? "#fff" : "#f8f9fa",
                opacity:     isActive ? 1 : 0.7,
                outline:     isSelected ? "2px solid #0050c8" : "none",
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,80,200,0.13)";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 6px rgba(0,0,0,0.07)";
            }}
        >
            {/* Stock status badge */}
            {(isLowStock || isOutOfStock) && (
                <span
                    className="badge position-absolute"
                    style={{
                        top:        6,
                        left:       6,
                        fontSize:  "0.55rem",
                        background: isOutOfStock ? "#dc3545" : "#fd7e14",
                        padding:   "2px 5px",
                    }}
                >
                    {isOutOfStock ? "Out of stock" : "Low stock"}
                </span>
            )}

            {/* Product image */}
            <div className="d-flex justify-content-center mb-1">
                {image || <BoxIcon category={category} />}
            </div>

            {/* Supplier name */}
            {producerName && (
                <div style={{ fontSize: "0.58rem", color: "#adb5bd", textAlign: "center", lineHeight: 1.2 }}>
                    {producerName}
                </div>
            )}

            {/* Product name */}
            {name && (
                <div style={{
                    fontSize:  "0.65rem",
                    color:     "#1a1a2e",
                    fontWeight: 600,
                    textAlign: "center",
                    lineHeight: 1.3,
                    marginTop: 2,
                }}>
                    {name}
                </div>
            )}

            {/* Price */}
            {price !== undefined && (
                <div style={{ fontSize: "0.65rem", color: "#6c757d", textAlign: "center", marginTop: 2 }}>
                    KSH {price.toLocaleString()}
                    {unitOfMeasure && unitOfMeasure !== "unit" && (
                        <span style={{ color: "#adb5bd" }}> / {unitOfMeasure}</span>
                    )}
                </div>
            )}

            {/* Exact stock level */}
            {stockLevel !== undefined && (
                <div style={{ fontSize: "0.62rem", color: "#495057", textAlign: "center", marginTop: 2 }}>
                    Stock: <strong>{stockLevel.toLocaleString()}</strong>
                    {unitOfMeasure ? ` ${unitOfMeasure}` : ""}
                </div>
            )}

            {/* Add to order button */}
            <button
                className="btn position-absolute"
                disabled={isOutOfStock}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect?.(!isSelected);
                }}
                style={{
                    bottom:       6,
                    right:        6,
                    width:        22,
                    height:       22,
                    padding:      0,
                    borderRadius: "50%",
                    background:   isOutOfStock ? "#dee2e6" : isSelected ? "#0050c8" : "#f1f3f5",
                    border:       "none",
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "center",
                    fontSize:     "1rem",
                    fontWeight:   700,
                    color:        isOutOfStock ? "#adb5bd" : isSelected ? "white" : "#495057",
                    lineHeight:   1,
                    transition:   "all 0.2s",
                    cursor:       isOutOfStock ? "not-allowed" : "pointer",
                }}
                aria-label={isSelected ? "Remove from order" : "Add to order"}
            >
                {isSelected ? "✓" : "+"}
            </button>
        </div>
    );
};

export default ProductCard;