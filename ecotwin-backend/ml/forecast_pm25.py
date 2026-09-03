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
from sklearn.ensemble import RandomForestRegressor, AdaBoostRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt

# Benchmarked against: Benny, N., Devassy, J., Stephen, R., Gobinath, R.,
# & Siva Balan, R.V. (2026). "PM2.5 Prediction Models: A Systematic and
# Comparative Review." In their comparative review, AdaBoost achieved the
# best RMSE (2.9) and R² (0.96) among all surveyed models, while
# Klingner-FNN achieved the best MAE (~2.74-3.46). We include AdaBoost
# here as a direct benchmark against that finding, and report R² (not
# just MAE/RMSE) to keep results comparable to this literature.

# DATA_PATH = "data/bengaluru_historical.csv"  # Kaggle CPCB dataset (large-volume training data)
DATA_PATH = "data/ecotwin_history.csv"          # your own live-logged EcoTwin/MongoDB data
FORECAST_HORIZON_HOURS = 3  # predict PM2.5 this many hours ahead


def normalize_columns(df):
    """
    Detects which dataset format this is and renames columns to a common
    internal schema so the rest of the pipeline doesn't care which source
    it came from.

    Kaggle CPCB format (city_hour.csv): Datetime, City, PM2.5, PM10, NO,
    NO2, NOx, NH3, CO, SO2, O3, Benzene, Toluene, Xylene, AQI, AQI_Bucket
    — NOTE: no weather columns (temp/humidity/wind/rain) in this dataset.

    EcoTwin MongoDB export format: timestamp, lat, lon, pm2_5, pm10, co,
    no2, o3, so2, aqi_category, temp_c, humidity, wind_speed, rain_1h,
    weather_condition — has weather columns.
    """
    if "Datetime" in df.columns and "PM2.5" in df.columns:
        # Kaggle CPCB format
        rename_map = {
            "Datetime": "timestamp", "PM2.5": "pm2_5", "PM10": "pm10",
            "NO2": "no2", "SO2": "so2", "O3": "o3", "CO": "co",
            "NO": "no", "NOx": "nox", "NH3": "nh3",
        }
        df = df.rename(columns={k: v for k, v in rename_map.items() if k in df.columns})
    elif "timestamp" in df.columns and "pm2_5" in df.columns:
        pass  # already in EcoTwin's internal format, nothing to rename
    else:
        raise ValueError(
            "Unrecognized CSV format — expected either Kaggle CPCB columns "
            "(Datetime, PM2.5, ...) or EcoTwin export columns (timestamp, "
            "pm2_5, ...). Check the file's actual header row."
        )
    return df


def load_and_prepare(path):
    df = pd.read_csv(path)
    df = normalize_columns(df)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)
    df = df.dropna(subset=["pm2_5"])

    # --- Resample to hourly granularity ---
    # IMPORTANT: OpenWeatherMap's Air Pollution API updates its underlying
    # model roughly once per hour, not continuously. Logging every 15 min
    # (as logHistory.js does) mostly captures repeated/duplicate values
    # between real updates — confirmed empirically: on this project's own
    # dataset, ~93% of consecutive 15-min PM2.5 readings were identical.
    # Training lag/forecast features on that raw 15-min data lets a trivial
    # "copy the last value" (naive persistence) model look artificially
    # perfect, since it's mostly just predicting an unchanged value. We
    # resample to hourly (mean of whatever samples fell in that hour) so
    # the model is learning from genuine changes in the underlying data,
    # not polling artifacts. This also makes the forecast horizon
    # (FORECAST_HORIZON_HOURS) meaningful in real time again.
    df = df.set_index("timestamp")
    # Union of possible columns across both dataset formats — whichever
    # exist in this particular file get used, others are simply skipped.
    candidate_cols = ["pm2_5", "pm10", "co", "no2", "o3", "so2", "no", "nox", "nh3",
                       "temp_c", "humidity", "wind_speed", "rain_1h"]
    numeric_cols = [c for c in candidate_cols if c in df.columns]
    df = df[numeric_cols].resample("1h").mean().dropna(subset=["pm2_5"])
    df = df.reset_index()

    # Time-based features — traffic/industrial activity follows daily rhythms
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)

    # Now working in hourly rows, so 1 row = 1 hour (not 4 rows/hour anymore)
    df["pm25_lag_1h"] = df["pm2_5"].shift(1)
    df["pm25_lag_3h"] = df["pm2_5"].shift(3)
    df["pm25_lag_6h"] = df["pm2_5"].shift(6)

    # Target: PM2.5 N hours in the future
    df["target"] = df["pm2_5"].shift(-FORECAST_HORIZON_HOURS)

    df = df.dropna(subset=["pm25_lag_1h", "pm25_lag_3h", "pm25_lag_6h", "target"])

    # --- Clip physically implausible sensor spikes ---
    # Raw CPCB ground-station data is known to contain occasional extreme
    # outlier readings from sensor malfunctions (values in the thousands
    # of µg/m³ are not physically realistic ambient PM2.5 — India's worst
    # recorded episodes, e.g. Delhi during Diwali, still generally stay
    # under ~1000). Left uncorrected, these spikes disproportionately
    # destabilize boosting methods like AdaBoost, which repeatedly
    # up-weight "hard" (i.e. outlier) examples each round. We clip to the
    # 99.5th percentile rather than deleting rows, to preserve genuinely
    # high-but-real pollution events while removing sensor-error spikes.
    pm25_cap = df["pm2_5"].quantile(0.995)
    for col in ["pm2_5", "pm25_lag_1h", "pm25_lag_3h", "pm25_lag_6h", "target"]:
        df[col] = df[col].clip(upper=pm25_cap)

    # Stash which auxiliary columns are actually usable as features. Only
    # keep columns that are at least 70% populated after hourly resampling
    # — a column that's mostly NaN (common in the Kaggle dataset for
    # things like Benzene/Toluene/Xylene, and sometimes NO/NOx/NH3) adds
    # more noise than signal once imputed, and can silently degrade the
    # model rather than helping it.
    completeness_threshold = 0.70
    df.attrs["available_aux_features"] = [
        c for c in ["pm10", "co", "no2", "o3", "so2", "no", "nox", "nh3",
                     "temp_c", "humidity", "wind_speed", "rain_1h"]
        if c in df.columns and df[c].notna().mean() >= completeness_threshold
    ]
    return df


