-- backend/db/init/schema.sql

-- 1. Ingestion Audit Log
CREATE TABLE IF NOT EXISTS ingestion_audit_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rows_processed INTEGER NOT NULL,
    source_file_hash VARCHAR(64),
    success BOOLEAN NOT NULL,
    error_message TEXT
);

-- 2. NAS Data Revisions (Snapshot/Versioning)
CREATE TABLE IF NOT EXISTS nas_data_revisions (
    revision_id SERIAL PRIMARY KEY,
    revision_name VARCHAR(100) NOT NULL, -- e.g., "MoSPI 2024-Q1 Release"
    release_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. NAS Data (Main table)
CREATE TABLE IF NOT EXISTS nas_data (
    id SERIAL PRIMARY KEY,
    revision_id INTEGER REFERENCES nas_data_revisions(revision_id),
    source_run_id INTEGER REFERENCES ingestion_audit_log(id),
    base_year VARCHAR(20),
    series VARCHAR(50),
    year VARCHAR(20),
    year_int INTEGER,
    indicator VARCHAR(100),
    frequency VARCHAR(20),
    industry VARCHAR(200),
    subindustry VARCHAR(200),
    institutional_sector VARCHAR(200),
    quarter VARCHAR(10),
    current_price NUMERIC,
    constant_price NUMERIC,
    unit VARCHAR(50),
    is_anomaly BOOLEAN DEFAULT FALSE,
    flagged_for_review BOOLEAN DEFAULT FALSE,
    anomaly_score NUMERIC
);

-- Indexes for performance on aggregate queries
CREATE INDEX idx_nas_data_indicator ON nas_data(indicator);
CREATE INDEX idx_nas_data_year_int ON nas_data(year_int);
CREATE INDEX idx_nas_data_industry ON nas_data(industry);
CREATE INDEX idx_nas_data_revision ON nas_data(revision_id);
