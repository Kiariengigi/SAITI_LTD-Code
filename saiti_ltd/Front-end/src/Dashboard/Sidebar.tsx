// Sidebar.tsx
import type { Page } from "./Types.ts";
import type { JSX } from "react";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const NAV_ITEMS: { page: Page; label: string; icon: JSX.Element }[] = [
  {
    page: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    page: "customers",
    label: "Customers",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
  {
    page: "orders",
    label: "Orders",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    page: "inventory",
    label: "Inventory",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <line x1="12" y1="22" x2="12" y2="12" />
        <path d="m3.3 7 8.7 5 8.7-5" />
      </svg>
    ),
  },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <div
      className="d-flex flex-column"
      style={{
        width: 180,
        minHeight: "100vh",
        background: "#fff",
        borderRight: "1px solid #e8e8e8",
        flexShrink: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >

      {/* Nav items */}
      <nav className="flex-grow-1 py-2">
        {NAV_ITEMS.map(({ page, label, icon }) => {
          const isActive = activePage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className="d-flex align-items-center gap-2 w-100 border-0 px-3 py-2 text-start"
              style={{
                background: isActive ? "#111" : "transparent",
                color: isActive ? "#fff" : "#555",
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                transition: "all 0.15s",
                borderRadius: 0,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </nav>

      {/* Log Out */}
      <div className="px-3 py-3 border-top">
        <button
          className="d-flex align-items-center gap-2 w-100 border-0 bg-transparent text-start"
          style={{ fontSize: 12, color: "#999", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  );
}