def train_and_evaluate(df):
    core_features = ["pm2_5", "pm25_lag_1h", "pm25_lag_3h", "pm25_lag_6h",
                      "hour", "day_of_week", "is_weekend"]
    aux_features = df.attrs.get("available_aux_features", [])
    features = core_features + aux_features
    print(f"Using features: {features}")

    X = df[features]
    y = df["target"]

    # Chronological split — critical for time series, see module docstring
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx].copy(), X.iloc[split_idx:].copy()
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    # Impute any remaining gaps (columns kept above 70% complete can still
    # have some missing values) using TRAINING-set medians only — using
    # test-set statistics here would leak future information into the
    # imputation, the same leakage risk the chronological split above is
    # already guarding against.
    train_medians = X_train.median()
    X_train = X_train.fillna(train_medians)
    X_test = X_test.fillna(train_medians)

    results = {}

    def score(name, y_true, y_pred):
        results[name] = {
            "MAE": mean_absolute_error(y_true, y_pred),
            "RMSE": np.sqrt(mean_squared_error(y_true, y_pred)),
            "R2": r2_score(y_true, y_pred),
        }

    # Baseline: naive persistence (tomorrow = today) — always report this,
    # reviewers want to see your model beats the trivial baseline
    naive_pred = X_test["pm2_5"].values
    score("Naive Persistence", y_test, naive_pred)

    # Linear Regression baseline
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    score("Linear Regression", y_test, lr.predict(X_test))

    # Random Forest — captures non-linear weather/PM2.5 interactions
    rf = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    score("Random Forest", y_test, rf_pred)

    # AdaBoost — direct benchmark against Benny et al. (2026), where this
    # was the top-performing model in their surveyed review (RMSE 2.9,
    # R² 0.96 on their European datasets). Comparing against it here
    # tests whether that result transfers to Bengaluru's conditions.
    # Configured conservatively (shallow base tree, low learning rate,
    # loss="linear") since AdaBoost is sensitive to outliers, and raw
    # CPCB sensor data can contain extreme spikes even after clipping.
    ada = AdaBoostRegressor(
        estimator=DecisionTreeRegressor(max_depth=3),
        n_estimators=100,
        learning_rate=0.03,
        loss="linear",
        random_state=42,
    )
    ada.fit(X_train, y_train)
    ada_pred = ada.predict(X_test)
    score("AdaBoost", y_test, ada_pred)

    print(f"\n=== {FORECAST_HORIZON_HOURS}-Hour PM2.5 Forecast — Model Comparison ===")
    print(f"{'Model':<20} {'MAE':>8} {'RMSE':>8} {'R2':>8}")
    for name, m in results.items():
        print(f"{name:<20} {m['MAE']:>8.2f} {m['RMSE']:>8.2f} {m['R2']:>8.3f}")

    print(
        "\nBenchmark reference (Benny et al., 2026, European datasets): "
        "AdaBoost RMSE=2.90, R²=0.96 | Klingner-FNN best MAE≈2.74-3.46. "
        "Compare the numbers above against these to discuss whether "
        "performance transfers to Bengaluru's tropical/monsoon conditions."
    )

    # Feature importance — good figure for the paper, shows what actually
    # drives PM2.5 changes (often: wind speed + hour-of-day dominate)
    importance = pd.Series(rf.feature_importances_, index=features).sort_values(ascending=False)
    print("\nFeature importance (Random Forest):")
    print(importance)

    # Plot predicted vs actual for whichever model scored best on RMSE —
    # not hardcoded, since AdaBoost may now outperform Random Forest
    preds_by_model = {"Random Forest": rf_pred, "AdaBoost": ada_pred, "Linear Regression": lr.predict(X_test)}
    best_model_name = min(results, key=lambda k: results[k]["RMSE"] if k in preds_by_model else np.inf)
    best_pred = preds_by_model.get(best_model_name, rf_pred)

    plt.figure(figsize=(12, 5))
    plt.plot(y_test.values, label="Actual PM2.5", alpha=0.7)
    plt.plot(best_pred, label=f"{best_model_name} Predicted", alpha=0.7)
    plt.title(f"{FORECAST_HORIZON_HOURS}-Hour PM2.5 Forecast: Predicted vs Actual (Bengaluru)")
    plt.xlabel("Test sample (chronological)")
    plt.ylabel("PM2.5 (μg/m³)")
    plt.legend()
    plt.tight_layout()
    plt.savefig("forecast_results.png", dpi=150)
    print(f"\nSaved plot: forecast_results.png (best model: {best_model_name})")

    return results, importance


