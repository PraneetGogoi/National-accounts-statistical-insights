
```markdown
# India National Accounts Statistics (NAS) Insights 📊

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Data Engineering](https://img.shields.io/badge/Data%20Engineering-FF6F00?style=for-the-badge&logo=databricks&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

A robust data engineering and analytics database designed to ingest, process, and analyze India's National Accounts Statistics (NAS). Sourced from MoSPI datasets, this project transforms raw macroeconomic data into a highly structured, query-optimized Star Schema, empowering deep insights into GDP, Gross Value Added (GVA), and national expenditure trends.

## 🚀 Key Features

* **Optimized Dimensional Modeling:** Implements a Star Schema architecture (`dim_base_year`, `dim_indicator`, `dim_industry`, `fact_annual`, `fact_quarterly`) for lightning-fast analytical queries.
* **Automated Data Ingestion:** Includes a Python-based ETL script utilizing `pandas` and `SQLAlchemy` to seamlessly load, normalize, and populate merged annual and quarterly datasets.
* **Pre-computed Analytical Views:** Features ready-to-use SQL views for standard economic KPIs (e.g., GDP Growth Rate, Sectoral GVA, Trade Balance, Quarterly Seasonality).
* **Advanced Stored Procedures:** Built-in PostgreSQL functions for dynamic range queries and Top-N industry performance rankings.
* **Cloud-Ready:** Fully compatible with local PostgreSQL instances or cloud providers like Supabase for instant REST API exposure.

## 🛠️ Tech Stack

* **Database:** PostgreSQL (v14+)
* **Data Processing/ETL:** Python 3.11+, Pandas, SQLAlchemy, psycopg2-binary
* **Extensions:** `pg_trgm` (for rapid text searches), `btree_gist`

## 📂 Repository Structure

```text
├── data/
│   └── Merged_Annually_Quarterly.csv   # Raw source dataset (Add this file)
├── schema.sql                          # Core DDL, Views, and Stored Procedures
├── load_data.py                        # Python ingestion pipeline
└── README.md
```
<img width="1710" height="987" alt="Screenshot 2026-04-03 at 9 32 08 PM" src="https://github.com/user-attachments/assets/d29797ac-ac75-4aa4-a37f-ad67957ca2b3" />

<img width="1710" height="987" alt="Screenshot 2026-04-03 at 9 32 35 PM" src="https://github.com/user-attachments/assets/91327b60-140c-4ded-94ca-74d91f0516f8" />


## ⚙️ Installation & Setup

### 1. Database Initialization
You can run this locally or on a cloud platform like Supabase.

**Local PostgreSQL:**
```bash
psql -U your_username -d your_database -f schema.sql
```

**Supabase:**
Simply copy the contents of `schema.sql` and execute it in the Supabase SQL Editor.

### 2. Python Environment Setup
Ensure you have Python installed, then install the required dependencies:

```bash
pip install pandas psycopg2-binary sqlalchemy
```

### 3. Load the Data
Update the `DB_URL` inside `load_data.py` to point to your database instance:
```python
DB_URL = "postgresql://user:password@localhost:5432/nas_db" 
# Or your Supabase connection string
```

Run the loader script to populate the dimension and fact tables:
```bash
python load_data.py
```

## 📈 Exploring the Data (Analytical Views)

Once the data is loaded, the schema provides several powerful views for immediate insight generation:

* **`v_kpi_summary`**: High-level dashboard cards (Latest GDP, YoY Growth).
* **`v_gdp_annual` & `v_gdp_quarterly`**: Core economic tracking across base years.
* **`v_trade_balance`**: Historical mapping of export vs. import margins.
* **`v_quarterly_seasonality`**: Statistical breakdown of GDP fluctuations by quarter.

**Example Query: Top 5 Industries by GVA for 2022**
```sql
SELECT * FROM nas.fn_top_industries(2022, '2011-12', 5);
```

## 🔮 Future Enhancements

* **Interactive Dashboards:** Connect the database to a dynamic Python dashboard framework (like Dash or FastAPI) for visual, interactive economic exploration.
* **Agentic AI Analysis:** Implement an LLM reasoning layer (e.g., LangGraph) over the SQL database to act as an automated "Economic Analyst," generating natural language summaries of macroeconomic shifts.
* **Automated CI/CD:** Set up GitHub Actions to automatically lint the SQL schema and run test queries on mock data.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
