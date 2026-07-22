from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import strawberry
from strawberry.fastapi import GraphQLRouter
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
from redis import asyncio as aioredis
from typing import List, Optional

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.database import SessionLocal, NasData
from api.routes import forecast, anomalies
import json
import datetime

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
        # A simple resolver to fetch GDP data
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

@strawberry.type
class Subscription:
    @strawberry.subscription
    async def live_ledger_feed(self) -> strawberry.AsyncGenerator[str, None]:
        import asyncio
        from redis import asyncio as aioredis
        r = aioredis.from_url("redis://localhost:6379", decode_responses=True)
        pubsub = r.pubsub()
        await pubsub.subscribe("ledger_feed")
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield message["data"]
        finally:
            await pubsub.unsubscribe("ledger_feed")
            await r.aclose()

schema = strawberry.Schema(query=Query, subscription=Subscription)
graphql_app = GraphQLRouter(schema)

# ----------------- FASTAPI APP -----------------
app = FastAPI(title="NAS Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graphql_app, prefix="/graphql")
app.include_router(forecast.router, prefix="/api/forecast", tags=["forecast"])
app.include_router(anomalies.router, prefix="/api/anomalies", tags=["anomalies"])

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost:6379", encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

@app.get("/")
def read_root():
    return {"message": "NAS Backend is running"}

@app.get("/health")
def health_check():
    health_status = {"status": "ok", "postgres": "ok", "redis": "ok", "prophet_model": "ok"}
    
    # Check Postgres
    db = SessionLocal()
    try:
        db.execute("SELECT 1")
    except Exception as e:
        health_status["postgres"] = f"error: {str(e)}"
        health_status["status"] = "error"
    finally:
        db.close()
        
    # Check Redis
    try:
        r = aioredis.from_url("redis://localhost:6379", decode_responses=True)
        # Note: aioredis from_url is lazy, need to ping but we're in sync route so we skip full ping here for simplicity
        # or use sync redis
        import redis as sync_redis
        sr = sync_redis.Redis(host='localhost', port=6379)
        sr.ping()
    except Exception as e:
        health_status["redis"] = f"error: {str(e)}"
        health_status["status"] = "error"
        
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