def compare_against_literature(results):
    """
    Generates a comparison table against Benny et al. (2026)'s reported
    benchmarks, plus auto-generated discussion text for the paper.

    IMPORTANT — research integrity note: this function reports whatever
    the actual numbers are. It does not, and should not, be edited to
    force a "we win" narrative. If your model underperforms the
    literature benchmark, that is itself a valid and interesting result
    (e.g., it may show that models tuned on European air-quality data
    don't transfer well to Bengaluru's tropical/monsoon conditions,
    different pollution sources, or your shorter data collection window).
    Report the real numbers either way — reviewers trust honest,
    well-discussed results far more than suspiciously perfect ones.
    """
    # Benchmarks as reported in Benny et al. (2026), Table/Figs 1-3.
    # These were measured on their own (mostly European) datasets, not
    # Bengaluru — note this caveat explicitly in your paper's discussion.
    LITERATURE_BENCHMARKS = {
        "AdaBoost (Benny et al.)":        {"RMSE": 2.90, "MAE": None, "R2": 0.96},
        "Klingner-FNN (Benny et al.)":    {"RMSE": None, "MAE": 2.74, "R2": 0.73},  # best-MAE variant reported
        "LSTM hourly (Benny et al.)":     {"RMSE": None, "MAE": 3.46, "R2": 0.86},
        "Random Forest hourly (Benny et al.)": {"RMSE": None, "MAE": 5.06, "R2": 0.52},
        "Naive daily (Benny et al.)":     {"RMSE": None, "MAE": 7.22, "R2": None},
    }

    print("\n" + "=" * 70)
    print("COMPARISON AGAINST BENNY ET AL. (2026) LITERATURE BENCHMARKS")
    print("=" * 70)
    print(f"{'Model':<32} {'RMSE':>8} {'MAE':>8} {'R2':>8}")
    print("-" * 70)

    print("-- This work (Bengaluru, EcoTwin) --")
    for name, m in results.items():
        print(f"{name:<32} {m['RMSE']:>8.2f} {m['MAE']:>8.2f} {m['R2']:>8.3f}")

    print("\n-- Literature (Benny et al., 2026, mostly European datasets) --")
    for name, m in LITERATURE_BENCHMARKS.items():
        rmse_s = f"{m['RMSE']:.2f}" if m["RMSE"] is not None else "  n/a"
        mae_s = f"{m['MAE']:.2f}" if m["MAE"] is not None else "  n/a"
        r2_s = f"{m['R2']:.3f}" if m["R2"] is not None else "  n/a"
        print(f"{name:<32} {rmse_s:>8} {mae_s:>8} {r2_s:>8}")

    # Auto-generate honest discussion text based on YOUR best model vs
    # the literature's best reported AdaBoost result
    your_best_name = min(results, key=lambda k: results[k]["RMSE"])
    your_best = results[your_best_name]
    lit_best_rmse = 2.90
    lit_best_r2 = 0.96

    print("\n" + "-" * 70)
    print("AUTO-DRAFTED DISCUSSION TEXT (edit before using in your paper)")
    print("-" * 70)

    if your_best["RMSE"] < lit_best_rmse:
        verdict = (
            f"Our best-performing model ({your_best_name}) achieved a lower RMSE "
            f"({your_best['RMSE']:.2f}) than the top-performing model reported by "
            f"Benny et al. (AdaBoost, RMSE=2.90). This suggests that, for this "
            f"forecast horizon and dataset, our feature set (lag features, "
            f"time-of-day, weather covariates) captured Bengaluru-specific PM2.5 "
            f"dynamics effectively. However, this comparison should be read with "
            f"caution: the literature benchmark was measured on different, "
            f"European datasets with different sampling durations and pollution "
            f"regimes — a lower RMSE here is not proof of a categorically better "
            f"model, only that it performs well on this specific dataset."
        )
    elif your_best["RMSE"] <= lit_best_rmse * 1.5:
        verdict = (
            f"Our best-performing model ({your_best_name}) achieved an RMSE of "
            f"{your_best['RMSE']:.2f}, within range of though somewhat higher than "
            f"the top literature benchmark (AdaBoost, RMSE=2.90, Benny et al. "
            f"2026). This is a reasonable result given our comparatively short "
            f"data collection window ([X] days) versus typical training sets in "
            f"the literature, and suggests the approach is sound but would "
            f"benefit from a longer collection period to capture more seasonal "
            f"and diurnal variation."
        )
    else:
        verdict = (
            f"Our best-performing model ({your_best_name}) achieved an RMSE of "
            f"{your_best['RMSE']:.2f}, notably higher than the top literature "
            f"benchmark (AdaBoost, RMSE=2.90, Benny et al. 2026). We attribute "
            f"this primarily to our limited data collection window ([X] days) "
            f"compared to the larger training datasets used in prior work, and "
            f"to Bengaluru's distinct pollution sources and monsoon-driven "
            f"weather variability, which may require different or additional "
            f"features than those effective in the European datasets surveyed "
            f"by Benny et al. This gap itself is a useful finding: it suggests "
            f"published PM2.5 model performance does not automatically transfer "
            f"across regions, reinforcing the need for region-specific "
            f"validation that this work provides."
        )

    print(verdict)
    print("\n(Remember to replace '[X] days' with your actual collection duration)")

    # --- Bar chart: your models vs. literature benchmarks, side by side ---
    # Mirrors the RMSE/R2 bar-chart style used in Benny et al.'s Figs 1-3,
    # so this figure drops directly into your paper for visual comparison.
    _plot_comparison_bars(results, LITERATURE_BENCHMARKS, metric="RMSE",
                           ylabel="RMSE (μg/m³)", filename="comparison_rmse.png",
                           lower_is_better=True)
    _plot_comparison_bars(results, LITERATURE_BENCHMARKS, metric="R2",
                           ylabel="R² Score", filename="comparison_r2.png",
                           lower_is_better=False)

    return LITERATURE_BENCHMARKS


