from functools import lru_cache
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


def make_payload(customer_id: str, top_n: int) -> dict[str, Any]:
    model, feature_cols, features, capacity, orders, _dataset = get_artefacts()
    candidates = get_customer_candidates(customer_id, features, capacity, orders, feature_cols)
    scored = score_candidates(model, candidates, feature_cols)
    return build_ml_payload(customer_id, scored, orders, top_n=top_n)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


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
