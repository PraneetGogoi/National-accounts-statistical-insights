from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
from prophet import Prophet
from typing import List, Dict, Any

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from db.database import get_db, NasData

router = APIRouter()

@router.get("/gdp")
def forecast_gdp(periods: int = 4, db: Session = Depends(get_db)):
    """
    Uses Prophet to forecast GDP based on historical Annual/Quarterly data.
    """
    # Fetch historical GDP data
    # We will use 'Gross Domestic Product' indicator, frequency='Quarterly' 
    # to have enough data points for Prophet. If no quarterly, fallback to annual.
    query = db.query(NasData.year_int, NasData.quarter, NasData.current_price, NasData.constant_price)\
              .filter(NasData.indicator == 'Gross Domestic Product')\
              .filter(NasData.base_year == '2011-12')
              
    data = query.all()
    if not data:
        raise HTTPException(status_code=404, detail="No GDP data found for forecasting.")
        
    df = pd.DataFrame(data, columns=['year_int', 'quarter', 'current_price', 'constant_price'])
    
    # Preprocess date
    # Convert 'Q1', 'Q2', etc. + year_int into a datetime.
    # Typically Q1 = April-June in India financial year, but for Prophet we just need sequential dates.
    # Assuming standard calendar quarters for simplicity in this demo.
    def parse_quarter(row):
        q = str(row['quarter']).strip().upper()
        year = int(row['year_int'])
        if q == 'Q1': return pd.to_datetime(f"{year}-04-01")
        elif q == 'Q2': return pd.to_datetime(f"{year}-07-01")
        elif q == 'Q3': return pd.to_datetime(f"{year}-10-01")
        elif q == 'Q4': return pd.to_datetime(f"{year+1}-01-01")
        return pd.to_datetime(f"{year}-01-01") # fallback for annual
        
    df['ds'] = df.apply(parse_quarter, axis=1)
    
    # We want to forecast constant_price (Real GDP)
    df['y'] = pd.to_numeric(df['constant_price'], errors='coerce')
    df = df.dropna(subset=['ds', 'y'])
    df = df.sort_values('ds')
    
    if len(df) < 5:
        raise HTTPException(status_code=400, detail="Not enough data points for Prophet.")
        
    # Fit Prophet
    m = Prophet(seasonality_mode='multiplicative')
    m.fit(df[['ds', 'y']])
    
    # Predict
    future = m.make_future_dataframe(periods=periods, freq='QS')
    forecast = m.predict(future)
    
    # Format output
    result = []
    for _, row in forecast.tail(periods).iterrows():
        result.append({
            "ds": row['ds'].strftime("%Y-%m-%d"),
            "yhat": float(row['yhat']),
            "yhat_lower": float(row['yhat_lower']),
            "yhat_upper": float(row['yhat_upper'])
        })
        
    return {"forecast": result}
