export type Page = "dashboard" | "customers" | "inventory" | "orders";

export interface Product {
  id: string;
  name: string;
  productId: string;
  price: number;
  stock: number;
  type: string;
}

export interface Customer {
  id: string;
  name: string;
  location: string;
  lastOrderDate: string;
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock";
  totalBought: number;
}

export interface Order {
  id: string;
  orderDate: string;
  products: string;
  price: number;
  status: "New" | "Pending" | "Delivered";
}

export interface InventoryItem {
  id: string;
  product: string;
  quantity: number;
  price: number;
  lastOrdered: string;
  stockLevel: "In Stock" | "Low Stock" | "Out of Stock";
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

export const CUSTOMERS: Customer[] = [
  { id: "c1", name: "Wanjiku Builders", location: "Nairobi", lastOrderDate: "2026-03-10", stockStatus: "In Stock", totalBought: 4200 },
  { id: "c2", name: "Kamau Hardware", location: "Thika", lastOrderDate: "2026-03-08", stockStatus: "Low Stock", totalBought: 1850 },
  { id: "c3", name: "Omondi Supplies", location: "Kisumu", lastOrderDate: "2026-02-28", stockStatus: "Out of Stock", totalBought: 9300 },
  { id: "c4", name: "Akinyi Trading", location: "Mombasa", lastOrderDate: "2026-03-15", stockStatus: "In Stock", totalBought: 3100 },
  { id: "c5", name: "Njoroge & Sons", location: "Nakuru", lastOrderDate: "2026-03-01", stockStatus: "In Stock", totalBought: 7650 },
  { id: "c6", name: "Mutua Merchants", location: "Machakos", lastOrderDate: "2026-02-20", stockStatus: "Low Stock", totalBought: 2200 },
  { id: "c7", name: "Chebet Distributors", location: "Eldoret", lastOrderDate: "2026-03-12", stockStatus: "In Stock", totalBought: 5500 },
  { id: "c8", name: "Otieno Wholesale", location: "Nairobi", lastOrderDate: "2026-03-18", stockStatus: "In Stock", totalBought: 8800 },
];

export const ORDERS: Order[] = [
  { id: "ORD-001", orderDate: "2026-03-18", products: "Steel Pipes 2in", price: 4500, status: "New" },
  { id: "ORD-002", orderDate: "2026-03-17", products: "Cement 50kg x10", price: 8500, status: "Pending" },
  { id: "ORD-003", orderDate: "2026-03-15", products: "Iron Rods 12mm", price: 3200, status: "Delivered" },
  { id: "ORD-004", orderDate: "2026-03-14", products: "Gravel Mix", price: 9000, status: "Delivered" },
  { id: "ORD-005", orderDate: "2026-03-13", products: "Timber 2x4", price: 4500, status: "New" },
  { id: "ORD-006", orderDate: "2026-03-12", products: "Sand (1 tonne)", price: 1200, status: "Pending" },
  { id: "ORD-007", orderDate: "2026-03-11", products: "Steel Pipes 2in", price: 4500, status: "Delivered" },
  { id: "ORD-008", orderDate: "2026-03-10", products: "Cement 50kg x5", price: 4250, status: "Delivered" },
];

export const INVENTORY: InventoryItem[] = [
  { id: "i1", product: "Steel Pipes 2in", quantity: 15, price: 150, lastOrdered: "2026-03-10", stockLevel: "In Stock" },
  { id: "i2", product: "Cement 50kg",     quantity: 42, price: 850, lastOrdered: "2026-03-08", stockLevel: "In Stock" },
  { id: "i3", product: "Iron Rods 12mm",  quantity: 88, price: 320, lastOrdered: "2026-02-28", stockLevel: "In Stock" },
  { id: "i4", product: "Sand (1 tonne)",  quantity: 5,  price: 1200, lastOrdered: "2026-03-15", stockLevel: "Low Stock" },
  { id: "i5", product: "Gravel Mix",      quantity: 30, price: 900, lastOrdered: "2026-03-01", stockLevel: "In Stock" },
  { id: "i6", product: "Timber 2x4",      quantity: 3,  price: 450, lastOrdered: "2026-02-20", stockLevel: "Out of Stock" },
  { id: "i7", product: "Paint 20L",       quantity: 12, price: 2800, lastOrdered: "2026-03-12", stockLevel: "Low Stock" },
  { id: "i8", product: "PVC Pipes",       quantity: 60, price: 220, lastOrdered: "2026-03-18", stockLevel: "In Stock" },
];

export const PAGE_SIZE = 6;