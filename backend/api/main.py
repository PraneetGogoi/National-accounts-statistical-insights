from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import strawberry
from strawberry.fastapi import GraphQLRouter
from typing import List, Optional
import asyncio

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.database import SessionLocal, NasData, IngestionAuditLog
from api.routes import forecast, anomalies
import json
import datetime

# Global Memory Queue for Pub/Sub
ledger_feed_queue = asyncio.Queue()

# ----------------- GRAPHQL SCHEMA -----------------
@strawberry.type
class NasRecordType:
    id: int
    year: str
    year_int: int
    indicator: str
    frequency: str
    industry: Optional[str]
    current_price: float
    constant_price: float
    unit: str
    is_anomaly: bool

@strawberry.type
class Query:
    @strawberry.field
    def get_kpi_summary(self) -> List[NasRecordType]:
        db = SessionLocal()
        try:
            records = db.query(NasData).filter(
                NasData.indicator == 'Gross Domestic Product',
                NasData.frequency == 'Annual',
                NasData.base_year == '2011-12'
            ).all()
            return [
                NasRecordType(
                    id=r.id, year=r.year, year_int=r.year_int, indicator=r.indicator,
                    frequency=r.frequency, industry=r.industry,
                    current_price=float(r.current_price or 0),
                    constant_price=float(r.constant_price or 0),
                    unit=r.unit, is_anomaly=r.is_anomaly
                ) for r in records
            ]
        finally:
            db.close()

from typing import List, Optional, AsyncGenerator

@strawberry.type
class Subscription:
    @strawberry.subscription
    async def live_ledger_feed(self) -> AsyncGenerator[str, None]:
        while True:
            message = await ledger_feed_queue.get()
            yield message

schema = strawberry.Schema(query=Query, subscription=Subscription)
graphql_app = GraphQLRouter(schema)

# ----------------- FASTAPI APP -----------------
app = FastAPI(title="NAS Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graphql_app, prefix="/graphql")
app.include_router(forecast.router, prefix="/api/forecast", tags=["forecast"])
app.include_router(anomalies.router, prefix="/api/anomalies", tags=["anomalies"])

@app.post("/api/internal/publish")
async def publish_message(request: Request):
    data = await request.json()
    if 'message' in data:
        await ledger_feed_queue.put(data['message'])
    return {"status": "published"}

@app.get("/")
def read_root():
    return {"message": "NAS Backend is running (SQLite)"}

@app.get("/api/data/status")
def get_data_status():
    db = SessionLocal()
    try:
        latest = db.query(IngestionAuditLog).order_by(IngestionAuditLog.timestamp.desc()).first()
        if not latest:
            return {"status": "No data ingested yet."}
        return {
            "id": latest.id,
            "timestamp": latest.timestamp.isoformat() if latest.timestamp else None,
            "rows_processed": latest.rows_processed,
            "success": latest.success,
            "source_file_hash": latest.source_file_hash,
        }
    finally:
        db.close()

@app.get("/api/data/all")
def get_all_data():
    db = SessionLocal()
    try:
        # Join with IngestionAuditLog to get provenance
        results = db.query(NasData, IngestionAuditLog).outerjoin(
            IngestionAuditLog, NasData.source_run_id == IngestionAuditLog.id
        ).all()
        
        data = []
        for row, audit in results:
            data.append({
                "base_year": row.base_year,
                "series": row.series,
                "year": row.year,
                "year_int": row.year_int,
                "indicator": row.indicator,
                "frequency": row.frequency,
                "industry": row.industry,
                "quarter": row.quarter,
                "current_price": float(row.current_price) if row.current_price is not None else 0.0,
                "constant_price": float(row.constant_price) if row.constant_price is not None else 0.0,
                "unit": row.unit,
                "is_anomaly": row.is_anomaly,
                "flagged_for_review": row.flagged_for_review,
                "source_run_id": row.source_run_id,
                "ingestion_timestamp": audit.timestamp.isoformat() if audit and audit.timestamp else None,
                "source_file_hash": audit.source_file_hash if audit else None,
            })
        return data
    finally:
        db.close()

@app.get("/health")
def health_check():
    health_status = {"status": "ok", "database": "ok", "prophet_model": "ok"}
    
    # Check SQLite
    db = SessionLocal()
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"
        health_status["status"] = "error"
    finally:
        db.close()
        
    # Check Prophet
    from api.routes.forecast import META_PATH
    try:
        if os.path.exists(META_PATH):
            with open(META_PATH, 'r') as f:
                meta = json.load(f)
                health_status["prophet_model"] = f"last_trained: {meta.get('last_trained')}"
        else:
            health_status["prophet_model"] = "not_trained"
    except Exception as e:
        health_status["prophet_model"] = f"error: {str(e)}"
        
    return health_status
