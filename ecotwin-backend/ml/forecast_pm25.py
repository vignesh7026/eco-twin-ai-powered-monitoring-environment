"""
forecast_pm25.py — Short-term (1-6hr) PM2.5 forecasting for Bengaluru.

This is the core research contribution: instead of just DISPLAYING live
PM2.5 (what your app currently does), this predicts near-future PM2.5
using weather-correlated features (humidity, wind speed, temperature,
rain) plus time-of-day/day-of-week patterns.

USAGE
-----
1. Let logHistory.js run for at least 1-2 weeks (ideally 3-4 for a
   stronger paper) to build a real dataset.
2. Export it:  GET http://localhost:5000/api/history/csv  -> save as data/ecotwin_history.csv
3. pip install pandas scikit-learn xgboost matplotlib --break-system-packages
4. python forecast_pm25.py

WHAT IT DOES
------------
- Engineers lag features (PM2.5 1hr ago, 3hr ago, 6hr ago) and time
  features (hour of day, day of week — pollution has strong diurnal
  patterns from traffic).
- Trains two models to compare: a simple Linear Regression baseline
  and a Random Forest / XGBoost model — this comparison itself is
  useful in a paper (shows whether non-linear modeling is justified).
- Evaluates with MAE and RMSE on a held-out time-based split (NOT
  random split — random split leaks future info into training for
  time series, which is a common mistake reviewers will flag).
- Plots predicted vs actual for the report/paper figures.

METHODOLOGY NOTE FOR YOUR PAPER
--------------------------------
Use a *chronological* train/test split (e.g. first 80% of days for
training, last 20% for testing) — never random shuffle for time series.
This is worth stating explicitly in your methodology section, since
it's a real methodological choice reviewers check for.
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import matplotlib.pyplot as plt

DATA_PATH = "data/ecotwin_history.csv"
FORECAST_HORIZON_HOURS = 3  # predict PM2.5 this many hours ahead


def load_and_prepare(path):
    df = pd.read_csv(path, parse_dates=["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    df = df.dropna(subset=["pm2_5"])

    # Time-based features — traffic/industrial activity follows daily rhythms
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Assumes ~15-min sampling interval (4 rows/hour) from logHistory.js
    rows_per_hour = 4
    df["pm25_lag_1h"] = df["pm2_5"].shift(1 * rows_per_hour)
    df["pm25_lag_3h"] = df["pm2_5"].shift(3 * rows_per_hour)
    df["pm25_lag_6h"] = df["pm2_5"].shift(6 * rows_per_hour)

    # Target: PM2.5 N hours in the future
    df["target"] = df["pm2_5"].shift(-FORECAST_HORIZON_HOURS * rows_per_hour)

    df = df.dropna(subset=["pm25_lag_1h", "pm25_lag_3h", "pm25_lag_6h", "target"])
    return df


def train_and_evaluate(df):
    features = [
        "pm2_5", "pm25_lag_1h", "pm25_lag_3h", "pm25_lag_6h",
        "temp_c", "humidity", "wind_speed", "rain_1h",
        "hour", "day_of_week", "is_weekend",
    ]
    X = df[features]
    y = df["target"]

    # Chronological split — critical for time series, see module docstring
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    results = {}

    # Baseline: naive persistence (tomorrow = today) — always report this,
    # reviewers want to see your model beats the trivial baseline
    naive_pred = X_test["pm2_5"].values
    results["Naive Persistence"] = {
        "MAE": mean_absolute_error(y_test, naive_pred),
        "RMSE": np.sqrt(mean_squared_error(y_test, naive_pred)),
    }

    # Linear Regression baseline
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    lr_pred = lr.predict(X_test)
    results["Linear Regression"] = {
        "MAE": mean_absolute_error(y_test, lr_pred),
        "RMSE": np.sqrt(mean_squared_error(y_test, lr_pred)),
    }

    # Random Forest — captures non-linear weather/PM2.5 interactions
    rf = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    results["Random Forest"] = {
        "MAE": mean_absolute_error(y_test, rf_pred),
        "RMSE": np.sqrt(mean_squared_error(y_test, rf_pred)),
    }

    print(f"\n=== {FORECAST_HORIZON_HOURS}-Hour PM2.5 Forecast — Model Comparison ===")
    print(f"{'Model':<20} {'MAE':>8} {'RMSE':>8}")
    for name, m in results.items():
        print(f"{name:<20} {m['MAE']:>8.2f} {m['RMSE']:>8.2f}")

    # Feature importance — good figure for the paper, shows what actually
    # drives PM2.5 changes (often: wind speed + hour-of-day dominate)
    importance = pd.Series(rf.feature_importances_, index=features).sort_values(ascending=False)
    print("\nFeature importance (Random Forest):")
    print(importance)

    # Plot predicted vs actual for the best model
    plt.figure(figsize=(12, 5))
    plt.plot(y_test.values, label="Actual PM2.5", alpha=0.7)
    plt.plot(rf_pred, label="RF Predicted", alpha=0.7)
    plt.title(f"{FORECAST_HORIZON_HOURS}-Hour PM2.5 Forecast: Predicted vs Actual (Bengaluru)")
    plt.xlabel("Test sample (chronological)")
    plt.ylabel("PM2.5 (μg/m³)")
    plt.legend()
    plt.tight_layout()
    plt.savefig("forecast_results.png", dpi=150)
    print("\nSaved plot: forecast_results.png")

    return results, importance


if __name__ == "__main__":
    df = load_and_prepare(DATA_PATH)
    print(f"Loaded {len(df)} usable rows after feature engineering.")
    if len(df) < 200:
        print(
            "\n⚠️  Warning: fewer than 200 rows. Results will be unreliable. "
            "Let logHistory.js run longer before training — aim for 1000+ rows "
            "(~1 week+ at 15-min intervals) for a defensible paper result."
        )
    train_and_evaluate(df)