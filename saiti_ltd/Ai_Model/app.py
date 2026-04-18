from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from Inference import (
    build_ml_payload,
    get_customer_candidates,
    load_artefacts,
    score_candidates,
)
from llm_recommendation import generate_recommendation


app = FastAPI(title="SAITI AI Model Service", version="1.0.0")
BASE_DIR = Path(__file__).resolve().parent
PROC_DIR = BASE_DIR / "Datasets" / "data" / "processed"
REQUIRED_DATA_FILES = (
    "retail_features.parquet",
    "retail_capacity.parquet",
    "retail_orders_clean.parquet",
    "instacart_features.parquet",
    "instacart_capacity.parquet",
    "instacart_orders_clean.parquet",
)


class PayloadRequest(BaseModel):
    customer_id: str
    top_n: int = Field(default=5, ge=1, le=50)


class RecommendationRequest(BaseModel):
    customer_id: Optional[str] = None
    top_n: int = Field(default=5, ge=1, le=50)
    payload: Optional[dict[str, Any]] = None


@lru_cache(maxsize=1)
def get_artefacts():
    return load_artefacts()


def _has_artefacts() -> bool:
    return any((PROC_DIR / name).exists() for name in REQUIRED_DATA_FILES)


def _placeholder_payload(customer_id: str, top_n: int, reason: str) -> dict[str, Any]:
    return {
        "generated_at": "",
        "customer_id": str(customer_id),
        "account_context": {
            "total_distinct_skus_ordered": 0,
            "total_customer_orders": 0,
            "customer_total_spend": 0.0,
            "avg_days_between_orders": 0.0,
        },
        "order_history_sample": [],
        "ml_recommendations": [],
        "capacity_summary": {
            "skus_with_low_stock": 0,
            "skus_with_high_supply_risk": 0,
        },
        "business_rules": {
            "minimum_order_value": 0,
            "blocked_skus": [],
        },
        "_degraded": True,
        "_error": reason,
        "_requested_top_n": top_n,
    }


def make_payload(customer_id: str, top_n: int) -> dict[str, Any]:
    if not _has_artefacts():
        return _placeholder_payload(
            customer_id,
            top_n,
            "Processed parquet files are not bundled in this deployment.",
        )

    model, feature_cols, features, capacity, orders, _dataset = get_artefacts()
    candidates = get_customer_candidates(customer_id, features, capacity, orders, feature_cols)
    scored = score_candidates(model, candidates, feature_cols)
    return build_ml_payload(customer_id, scored, orders, top_n=top_n)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready")
def ready() -> dict[str, Any]:
    return {
        "status": "ready" if _has_artefacts() else "degraded",
        "artefacts_present": _has_artefacts(),
        "processed_data_dir": str(PROC_DIR),
    }


@app.post("/ml/payload")
def ml_payload(req: PayloadRequest) -> dict[str, Any]:
    try:
        return make_payload(req.customer_id, req.top_n)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/ml/recommendation")
def ml_recommendation(req: RecommendationRequest) -> dict[str, Any]:
    try:
        payload = req.payload
        if payload is None:
            if not req.customer_id:
                raise ValueError("Provide either payload or customer_id")
            payload = make_payload(req.customer_id, req.top_n)

        return generate_recommendation(payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
