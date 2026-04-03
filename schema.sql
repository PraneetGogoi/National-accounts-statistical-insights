-- ============================================================
--  India National Accounts Statistics (NAS) — PostgreSQL Schema
--  Source: MoSPI — Merged Annual + Quarterly Dataset
--  Compatible with: PostgreSQL 14+
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- for ILIKE fast search
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ─── Schema ─────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS nas;
SET search_path TO nas, public;

-- ============================================================
-- 1.  DIMENSION TABLES
-- ============================================================

-- 1.1 Base Year
CREATE TABLE dim_base_year (
    base_year_id   SERIAL PRIMARY KEY,
    base_year      VARCHAR(10)  NOT NULL UNIQUE,   -- e.g. '2011-12', '2022-23'
    description    TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Indicator
CREATE TABLE dim_indicator (
    indicator_id   SERIAL PRIMARY KEY,
    indicator_name VARCHAR(120) NOT NULL UNIQUE,
    category       VARCHAR(60),   -- 'Output', 'Expenditure', 'Income', 'GrowthRate'
    is_growth_rate BOOLEAN DEFAULT FALSE,
    unit_default   VARCHAR(20),   -- '₹ Crore' or '%'
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Industry
CREATE TABLE dim_industry (
    industry_id    SERIAL PRIMARY KEY,
    industry_name  VARCHAR(120) NOT NULL UNIQUE,
    sector         VARCHAR(60),   -- 'Primary', 'Secondary', 'Tertiary'
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 Sub-industry
CREATE TABLE dim_subindustry (
    subindustry_id   SERIAL PRIMARY KEY,
    subindustry_name VARCHAR(120) NOT NULL,
    industry_id      INT REFERENCES dim_industry(industry_id),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (subindustry_name, industry_id)
);

-- 1.5 Institutional Sector
CREATE TABLE dim_institutional_sector (
    sector_id    SERIAL PRIMARY KEY,
    sector_name  VARCHAR(100) NOT NULL UNIQUE,
    sector_type  VARCHAR(30),  -- 'Public', 'Private', 'Household', 'Rest of World'
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Revision Type
CREATE TABLE dim_revision (
    revision_id    SERIAL PRIMARY KEY,
    revision_name  VARCHAR(60) NOT NULL UNIQUE,
    revision_order INT,   -- 1=First Advance, 2=Second Advance ... 8=Final
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2.  FACT TABLES
-- ============================================================

-- 2.1 Annual Estimates (main fact table)
CREATE TABLE fact_annual (
    annual_id           BIGSERIAL PRIMARY KEY,
    base_year_id        INT NOT NULL REFERENCES dim_base_year(base_year_id),
    indicator_id        INT NOT NULL REFERENCES dim_indicator(indicator_id),
    industry_id         INT REFERENCES dim_industry(industry_id),
    subindustry_id      INT REFERENCES dim_subindustry(subindustry_id),
    sector_id           INT REFERENCES dim_institutional_sector(sector_id),
    revision_id         INT REFERENCES dim_revision(revision_id),
    fiscal_year         VARCHAR(10) NOT NULL,   -- '2022-23'
    fiscal_year_int     SMALLINT    NOT NULL,   -- 2022  (start year)
    series              VARCHAR(20) DEFAULT 'Current',
    current_price       NUMERIC(18,4),
    constant_price      NUMERIC(18,4),
    unit                VARCHAR(20),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_annual_fy         ON fact_annual(fiscal_year_int);
CREATE INDEX idx_annual_indicator  ON fact_annual(indicator_id);
CREATE INDEX idx_annual_industry   ON fact_annual(industry_id);
CREATE INDEX idx_annual_base_year  ON fact_annual(base_year_id);
CREATE INDEX idx_annual_revision   ON fact_annual(revision_id);
CREATE INDEX idx_annual_unit       ON fact_annual(unit);

-- 2.2 Quarterly Estimates
CREATE TABLE fact_quarterly (
    quarterly_id        BIGSERIAL PRIMARY KEY,
    base_year_id        INT NOT NULL REFERENCES dim_base_year(base_year_id),
    indicator_id        INT NOT NULL REFERENCES dim_indicator(indicator_id),
    industry_id         INT REFERENCES dim_industry(industry_id),
    subindustry_id      INT REFERENCES dim_subindustry(subindustry_id),
    sector_id           INT REFERENCES dim_institutional_sector(sector_id),
    revision_id         INT REFERENCES dim_revision(revision_id),
    fiscal_year         VARCHAR(10) NOT NULL,
    fiscal_year_int     SMALLINT    NOT NULL,
    quarter             CHAR(2) NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
    series              VARCHAR(20) DEFAULT 'Current',
    current_price       NUMERIC(18,4),
    constant_price      NUMERIC(18,4),
    unit                VARCHAR(20),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qtr_fy         ON fact_quarterly(fiscal_year_int);
CREATE INDEX idx_qtr_indicator  ON fact_quarterly(indicator_id);
CREATE INDEX idx_qtr_industry   ON fact_quarterly(industry_id);
CREATE INDEX idx_qtr_base_year  ON fact_quarterly(base_year_id);
CREATE INDEX idx_qtr_quarter    ON fact_quarterly(quarter);
CREATE INDEX idx_qtr_fy_q       ON fact_quarterly(fiscal_year_int, quarter);

-- ============================================================
-- 3.  ANALYTICAL VIEWS  (for dashboard queries)
-- ============================================================

-- 3.1 GDP Annual Trend
CREATE OR REPLACE VIEW v_gdp_annual AS
SELECT
    a.fiscal_year_int                          AS fy,
    a.fiscal_year,
    b.base_year,
    a.current_price                            AS gdp_current,
    a.constant_price                           AS gdp_constant,
    a.current_price / 1e6                      AS gdp_current_lakh_crore,
    a.constant_price / 1e6                     AS gdp_constant_lakh_crore,
    r.revision_name,
    a.unit
FROM fact_annual a
JOIN dim_indicator  i ON a.indicator_id  = i.indicator_id
JOIN dim_base_year  b ON a.base_year_id  = b.base_year_id
LEFT JOIN dim_revision r ON a.revision_id = r.revision_id
WHERE i.indicator_name = 'Gross Domestic Product'
ORDER BY b.base_year, a.fiscal_year_int;

-- 3.2 GDP Growth Rate
CREATE OR REPLACE VIEW v_gdp_growth AS
SELECT
    a.fiscal_year_int   AS fy,
    a.fiscal_year,
    b.base_year,
    a.current_price     AS growth_current,
    a.constant_price    AS growth_constant,
    a.unit
FROM fact_annual a
JOIN dim_indicator i ON a.indicator_id = i.indicator_id
JOIN dim_base_year b ON a.base_year_id = b.base_year_id
WHERE i.indicator_name = 'GDP Growth Rate'
ORDER BY b.base_year, a.fiscal_year_int;

-- 3.3 Sectoral GVA Annual
CREATE OR REPLACE VIEW v_gva_sectoral AS
SELECT
    a.fiscal_year_int,
    a.fiscal_year,
    b.base_year,
    ind.industry_name,
    SUM(a.current_price)  AS gva_current,
    SUM(a.constant_price) AS gva_constant
FROM fact_annual a
JOIN dim_indicator i   ON a.indicator_id  = i.indicator_id
JOIN dim_base_year b   ON a.base_year_id  = b.base_year_id
JOIN dim_industry  ind ON a.industry_id   = ind.industry_id
WHERE i.indicator_name = 'Gross Value Added'
GROUP BY a.fiscal_year_int, a.fiscal_year, b.base_year, ind.industry_name
ORDER BY b.base_year, a.fiscal_year_int, gva_current DESC;

-- 3.4 Quarterly GDP
CREATE OR REPLACE VIEW v_gdp_quarterly AS
SELECT
    q.fiscal_year_int,
    q.fiscal_year,
    q.quarter,
    q.fiscal_year_int || '-' || q.quarter AS period_label,
    b.base_year,
    q.current_price   AS gdp_current,
    q.constant_price  AS gdp_constant,
    q.unit
FROM fact_quarterly q
JOIN dim_indicator i ON q.indicator_id = i.indicator_id
JOIN dim_base_year b ON q.base_year_id = b.base_year_id
WHERE i.indicator_name = 'Gross Domestic Product'
ORDER BY b.base_year, q.fiscal_year_int, q.quarter;

-- 3.5 Expenditure Components
CREATE OR REPLACE VIEW v_expenditure_components AS
SELECT
    a.fiscal_year_int,
    a.fiscal_year,
    b.base_year,
    i.indicator_name,
    SUM(a.current_price)  AS current_price,
    SUM(a.constant_price) AS constant_price
FROM fact_annual a
JOIN dim_indicator i ON a.indicator_id = i.indicator_id
JOIN dim_base_year b ON a.base_year_id = b.base_year_id
WHERE i.indicator_name IN (
    'Private Final Consumption Expenditure',
    'Government Final Consumption Expenditure',
    'Gross Fixed Capital Formation',
    'Export of Goods and Services',
    'Import of Goods and Services',
    'Change in Stock',
    'Valuables',
    'Gross Saving'
)
GROUP BY a.fiscal_year_int, a.fiscal_year, b.base_year, i.indicator_name
ORDER BY b.base_year, a.fiscal_year_int, i.indicator_name;

-- 3.6 Trade Balance
CREATE OR REPLACE VIEW v_trade_balance AS
WITH exp AS (
    SELECT a.fiscal_year_int, b.base_year,
           SUM(a.current_price) AS exports
    FROM fact_annual a
    JOIN dim_indicator i ON a.indicator_id = i.indicator_id
    JOIN dim_base_year b ON a.base_year_id = b.base_year_id
    WHERE i.indicator_name = 'Export of Goods and Services'
    GROUP BY a.fiscal_year_int, b.base_year
),
imp AS (
    SELECT a.fiscal_year_int, b.base_year,
           SUM(a.current_price) AS imports
    FROM fact_annual a
    JOIN dim_indicator i ON a.indicator_id = i.indicator_id
    JOIN dim_base_year b ON a.base_year_id = b.base_year_id
    WHERE i.indicator_name = 'Import of Goods and Services'
    GROUP BY a.fiscal_year_int, b.base_year
)
SELECT
    e.fiscal_year_int    AS fy,
    e.base_year,
    e.exports,
    i.imports,
    e.exports - i.imports AS trade_balance
FROM exp e JOIN imp i USING (fiscal_year_int, base_year)
ORDER BY e.base_year, e.fiscal_year_int;

-- 3.7 GVA Growth by Industry
CREATE OR REPLACE VIEW v_gva_growth_industry AS
SELECT
    a.fiscal_year_int,
    a.fiscal_year,
    b.base_year,
    ind.industry_name,
    AVG(a.current_price) AS growth_rate_current
FROM fact_annual a
JOIN dim_indicator i   ON a.indicator_id  = i.indicator_id
JOIN dim_base_year b   ON a.base_year_id  = b.base_year_id
JOIN dim_industry  ind ON a.industry_id   = ind.industry_id
WHERE i.indicator_name = 'GVA Growth Rate'
GROUP BY a.fiscal_year_int, a.fiscal_year, b.base_year, ind.industry_name
ORDER BY b.base_year, a.fiscal_year_int;

-- 3.8 Quarterly Seasonality Analysis
CREATE OR REPLACE VIEW v_quarterly_seasonality AS
SELECT
    q.quarter,
    b.base_year,
    COUNT(*)                       AS num_obs,
    AVG(q.current_price)           AS avg_gdp_current,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY q.current_price) AS median_gdp_current,
    STDDEV(q.current_price)        AS std_gdp_current,
    MIN(q.current_price)           AS min_gdp_current,
    MAX(q.current_price)           AS max_gdp_current
FROM fact_quarterly q
JOIN dim_indicator i ON q.indicator_id = i.indicator_id
JOIN dim_base_year b ON q.base_year_id = b.base_year_id
WHERE i.indicator_name = 'Gross Domestic Product'
  AND q.unit = '₹ Crore'
GROUP BY q.quarter, b.base_year
ORDER BY b.base_year, q.quarter;

-- 3.9 KPI Summary (for dashboard cards)
CREATE OR REPLACE VIEW v_kpi_summary AS
WITH latest_fy AS (
    SELECT MAX(fiscal_year_int) AS fy FROM fact_annual
),
latest_gdp AS (
    SELECT a.current_price, a.constant_price, b.base_year
    FROM fact_annual a
    JOIN dim_indicator i ON a.indicator_id = i.indicator_id
    JOIN dim_base_year b ON a.base_year_id = b.base_year_id
    WHERE i.indicator_name = 'Gross Domestic Product'
      AND a.fiscal_year_int = (SELECT fy FROM latest_fy)
),
prev_gdp AS (
    SELECT a.current_price AS prev_current, b.base_year
    FROM fact_annual a
    JOIN dim_indicator i ON a.indicator_id = i.indicator_id
    JOIN dim_base_year b ON a.base_year_id = b.base_year_id
    WHERE i.indicator_name = 'Gross Domestic Product'
      AND a.fiscal_year_int = (SELECT fy - 1 FROM latest_fy)
)
SELECT
    (SELECT fy FROM latest_fy)               AS latest_fy,
    l.base_year,
    l.current_price                          AS gdp_current,
    l.constant_price                         AS gdp_constant,
    l.current_price / 1e6                    AS gdp_lakh_crore,
    ROUND(((l.current_price - p.prev_current) / p.prev_current * 100)::NUMERIC, 2)
                                             AS yoy_growth_pct
FROM latest_gdp l
JOIN prev_gdp p USING (base_year);

-- ============================================================
-- 4.  STORED PROCEDURES / FUNCTIONS
-- ============================================================

-- 4.1 Get GDP for a specific year range
CREATE OR REPLACE FUNCTION fn_gdp_range(
    p_start_fy  INT,
    p_end_fy    INT,
    p_base_year VARCHAR DEFAULT '2011-12'
)
RETURNS TABLE (
    fy              INT,
    fiscal_year     VARCHAR,
    gdp_current     NUMERIC,
    gdp_constant    NUMERIC,
    yoy_growth_pct  NUMERIC
) LANGUAGE sql STABLE AS $$
    SELECT
        a.fiscal_year_int,
        a.fiscal_year,
        a.current_price,
        a.constant_price,
        ROUND(
            (a.current_price - LAG(a.current_price) OVER (ORDER BY a.fiscal_year_int))
            / NULLIF(LAG(a.current_price) OVER (ORDER BY a.fiscal_year_int), 0) * 100,
            2
        ) AS yoy_growth_pct
    FROM fact_annual a
    JOIN dim_indicator i ON a.indicator_id = i.indicator_id
    JOIN dim_base_year b ON a.base_year_id = b.base_year_id
    WHERE i.indicator_name = 'Gross Domestic Product'
      AND b.base_year       = p_base_year
      AND a.fiscal_year_int BETWEEN p_start_fy AND p_end_fy
      AND a.unit = '₹ Crore'
    ORDER BY a.fiscal_year_int;
$$;

-- 4.2 Top N Industries by GVA for a given year
CREATE OR REPLACE FUNCTION fn_top_industries(
    p_fy        INT,
    p_base_year VARCHAR DEFAULT '2011-12',
    p_top_n     INT     DEFAULT 5
)
RETURNS TABLE (
    rank          BIGINT,
    industry_name VARCHAR,
    gva_current   NUMERIC,
    gva_share_pct NUMERIC
) LANGUAGE sql STABLE AS $$
    WITH totals AS (
        SELECT SUM(a.current_price) AS total_gva
        FROM fact_annual a
        JOIN dim_indicator i   ON a.indicator_id  = i.indicator_id
        JOIN dim_base_year b   ON a.base_year_id  = b.base_year_id
        WHERE i.indicator_name = 'Gross Value Added'
          AND b.base_year = p_base_year
          AND a.fiscal_year_int = p_fy
          AND a.unit = '₹ Crore'
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY SUM(a.current_price) DESC) AS rank,
        ind.industry_name,
        SUM(a.current_price)                                   AS gva_current,
        ROUND(SUM(a.current_price) / t.total_gva * 100, 2)    AS gva_share_pct
    FROM fact_annual a
    JOIN dim_indicator i   ON a.indicator_id  = i.indicator_id
    JOIN dim_base_year b   ON a.base_year_id  = b.base_year_id
    JOIN dim_industry  ind ON a.industry_id   = ind.industry_id
    CROSS JOIN totals t
    WHERE i.indicator_name = 'Gross Value Added'
      AND b.base_year = p_base_year
      AND a.fiscal_year_int = p_fy
      AND a.unit = '₹ Crore'
    GROUP BY ind.industry_name, t.total_gva
    ORDER BY gva_current DESC
    LIMIT p_top_n;
$$;

-- ============================================================
-- 5.  SEED DATA — DIMENSIONS
-- ============================================================

INSERT INTO dim_base_year (base_year, description) VALUES
    ('2011-12', 'Base Year 2011-12 series (older series)'),
    ('2022-23', 'Base Year 2022-23 series (new rebased series)')
ON CONFLICT (base_year) DO NOTHING;

INSERT INTO dim_revision (revision_name, revision_order) VALUES
    ('First Advance Estimates',   1),
    ('Second Advance Estimates',  2),
    ('Provisional Estimates',     3),
    ('First Revised Estimates',   4),
    ('Second Revised Estimates',  5),
    ('Third Revised Estimates',   6),
    ('Additional Revision',       7),
    ('Final Estimates',           8)
ON CONFLICT (revision_name) DO NOTHING;

INSERT INTO dim_indicator (indicator_name, category, is_growth_rate, unit_default) VALUES
    ('Gross Domestic Product',                    'Output',         FALSE, '₹ Crore'),
    ('Gross Value Added',                         'Output',         FALSE, '₹ Crore'),
    ('Net Domestic Product',                      'Output',         FALSE, '₹ Crore'),
    ('Gross National Income',                     'Income',         FALSE, '₹ Crore'),
    ('Gross National Disposable Income',          'Income',         FALSE, '₹ Crore'),
    ('Gross Fixed Capital Formation',             'Expenditure',    FALSE, '₹ Crore'),
    ('Gross Capital Formation by Industry of Use','Expenditure',    FALSE, '₹ Crore'),
    ('Private Final Consumption Expenditure',     'Expenditure',    FALSE, '₹ Crore'),
    ('Government Final Consumption Expenditure',  'Expenditure',    FALSE, '₹ Crore'),
    ('Export of Goods and Services',              'Expenditure',    FALSE, '₹ Crore'),
    ('Import of Goods and Services',              'Expenditure',    FALSE, '₹ Crore'),
    ('Change in Stock',                           'Expenditure',    FALSE, '₹ Crore'),
    ('Valuables',                                 'Expenditure',    FALSE, '₹ Crore'),
    ('Gross Saving',                              'Income',         FALSE, '₹ Crore'),
    ('Consumption of Fixed Capital',              'Output',         FALSE, '₹ Crore'),
    ('Net Taxes on Products',                     'Output',         FALSE, '₹ Crore'),
    ('Taxes on Products',                         'Output',         FALSE, '₹ Crore'),
    ('Subsidies on Products',                     'Output',         FALSE, '₹ Crore'),
    ('Primary Income Receivable Net From Row',    'Income',         FALSE, '₹ Crore'),
    ('Other Current Transfers Net From Row',      'Income',         FALSE, '₹ Crore'),
    ('GDP Growth Rate',                           'GrowthRate',     TRUE,  '%'),
    ('GVA Growth Rate',                           'GrowthRate',     TRUE,  '%')
ON CONFLICT (indicator_name) DO NOTHING;

INSERT INTO dim_industry (industry_name, sector) VALUES
    ('Agriculture, Livestock, Forestry and Fishing', 'Primary'),
    ('Mining and Quarrying',                          'Primary'),
    ('Manufacturing',                                 'Secondary'),
    ('Electricity, Gas, Water Supply & Other Utility Services', 'Secondary'),
    ('Construction',                                  'Secondary'),
    ('Trade, Hotels, Transport, Communication and Broadcasting', 'Tertiary'),
    ('Financial Services',                            'Tertiary'),
    ('Real Estate, Ownership of Dwelling & Professional Services', 'Tertiary'),
    ('Public Administration, Defence and Other Services', 'Tertiary')
ON CONFLICT (industry_name) DO NOTHING;

INSERT INTO dim_institutional_sector (sector_name, sector_type) VALUES
    ('Household Sector',                  'Household'),
    ('Public Non-Financial Corporations', 'Public'),
    ('Private Non-Financial Corporations','Private'),
    ('Public Financial Corporations',     'Public'),
    ('Private Financial Corporations',    'Private'),
    ('General Government',                'Public'),
    ('Rest of the World',                 'External'),
    ('Non-Profit Institutions Serving Households', 'Household')
ON CONFLICT (sector_name) DO NOTHING;

-- ============================================================
-- 6.  PYTHON LOADER SCRIPT (run to load the CSV)
-- ============================================================
/*
  Save the following as load_data.py and run:
      python load_data.py

  Requirements:
      pip install pandas psycopg2-binary sqlalchemy

----------------------------------------------------------------------
import pandas as pd
from sqlalchemy import create_engine, text

# --- Configure your connection ---
DB_URL = "postgresql://user:password@localhost:5432/nas_db"
CSV_PATH = "Merged_Annually_Quarterly.csv"

engine = create_engine(DB_URL)
df = pd.read_csv(CSV_PATH)

# Strip and normalise strings
for c in df.select_dtypes(include='object').columns:
    df[c] = df[c].astype(str).str.strip().replace('nan', None)

df['fiscal_year_int'] = df['year'].str.extract(r'^(\d{4})').astype(float).astype('Int64')

def get_or_create(conn, table, key_col, value, extra=None):
    res = conn.execute(text(f"SELECT {key_col}_id FROM nas.{table} WHERE {key_col}_name = :v"), {'v': value}).fetchone()
    if res: return res[0]
    cols = f"{key_col}_name" + (", " + ", ".join(extra.keys()) if extra else "")
    vals = ":v" + (", " + ", ".join(f":{k}" for k in extra) if extra else "")
    params = {'v': value, **(extra or {})}
    r = conn.execute(text(f"INSERT INTO nas.{table} ({cols}) VALUES ({vals}) ON CONFLICT DO NOTHING RETURNING {key_col}_id"), params).fetchone()
    if r: return r[0]
    return conn.execute(text(f"SELECT {key_col}_id FROM nas.{table} WHERE {key_col}_name = :v"), {'v': value}).fetchone()[0]

with engine.begin() as conn:
    by_map  = {r[0]: r[1] for r in conn.execute(text("SELECT base_year, base_year_id FROM nas.dim_base_year")).fetchall()}
    ind_map = {r[0]: r[1] for r in conn.execute(text("SELECT indicator_name, indicator_id FROM nas.dim_indicator")).fetchall()}
    indy_map= {r[0]: r[1] for r in conn.execute(text("SELECT industry_name, industry_id FROM nas.dim_industry")).fetchall()}
    rev_map = {r[0]: r[1] for r in conn.execute(text("SELECT revision_name, revision_id FROM nas.dim_revision")).fetchall()}

    for _, row in df.iterrows():
        by_id   = by_map.get(row.get('base_year'))
        ind_id  = ind_map.get(row.get('indicator'))
        indy_id = indy_map.get(row.get('industry')) if pd.notna(row.get('industry')) else None
        rev_id  = rev_map.get(row.get('revision'))  if pd.notna(row.get('revision'))  else None

        if not by_id or not ind_id: continue

        freq = row.get('frequency')
        cp   = float(row['current_price'])  if pd.notna(row.get('current_price'))  else None
        cst  = float(row['constant_price']) if pd.notna(row.get('constant_price')) else None
        fy_int = int(row['fiscal_year_int']) if pd.notna(row.get('fiscal_year_int')) else None

        if freq == 'Annual':
            conn.execute(text("""
                INSERT INTO nas.fact_annual
                  (base_year_id, indicator_id, industry_id, revision_id,
                   fiscal_year, fiscal_year_int, current_price, constant_price, unit)
                VALUES (:by, :ind, :indy, :rev, :fy, :fyi, :cp, :cst, :unit)
            """), dict(by=by_id, ind=ind_id, indy=indy_id, rev=rev_id,
                       fy=row.get('year'), fyi=fy_int, cp=cp, cst=cst, unit=row.get('unit')))
        elif freq == 'Quarterly':
            conn.execute(text("""
                INSERT INTO nas.fact_quarterly
                  (base_year_id, indicator_id, industry_id, revision_id,
                   fiscal_year, fiscal_year_int, quarter, current_price, constant_price, unit)
                VALUES (:by, :ind, :indy, :rev, :fy, :fyi, :q, :cp, :cst, :unit)
            """), dict(by=by_id, ind=ind_id, indy=indy_id, rev=rev_id,
                       fy=row.get('year'), fyi=fy_int, q=row.get('quarter'),
                       cp=cp, cst=cst, unit=row.get('unit')))

print("Data loaded successfully!")
----------------------------------------------------------------------
*/

-- ============================================================
-- 7.  EXAMPLE DASHBOARD QUERIES
-- ============================================================

-- Q1: Latest GDP
SELECT * FROM nas.v_kpi_summary;

-- Q2: GDP Trend last 10 years
SELECT * FROM nas.fn_gdp_range(2013, 2023, '2011-12');

-- Q3: Top 5 industries latest year
SELECT * FROM nas.fn_top_industries(2022, '2011-12', 5);

-- Q4: Trade balance all years
SELECT * FROM nas.v_trade_balance WHERE base_year = '2011-12' ORDER BY fy;

-- Q5: Quarterly seasonality
SELECT * FROM nas.v_quarterly_seasonality;

-- Q6: Expenditure components FY 2022
SELECT * FROM nas.v_expenditure_components
WHERE fiscal_year_int = 2022 AND base_year = '2011-12'
ORDER BY current_price DESC;

-- Q7: GVA sector share latest year
SELECT industry_name, gva_current/1e6 AS gva_lakh_crore, gva_share_pct
FROM nas.fn_top_industries(2022, '2011-12', 20)
ORDER BY gva_share_pct DESC;