def _plot_comparison_bars(results, literature, metric, ylabel, filename, lower_is_better):
    names, values, colors = [], [], []

    for name, m in results.items():
        if m.get(metric) is not None:
            names.append(f"{name}\n(this work)")
            values.append(m[metric])
            colors.append("#2E86AB")  # blue = this work

    for name, m in literature.items():
        if m.get(metric) is not None:
            names.append(name)
            values.append(m[metric])
            colors.append("#A23B72")  # magenta = literature

    if not values:
        print(f"Skipping {metric} comparison plot — no values available.")
        return

    plt.figure(figsize=(max(10, len(names) * 1.1), 6))
    bars = plt.bar(range(len(names)), values, color=colors)
    plt.xticks(range(len(names)), names, rotation=45, ha="right", fontsize=8)
    plt.ylabel(ylabel)
    plt.title(f"{metric.replace('R2', 'R²')} Comparison — This Work vs. Benny et al. (2026) Literature")

    for bar, val in zip(bars, values):
        plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height(),
                  f"{val:.2f}", ha="center", va="bottom", fontsize=8)

    # Legend
    from matplotlib.patches import Patch
    plt.legend(handles=[
        Patch(color="#2E86AB", label="This work (Bengaluru)"),
        Patch(color="#A23B72", label="Literature (Benny et al., 2026)"),
    ])

    plt.tight_layout()
    plt.savefig(filename, dpi=150)
    print(f"Saved plot: {filename}")


if __name__ == "__main__":
    df = load_and_prepare(DATA_PATH)
    print(f"Loaded {len(df)} usable hourly rows after resampling + feature engineering.")
    if len(df) < 100:
        print(
            "\n⚠️  Warning: fewer than 100 hourly rows (~4 days). Results will "
            "be unreliable. Let logHistory.js run longer — aim for 300+ hourly "
            "rows (~2 weeks) for a defensible paper result."
        )
    results, importance = train_and_evaluate(df)
    compare_against_literature(results)