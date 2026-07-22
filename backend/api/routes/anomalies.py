from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from db.database import get_db, NasData

router = APIRouter()

@router.get("/")
def list_anomalies(db: Session = Depends(get_db)):
    """
    Returns a list of data rows flagged for review.
    """
    anomalies = db.query(NasData).filter(NasData.flagged_for_review == True).all()
    return {"anomalies": anomalies}

@router.post("/{nas_data_id}/approve")
def approve_anomaly(nas_data_id: int, db: Session = Depends(get_db)):
    """
    Approves an anomaly (it is valid data). Removes the flag.
    """
    row = db.query(NasData).filter(NasData.id == nas_data_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Data row not found")
        
    row.flagged_for_review = False
    db.commit()
    return {"status": "approved", "id": nas_data_id}

@router.post("/{nas_data_id}/reject")
def reject_anomaly(nas_data_id: int, db: Session = Depends(get_db)):
    """
    Rejects an anomaly. Either deletes it or marks it invalid.
    For this demo, we'll just delete the erroneous row.
    """
    row = db.query(NasData).filter(NasData.id == nas_data_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Data row not found")
        
    db.delete(row)
    db.commit()
    return {"status": "rejected_and_deleted", "id": nas_data_id}
