# NAS Insights Backend

This backend implements advanced ML and Data Engineering features for the National Accounts Statistical Insights project.

## Features Included:
- **FastAPI**: High-performance async API server.
- **PostgreSQL & Redis**: Containerized database and caching layer.
- **Data Provenance**: Ingestion scripts with audit logs (`ingestion_audit_log`) and data versioning (`nas_data_revisions`).
- **Anomaly Detection**: Flags statistically unusual jumps/drops during ingestion using Z-score/IQR.
- **Forecasting**: `/api/forecast/gdp` uses Prophet to project future GDP based on historical trends.
- **GraphQL**: A Strawberry GraphQL layer `/graphql` for flexible data fetching.
- **Caching**: `fastapi-cache2` wraps expensive aggregate queries with Redis.

## How to run locally

### 1. Start the Databases
Ensure you have Docker and Docker Compose installed.
From the root of the project, run:
```bash
docker-compose up -d
```
This starts PostgreSQL and Redis. The Postgres initialization script (`db/init/schema.sql`) will automatically create the required schemas.

### 2. Setup Python Environment
Navigate to the `backend` directory and set up a virtual environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run the ETL Ingestion (with Anomaly Detection)
Before the API can serve data, you must ingest the raw CSV data into PostgreSQL:
```bash
python etl/ingest.py
```
*Note: This will parse `public/data/nas_data.csv`, run anomaly detection, and insert the rows into the database along with an audit log.*

### 4. Start the API Server
```bash
uvicorn api.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
- **Swagger Docs**: `http://localhost:8000/docs`
- **GraphQL Playground**: `http://localhost:8000/graphql`
