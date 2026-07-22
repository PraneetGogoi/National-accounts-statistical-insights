from sqlalchemy import create_engine, Column, Integer, String, Boolean, Numeric, Date, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

SQLALCHEMY_DATABASE_URL = "postgresql://postgres:password@localhost:5432/nas_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class IngestionAuditLog(Base):
    __tablename__ = "ingestion_audit_log"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    rows_processed = Column(Integer, nullable=False)
    source_file_hash = Column(String(64))
    success = Column(Boolean, nullable=False)
    error_message = Column(String)

class NasDataRevision(Base):
    __tablename__ = "nas_data_revisions"
    revision_id = Column(Integer, primary_key=True, index=True)
    revision_name = Column(String(100), nullable=False)
    release_date = Column(Date)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class NasData(Base):
    __tablename__ = "nas_data"
    id = Column(Integer, primary_key=True, index=True)
    revision_id = Column(Integer, ForeignKey("nas_data_revisions.revision_id"))
    base_year = Column(String(20))
    series = Column(String(50))
    year = Column(String(20))
    year_int = Column(Integer, index=True)
    indicator = Column(String(100), index=True)
    frequency = Column(String(20))
    industry = Column(String(200), index=True)
    subindustry = Column(String(200))
    institutional_sector = Column(String(200))
    quarter = Column(String(10))
    current_price = Column(Numeric)
    constant_price = Column(Numeric)
    unit = Column(String(50))
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Numeric)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
