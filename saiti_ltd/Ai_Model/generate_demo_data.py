from __future__ import annotations

from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
PROC_DIR = BASE_DIR / "Datasets" / "data" / "processed"
PROC_DIR.mkdir(parents=True, exist_ok=True)


FEATURE_COLUMNS = [
    "total_orders",
    "avg_order_qty",
    "std_order_qty",
    "avg_reorder_cycle_days",
    "std_reorder_cycle_days",
    "reorder_cv",
    "reorder_rate",
    "purchase_frequency_rate",
    "recency_score",
    "qty_trend",
    "is_habitual",
    "total_revenue",
    "avg_unit_price",
    "customer_total_spend",
    "atp_cover_days",
    "supply_risk_score",
    "low_stock_flag",
    "sku_total_orders",
    "sku_reorder_rate",
    "sku_popularity_rank",
    "source_id",
]


def build_feature_rows(customer_id: str, source_id: int, prefix: str) -> pd.DataFrame:
    rows = []
    sku_specs = [
        (f"{prefix}-SKU-1", "Oranges", 9.0, 2.0, 14.0, 1, 0.88, 1),
        (f"{prefix}-SKU-2", "Apples", 7.0, 1.0, 21.0, 0, 0.72, 2),
        (f"{prefix}-SKU-3", "Bananas", 6.0, 1.5, 10.0, 1, 0.67, 3),
    ]

    for sku, product_name, avg_qty, qty_trend, cover_days, low_stock_flag, risk_score, rank in sku_specs:
        rows.append(
            {
                "customer_id": customer_id,
                "sku": sku,
                "product_name": product_name,
                "total_orders": 6,
                "avg_order_qty": avg_qty,
                "std_order_qty": 0.75,
                "avg_reorder_cycle_days": 12.0,
                "std_reorder_cycle_days": 2.0,
                "reorder_cv": 0.32,
                "reorder_rate": 0.78,
                "purchase_frequency_rate": 0.61,
                "recency_score": 0.84,
                "qty_trend": qty_trend,
                "is_habitual": 1,
                "total_revenue": round(avg_qty * 3.4 * 6, 2),
                "avg_unit_price": 3.4,
                "customer_total_spend": 169.36,
                "atp_cover_days": cover_days,
                "supply_risk_score": risk_score,
                "low_stock_flag": low_stock_flag,
                "sku_total_orders": 42 - rank * 3,
                "sku_reorder_rate": 0.7 + (0.02 * (3 - rank)),
                "sku_popularity_rank": rank,
                "source_id": source_id,
            }
        )

    return pd.DataFrame(rows)


def build_capacity_rows(feature_rows: pd.DataFrame) -> pd.DataFrame:
    return feature_rows[["sku", "atp_cover_days", "supply_risk_score", "low_stock_flag"]].drop_duplicates().copy()


def build_order_rows(customer_id: str, feature_rows: pd.DataFrame) -> pd.DataFrame:
    order_dates = pd.date_range("2026-03-01", periods=len(feature_rows), freq="7D")
    rows = []
    for index, (_, row) in enumerate(feature_rows.iterrows()):
        rows.append(
            {
                "customer_id": customer_id,
                "sku": row["sku"],
                "product_name": row["product_name"],
                "order_date": order_dates[index].date().isoformat(),
                "quantity": int(round(row["avg_order_qty"])),
            }
        )
    return pd.DataFrame(rows)


def save_dataset(dataset_prefix: str, customer_ids: list[str], source_id: int) -> None:
    feature_frames = [build_feature_rows(customer_id, source_id, dataset_prefix) for customer_id in customer_ids]
    features = pd.concat(feature_frames, ignore_index=True)
    capacity = build_capacity_rows(features)
    orders = pd.concat([build_order_rows(customer_id, features[features["customer_id"] == customer_id]) for customer_id in customer_ids], ignore_index=True)

    features.to_parquet(PROC_DIR / f"{dataset_prefix}_features.parquet", index=False)
    capacity.to_parquet(PROC_DIR / f"{dataset_prefix}_capacity.parquet", index=False)
    orders.to_parquet(PROC_DIR / f"{dataset_prefix}_orders_clean.parquet", index=False)


def main() -> None:
    demo_customer_ids = [
        "f0400482-67fb-4ea1-a847-eaa74c48f795",
        "12346",
    ]

    save_dataset("retail", demo_customer_ids, source_id=0)
    save_dataset("instacart", demo_customer_ids, source_id=1)


if __name__ == "__main__":
    main()