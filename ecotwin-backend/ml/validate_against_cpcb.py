"""
validate_against_cpcb.py — Compare OpenWeatherMap's modeled PM2.5 against
real CPCB ground-station readings for Bengaluru.

WHY THIS MATTERS FOR THE PAPER
-------------------------------
OpenWeatherMap's air pollution API uses SATELLITE + MODEL-BASED estimates,
not direct ground sensors. CPCB (Central Pollution Control Board) runs
actual physical monitoring stations across Bengaluru (e.g. BTM Layout,
Silk Board, Hebbal, Peenya). Comparing the two gives you a genuine,
citable validation result: "How accurate is the free/API-based data
source my app relies on, against ground truth?"

This is often MORE valuable to reviewers than the forecasting model
alone, because it's a direct, honest accuracy assessment rather than
just "my model has low error."

HOW TO GET CPCB DATA
---------------------
Option A (recommended): data.gov.in Central Pollution Control Board
open datasets — search "CPCB Bengaluru" or "Air Quality Data" under
data.gov.in. Requires a free API key (register at data.gov.in).
Historical station-level PM2.5 CSVs are downloadable directly for
many stations.

Option B: CPCB's own CAAQMS portal (https://airquality.cpcb.gov.in/)
has a public dashboard; historical bulk download requires a request
but live station values are viewable and can be logged similarly to
your OpenWeatherMap logger if you find their public JSON endpoint
(inspect network tab on their dashboard — many public dashboards
expose an unauthenticated read API).

WHAT THIS SCRIPT ASSUMES
--------------------------
You have exported/downloaded a CPCB CSV with at least: timestamp, station
name, and PM2.5 value, for a station near lat=12.9716, lon=77.5946
(pick whichever CPCB station is geographically closest to the point
your OpenWeatherMap calls use — mention this station choice explicitly
in your paper's limitations section, since spatial mismatch is a real
caveat).

USAGE
-----
pip install pandas scikit-learn matplotlib --break-system-packages
python validate_against_cpcb.py
"""

import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error
import matplotlib.pyplot as plt

OWM_DATA_PATH = "data/ecotwin_history.csv"       # your logged OpenWeatherMap data
CPCB_DATA_PATH = "data/cpcb_station_history.csv"  # downloaded from data.gov.in


def load_and_align():
    owm = pd.read_csv(OWM_DATA_PATH, parse_dates=["timestamp"])
    cpcb = pd.read_csv(CPCB_DATA_PATH, parse_dates=["timestamp"])

    owm = owm[["timestamp", "pm2_5"]].rename(columns={"pm2_5": "pm25_owm"})
    cpcb = cpcb[["timestamp", "pm2_5"]].rename(columns={"pm2_5": "pm25_cpcb"})

    # Round both to the nearest hour so the two differently-sampled
    # sources (15-min OWM vs hourly CPCB, typically) can be matched.
    owm["hour"] = owm["timestamp"].dt.floor("h")
    cpcb["hour"] = cpcb["timestamp"].dt.floor("h")

    owm_hourly = owm.groupby("hour")["pm25_owm"].mean().reset_index()
    cpcb_hourly = cpcb.groupby("hour")["pm25_cpcb"].mean().reset_index()

    merged = pd.merge(owm_hourly, cpcb_hourly, on="hour", how="inner").dropna()
    return merged


def compare(merged):
    mae = mean_absolute_error(merged["pm25_cpcb"], merged["pm25_owm"])
    rmse = np.sqrt(mean_squared_error(merged["pm25_cpcb"], merged["pm25_owm"]))
    bias = (merged["pm25_owm"] - merged["pm25_cpcb"]).mean()
    corr = merged["pm25_owm"].corr(merged["pm25_cpcb"])

    print(f"\n=== OpenWeatherMap vs CPCB Ground Truth — {len(merged)} matched hours ===")
    print(f"MAE:                {mae:.2f} μg/m³")
    print(f"RMSE:               {rmse:.2f} μg/m³")
    print(f"Mean bias:          {bias:+.2f} μg/m³  ({'OWM overestimates' if bias > 0 else 'OWM underestimates'})")
    print(f"Correlation (r):    {corr:.3f}")

    plt.figure(figsize=(10, 5))
    plt.scatter(merged["pm25_cpcb"], merged["pm25_owm"], alpha=0.5, s=15)
    max_val = max(merged["pm25_cpcb"].max(), merged["pm25_owm"].max())
    plt.plot([0, max_val], [0, max_val], "r--", label="Perfect agreement")
    plt.xlabel("CPCB Ground Truth PM2.5 (μg/m³)")
    plt.ylabel("OpenWeatherMap PM2.5 (μg/m³)")
    plt.title("OpenWeatherMap vs CPCB Ground Station — Bengaluru")
    plt.legend()
    plt.tight_layout()
    plt.savefig("cpcb_validation.png", dpi=150)
    print("\nSaved plot: cpcb_validation.png")

    return {"MAE": mae, "RMSE": rmse, "bias": bias, "correlation": corr}


if __name__ == "__main__":
    merged = load_and_align()
    if len(merged) < 24:
        print("⚠️  Fewer than 24 matched hours — collect more overlapping data before drawing conclusions.")
    compare(merged)