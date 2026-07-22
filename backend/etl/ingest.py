import sys
import os
import hashlib
import pandas as pd
import numpy as np
import datetime
from sqlalchemy.orm import Session

# Add the parent directory to the path so we can import from db
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.database import engine, SessionLocal, IngestionAuditLog, NasDataRevision, NasData

def get_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def detect_anomalies(df):
    """
    Detect anomalies using IQR on 'current_price' for each 'indicator' and 'industry' group.
    Flags rows that fall outside 1.5 * IQR.
    """
    df['is_anomaly'] = False
    df['anomaly_score'] = 0.0

    # We only care about anomalies where values are heavily deviating from their group norm
    groups = df.groupby(['indicator', 'industry'])
    for name, group in groups:
        if len(group) < 5:
            continue
        
        Q1 = group['current_price'].quantile(0.25)
        Q3 = group['current_price'].quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        anomalies = (group['current_price'] < lower_bound) | (group['current_price'] > upper_bound)
        
        # Calculate a simple z-score equivalent for the anomaly score
        std_dev = group['current_price'].std()
        mean_val = group['current_price'].mean()
        if std_dev > 0:
            df.loc[anomalies.index, 'anomaly_score'] = (df.loc[anomalies.index, 'current_price'] - mean_val) / std_dev
        
        df.loc[anomalies.index, 'is_anomaly'] = anomalies

    return df

def run_ingestion(filepath):
    db: Session = SessionLocal()
    success = False
    error_msg = None
    rows_processed = 0
    file_hash = None
    
    try:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")
            
        file_hash = get_file_hash(filepath)
        
        # Check if already ingested (optional, but good for idempotency)
        prev_log = db.query(IngestionAuditLog).filter(IngestionAuditLog.source_file_hash == file_hash, IngestionAuditLog.success == True).first()
        if prev_log:
            print("File already ingested successfully. Skipping.")
            return

        print("Reading CSV...")
        df = pd.read_csv(filepath)
        
        # Data cleaning and type casting based on frontend parsing logic
        df.columns = [col.strip().lower().replace(' ', '_') for col in df.columns]
        
        # Some cleanup
        df['year_int'] = df['year'].astype(str).str.extract(r'^(\d{4})').fillna(0).astype(int)
        df['current_price'] = pd.to_numeric(df['current_price'], errors='coerce').fillna(0)
        df['constant_price'] = pd.to_numeric(df['constant_price'], errors='coerce').fillna(0)
        
        # Anomaly Detection
        print("Running anomaly detection...")
        df = detect_anomalies(df)
        
        # Create a revision
        revision_name = f"Ingestion_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        revision = NasDataRevision(
            revision_name=revision_name,
            release_date=datetime.date.today()
        )
        db.add(revision)
        db.commit()
        db.refresh(revision)
        
        df['revision_id'] = revision.revision_id
        
        # Insert Data
        print(f"Inserting {len(df)} rows into database...")
        records = df.to_dict(orient='records')
        
        # Bulk insert using SQLAlchemy Core for speed
        db.execute(NasData.__table__.insert(), records)
        db.commit()
        
        rows_processed = len(records)
        success = True
        print("Ingestion completed successfully!")
        
    except Exception as e:
        db.rollback()
        success = False
        error_msg = str(e)
        print(f"Ingestion failed: {error_msg}")
    finally:
        # Create Audit Log
        audit_log = IngestionAuditLog(
            rows_processed=rows_processed,
            source_file_hash=file_hash,
            success=success,
            error_message=error_msg
        )
        db.add(audit_log)
        db.commit()
        db.close()

if __name__ == "__main__":
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../public/data/nas_data.csv'))
    run_ingestion(csv_path)
