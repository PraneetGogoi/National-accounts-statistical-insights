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
from api.routes import forecast

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

schema = strawberry.Schema(query=Query)
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

@app.on_event("startup")
async def startup():
    redis = aioredis.from_url("redis://localhost:6379", encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

@app.get("/")
def read_root():
    return {"message": "NAS Backend is running"}
