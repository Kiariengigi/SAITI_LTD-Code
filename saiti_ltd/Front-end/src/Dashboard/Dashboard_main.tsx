// App.tsx
import { useState } from "react";
import type { Page } from "./Types";
import Sidebar        from "./Sidebar";
import Header from "../User_Profile/Header";
import DashboardPage  from "./Dashboardpage";
import CustomersPage  from "./Customerspage";
import OrdersPage     from "./Orderspage";
import InventoryPage  from "./Inventorypage";

function PageContent({ page }: { page: Page }) {
  switch (page) {
    case "dashboard": return <DashboardPage />;
    case "customers": return <CustomersPage />;
    case "orders":    return <OrdersPage />;
    case "inventory": return <InventoryPage />;
  }
}

export default function Dashboard_main() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <>
      {/* Bootstrap 5 CDN */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
        crossOrigin="anonymous"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { height: 100%; margin: 0; padding: 0; }
        body { background: #f5f5f5; font-family: 'DM Sans', sans-serif; }

        /* Tighten Bootstrap table */
        .table > :not(caption) > * > * { padding: 0.4rem 0.75rem; }

        /* Override active page-link */
        .page-item.active .page-link {
          background-color: #111 !important;
          border-color: #111 !important;
          color: #fff !important;
        }

        /* Subtle hover */
        .table-hover > tbody > tr:hover > * {
          --bs-table-bg-state: rgba(0,0,0,0.02);
        }

        /* Smooth page transitions */
        .page-fade {
          animation: fadeIn 0.18s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="d-flex" style={{ height: "100vh", overflow: "hidden" }}>
        {/* Sidebar */}
        <Sidebar activePage={page} onNavigate={setPage} />

        {/* Main area */}
        <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0, overflow: "hidden" }}>
          <Header/>

          <div className="flex-grow-1 overflow-auto page-fade" key={page}>
            <PageContent page={page} />
          </div>
        </div>
      </div>
    </>
  );
}