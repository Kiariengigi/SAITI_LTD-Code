// PaginatedTable.tsx
import { useState } from "react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface PaginatedTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchKeys?: (keyof T)[];
}

export default function PaginatedTable<T extends { id: string }>({
  columns,
  data,
  pageSize = 6,
  searchKeys = [],
}: PaginatedTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);

  const filtered = search
    ? data.filter((row) =>
        searchKeys.some((k) =>
          String(row[k]).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const visiblePages = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1, 2];
    if (page > 4) pages.push("...");
    const start = Math.max(3, page - 1);
    const end   = Math.min(totalPages - 2, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 3) pages.push("...");
    pages.push(totalPages - 1, totalPages);
    return pages;
  };

  return (
    <div className="d-flex flex-column h-100">
      {/* Table */}
      <div className="flex-grow-1 overflow-auto">
        <table className="table table-hover align-middle mb-0" style={{ fontSize: 12 }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="fw-semibold border-bottom py-2 px-3"
                  style={{ fontSize: 11, color: "#555", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr
                key={row.id}
                style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="py-2 px-3 border-bottom" style={{ color: "#333" }}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-4" style={{ fontSize: 12 }}>
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 py-2 border-top bg-white"
        style={{ flexShrink: 0 }}
      >
        {/* Search */}
        <div className="input-group" style={{ maxWidth: 200 }}>
          <span
            className="input-group-text bg-white border-end-0 py-1"
            style={{ borderRadius: "20px 0 0 20px", fontSize: 11 }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="form-control border-start-0 py-1"
            placeholder="Search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              borderRadius: "0 20px 20px 0",
              fontSize: 11,
              background: "#fafafa",
              boxShadow: "none",
            }}
          />
        </div>

        {/* Pagination */}
        <nav>
          <ul className="pagination pagination-sm mb-0 gap-1" style={{ fontSize: 10 }}>
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button
                className="page-link border rounded-2 py-1 px-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", color: "#444" }}
              >
                ‹ Previous
              </button>
            </li>
            {visiblePages().map((p, i) =>
              p === "..." ? (
                <li key={`e${i}`} className="page-item disabled">
                  <span className="page-link border-0 bg-transparent py-1 px-1" style={{ fontSize: 10, color: "#bbb" }}>…</span>
                </li>
              ) : (
                <li key={p} className="page-item">
                  <button
                    className="page-link border rounded-2 py-1 px-2"
                    onClick={() => setPage(p as number)}
                    style={{
                      fontSize: 10,
                      fontFamily: "'DM Mono', monospace",
                      background: page === p ? "#111" : undefined,
                      borderColor: page === p ? "#111" : undefined,
                      color: page === p ? "#fff" : "#555",
                      minWidth: 28,
                      textAlign: "center",
                    }}
                  >
                    {String(p as number).padStart(2, "0")}
                  </button>
                </li>
              )
            )}
            <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
              <button
                className="page-link border rounded-2 py-1 px-2"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", color: "#444" }}
              >
                Next ›
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}