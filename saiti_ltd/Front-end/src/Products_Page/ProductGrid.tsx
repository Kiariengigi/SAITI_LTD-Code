// Products_Page/ProductGrid.tsx
// ================================================================
// Receives real products from Products_main, renders grid with
// filter sidebar, search, sort, pagination, loading & error states.
// ================================================================

import React from "react";
import ProductCard from "./ProductCard";
import FilterSidebar from "./Filter";
import type { ProductItem, ProductsResponse, ProductFilters, SelectedOrderItem } from "./Products_main";

interface ProductGridProps {
    productsData:   ProductsResponse;
    loading:        boolean;
    error:          string | null;
    filters:        ProductFilters;
    selectedItems:  Record<string, SelectedOrderItem>;
    onFilterChange: (patch: Partial<ProductFilters>) => void;
    onPageChange:   (page: number) => void;
    onRetry:        () => void;
    onOpenOrderModal: () => void;
    onToggleProductSelect: (product: ProductItem, selected: boolean) => void;
}

// Skeleton card shown while loading
const SkeletonCard: React.FC = () => (
    <div
        style={{
            border: "1.5px solid #e9ecef",
            borderRadius: 12,
            background: "#fff",
            minHeight: 110,
            overflow: "hidden",
            position: "relative",
        }}
    >
        <div
            style={{
                position:   "absolute",
                inset:       0,
                background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
                animation:  "shimmer 1.4s infinite",
            }}
        />
        <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
    </div>
);

const ProductGrid: React.FC<ProductGridProps> = ({
    productsData,
    loading,
    error,
    filters,
    selectedItems,
    onFilterChange,
    onPageChange,
    onRetry,
    onOpenOrderModal,
    onToggleProductSelect,
}) => {
    const { products, total, totalPages, categories } = productsData;
    const selectedCount = Object.keys(selectedItems).length;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ search: e.target.value });
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const [sortBy, order] = e.target.value.split(":");
        onFilterChange({ sortBy, order: order as "asc" | "desc" });
    };

    return (
        <div className="px-3 py-3">
            {/* ── Toolbar ─────────────────────────────────────────── */}
            <div
                className="d-flex flex-wrap align-items-center gap-2 mb-3"
                style={{ justifyContent: "space-between" }}
            >
                {/* Search */}
                <div className="input-group" style={{ maxWidth: 280 }}>
                    <span
                        className="input-group-text bg-white border-end-0"
                        style={{ borderRadius: "24px 0 0 24px" }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search products…"
                        value={filters.search}
                        onChange={handleSearchChange}
                        style={{ borderRadius: "0 24px 24px 0", fontSize: 13, background: "#fafafa", boxShadow: "none" }}
                    />
                </div>

                {/* Sort */}
                <select
                    className="form-select"
                    style={{ maxWidth: 200, fontSize: 13, borderRadius: 24 }}
                    value={`${filters.sortBy}:${filters.order}`}
                    onChange={handleSortChange}
                >
                    <option value="createdAt:desc">Newest first</option>
                    <option value="createdAt:asc">Oldest first</option>
                    <option value="price:asc">Price: low → high</option>
                    <option value="price:desc">Price: high → low</option>
                    <option value="name:asc">Name: A → Z</option>
                </select>

                {/* Result count */}
                <span style={{ fontSize: 12, color: "#6c757d" }}>
                    {loading ? "Loading…" : `${total.toLocaleString()} product${total !== 1 ? "s" : ""}`}
                </span>

                {/* Selected order button */}
                <button
                    className={`btn btn-sm ${selectedCount > 0 ? "btn-primary" : "btn-outline-secondary"}`}
                    disabled={selectedCount === 0}
                    onClick={onOpenOrderModal}
                >
                    Order ({selectedCount})
                </button>
            </div>

            {/* ── Body ────────────────────────────────────────────── */}
            <div className="d-flex gap-3" style={{ alignItems: "flex-start" }}>
                {/* Filter sidebar — passes real categories */}
                <FilterSidebar
                    categories={categories}
                    selectedCategory={filters.category}
                    onCategoryChange={(cat) => onFilterChange({ category: cat })}
                />

                <div style={{ flex: 1 }}>
                    {/* Error state */}
                    {error && !loading && (
                        <div className="alert alert-danger d-flex align-items-center gap-3">
                            <span>{error}</span>
                            <button className="btn btn-sm btn-outline-danger ms-auto" onClick={onRetry}>
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Loading skeletons */}
                    {loading && (
                        <div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(4, 1fr)", display: "grid" }}>
                            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !error && products.length === 0 && (
                        <div className="text-center py-5 text-muted">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                                stroke="#ced4da" strokeWidth="1.5" className="mb-3 d-block mx-auto">
                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                            <p style={{ fontSize: 14 }}>
                                {filters.search || filters.category
                                    ? "No products match your filters."
                                    : "No products available yet."}
                            </p>
                            {(filters.search || filters.category) && (
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => onFilterChange({ search: "", category: "" })}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Product grid */}
                    {!loading && !error && products.length > 0 && (
                        <div className="d-grid gap-2" style={{ gridTemplateColumns: "repeat(4, 1fr)", display: "grid" }}>
                            {products.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    id={p.id}
                                    name={p.productName}
                                    price={parseFloat(p.price)}
                                    category={p.category ?? undefined}
                                    unitOfMeasure={p.unitOfMeasure}
                                    stockLevel={parseFloat(p.currentStockLevel)}
                                    producerName={p.producer?.companyName}
                                    isActive={p.isActive}
                                    isSelected={Boolean(selectedItems[p.id])}
                                    onToggleSelect={(selected) => onToggleProductSelect(p, selected)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="d-flex justify-content-center align-items-center gap-2 mt-4">
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                disabled={filters.page <= 1}
                                onClick={() => onPageChange(filters.page - 1)}
                            >
                                ← Prev
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === totalPages || Math.abs(p - filters.page) <= 2)
                                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) =>
                                    p === "..." ? (
                                        <span key={`dot-${i}`} style={{ fontSize: 13, color: "#adb5bd" }}>…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            className={`btn btn-sm ${p === filters.page ? "btn-dark" : "btn-outline-secondary"}`}
                                            onClick={() => onPageChange(p as number)}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}

                            <button
                                className="btn btn-sm btn-outline-secondary"
                                disabled={filters.page >= totalPages}
                                onClick={() => onPageChange(filters.page + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;