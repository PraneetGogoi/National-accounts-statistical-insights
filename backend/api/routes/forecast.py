from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
from prophet import Prophet
from prophet.diagnostics import cross_validation, performance_metrics
from typing import List, Dict, Any
import joblib
import json

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from db.database import get_db, NasData

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), "prophet_model.joblib")
META_PATH = os.path.join(os.path.dirname(__file__), "prophet_meta.json")

def parse_quarter(row):
    q = str(row['quarter']).strip().upper()
    year = int(row['year_int'])
    if q == 'Q1': return pd.to_datetime(f"{year}-04-01")
    elif q == 'Q2': return pd.to_datetime(f"{year}-07-01")
    elif q == 'Q3': return pd.to_datetime(f"{year}-10-01")
    elif q == 'Q4': return pd.to_datetime(f"{year+1}-01-01")
    return pd.to_datetime(f"{year}-01-01")

def get_training_df(db: Session, max_year=None):
    query = db.query(NasData.year_int, NasData.quarter, NasData.constant_price)\
              .filter(NasData.indicator == 'Gross Domestic Product')\
              .filter(NasData.base_year == '2011-12')
    
    if max_year:
        query = query.filter(NasData.year_int <= max_year)
              
    data = query.all()
    if not data:
        return None
        
    df = pd.DataFrame(data, columns=['year_int', 'quarter', 'constant_price'])
    df['ds'] = df.apply(parse_quarter, axis=1)
    df['y'] = pd.to_numeric(df['constant_price'], errors='coerce')
    df = df.dropna(subset=['ds', 'y'])
    df = df.sort_values('ds')
    return df

def fit_and_save_prophet_model(db: Session):
    df = get_training_df(db)
    if df is None or len(df) < 5:
        print("Not enough data to train Prophet.")
        return

    m = Prophet(seasonality_mode='multiplicative')
    m.fit(df[['ds', 'y']])
    
    joblib.dump(m, MODEL_PATH)
    
    import datetime
    with open(META_PATH, 'w') as f:
        json.dump({"last_trained": datetime.datetime.utcnow().isoformat()}, f)
        
    print(f"Prophet model retrained and saved to {MODEL_PATH}")

@router.get("/gdp")
def forecast_gdp(periods: int = 4):
    """
    Returns full forecast intervals natively supported by Prophet (yhat, yhat_lower, yhat_upper).
    """
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=503, detail="Forecast model is not trained yet. Run ingestion.")
        
    m = joblib.load(MODEL_PATH)
    future = m.make_future_dataframe(periods=periods, freq='QS')
    forecast = m.predict(future)
    
    result = []
    for _, row in forecast.tail(periods).iterrows():
        result.append({
            "ds": row['ds'].strftime("%Y-%m-%d"),
            "yhat": float(row['yhat']),
            "yhat_lower": float(row['yhat_lower']),
            "yhat_upper": float(row['yhat_upper'])
        })
        
    return {"forecast": result}

@router.get("/backtest")
def backtest_forecast(db: Session = Depends(get_db)):
    """
    Trains the model on data up to 2022 and predicts 2023.
    Returns RMSE and MAE against actuals.
    """
    df_train = get_training_df(db, max_year=2022)
    df_actual = get_training_df(db)
    
    if df_train is None or df_actual is None:
        raise HTTPException(status_code=404, detail="Not enough data to run backtest.")
        
    df_actual_2023 = df_actual[df_actual['year_int'] == 2023]
    if df_actual_2023.empty:
        raise HTTPException(status_code=404, detail="No 2023 data available to backtest against.")
        
    m = Prophet(seasonality_mode='multiplicative')
    m.fit(df_train[['ds', 'y']])
    
    # Predict exactly the dates in 2023
    future = df_actual_2023[['ds']]
    forecast = m.predict(future)
    
    merged = pd.merge(forecast[['ds', 'yhat']], df_actual_2023[['ds', 'y']], on='ds')
    
    merged['err'] = merged['y'] - merged['yhat']
    merged['abs_err'] = merged['err'].abs()
    merged['sq_err'] = merged['err']**2
    
    mae = float(merged['abs_err'].mean())
    rmse = float(merged['sq_err'].mean()**0.5)
    
    predictions = []
    for _, row in merged.iterrows():
        predictions.append({
            "date": row['ds'].strftime("%Y-%m-%d"),
            "actual": float(row['y']),
            "predicted": float(row['yhat']),
            "error": float(row['err'])
        })
        
    return {
        "metrics": {
            "mae": mae,
            "rmse": rmse
        },
        "details": predictions
    }
