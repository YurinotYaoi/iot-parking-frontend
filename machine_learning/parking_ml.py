import argparse
import json
import os
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def load_local_env() -> None:
	"""Load simple KEY=VALUE entries from the project's .env.local file."""
	env_path = Path(__file__).resolve().parents[1] / ".env.local"
	if not env_path.exists():
		return

	for line in env_path.read_text(encoding="utf-8").splitlines():
		line = line.strip()
		if not line or line.startswith("#") or "=" not in line:
			continue

		key, value = line.split("=", 1)
		value = value.strip().strip('"').strip("'")
		os.environ.setdefault(key.strip(), value)


def fetch_sensor_history(layout_id: str | None = None) -> pd.DataFrame:
	"""Fetch sensor history from Firebase Realtime Database as a DataFrame."""
	load_local_env()

	database_url = os.getenv("FIREBASE_DATABASE_URL") or os.getenv(
		"NEXT_PUBLIC_FIREBASE_DATABASE_URL"
	)
	if not database_url:
		raise RuntimeError(
			"Set FIREBASE_DATABASE_URL or NEXT_PUBLIC_FIREBASE_DATABASE_URL."
		)

	path = "sensorHistory"
	if layout_id:
		path = f"{path}/{layout_id}"

	url = f"{database_url.rstrip('/')}/{path}.json"
	query = {}
	database_secret = os.getenv("FIREBASE_DATABASE_SECRET")
	if database_secret:
		query["auth"] = database_secret
	if query:
		url = f"{url}?{urlencode(query)}"

	request = Request(url, headers={"Accept": "application/json"})
	with urlopen(request, timeout=30) as response:
		data = json.loads(response.read().decode("utf-8")) or {}

	records = []
	if layout_id:
		records = [
			{"id": record_id, "layoutId": layout_id, **record}
			for record_id, record in data.items()
			if isinstance(record, dict)
		]
	else:
		for current_layout_id, layout_history in data.items():
			if not isinstance(layout_history, dict):
				continue
			records.extend(
				{
					"id": record_id,
					"layoutId": current_layout_id,
					**record,
				}
				for record_id, record in layout_history.items()
				if isinstance(record, dict)
			)

	return pd.DataFrame(records)


def create_feature_data(sensor_history: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
	"""Create chronological occupancy lag features."""
	if sensor_history.empty:
		return sensor_history.copy(), []

	data = sensor_history.copy()
	data["timestamp"] = pd.to_numeric(data["timestamp"], errors="coerce")
	data["occupancyRate"] = pd.to_numeric(data["occupancyRate"], errors="coerce")
	data = data.dropna(subset=["timestamp", "occupancyRate"])
	data = data.sort_values(["layoutId", "timestamp"]).reset_index(drop=True)

	lag_columns = {
		"occupancy_5m_ago": 1,
		"occupancy_10m_ago": 2,
		"occupancy_15m_ago": 3,
		"occupancy_30m_ago": 6,
	}

	for column, periods in lag_columns.items():
		data[column] = data.groupby("layoutId")["occupancyRate"].shift(periods)

	return data, list(lag_columns)


def create_training_data(sensor_history: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
	"""Create lag features and a 30-minute-ahead occupancy target."""
	data, feature_columns = create_feature_data(sensor_history)
	if not feature_columns:
		return data, feature_columns

	data["targetOccupancy"] = data.groupby("layoutId")["occupancyRate"].shift(-6)
	data = data.dropna(subset=feature_columns + ["targetOccupancy"])
	return data, feature_columns


def train_random_forest(training_data: pd.DataFrame, feature_columns: list[str]):
	"""Train and evaluate a Random Forest using a chronological holdout set."""
	if len(training_data) < 2:
		raise ValueError("At least two complete records are required to train the model.")

	split_index = max(1, int(len(training_data) * 0.8))
	if split_index == len(training_data):
		split_index -= 1

	train_data = training_data.iloc[:split_index]
	test_data = training_data.iloc[split_index:]
	model = RandomForestRegressor(
		n_estimators=200,
		min_samples_leaf=1,
		max_features=1.0,
		random_state=42,
	)
	model.fit(train_data[feature_columns], train_data["targetOccupancy"])

	predictions = model.predict(test_data[feature_columns])
	target_variance = test_data["targetOccupancy"].var()
	metrics = {
		"mae": mean_absolute_error(test_data["targetOccupancy"], predictions),
		"rmse": mean_squared_error(test_data["targetOccupancy"], predictions) ** 0.5,
		"r2": r2_score(test_data["targetOccupancy"], predictions)
		if target_variance > 1e-12
		else None,
	}
	return model, metrics


def main() -> None:
	parser = argparse.ArgumentParser(description="Train a 30-minute occupancy predictor.")
	parser.add_argument(
		"--layout-id",
		help="Only fetch history for one layout; omit to fetch all layouts.",
	)
	parser.add_argument(
		"--json",
		action="store_true",
		help="Print a machine-readable prediction response for the dashboard API.",
	)
	args = parser.parse_args()

	sensor_history = fetch_sensor_history(args.layout_id)
	feature_data, feature_columns = create_feature_data(sensor_history)
	training_data, feature_columns = create_training_data(sensor_history)
	if not feature_columns or training_data.empty:
		raise ValueError("Not enough sensor history to create training records.")

	model, metrics = train_random_forest(training_data, feature_columns)
	latest_features = feature_data.dropna(subset=feature_columns).tail(1)
	if latest_features.empty:
		raise ValueError("Not enough recent history to create a prediction.")

	predicted_occupancy = float(model.predict(latest_features[feature_columns])[0])
	latest_record = latest_features.iloc[0]
	prediction = {
		"layoutId": args.layout_id,
		"predictedOccupancy": max(0.0, min(1.0, predicted_occupancy)),
		"predictedAvailableSlots": max(
			0,
			round(float(latest_record.get("totalSlots", 0)) * (1 - predicted_occupancy)),
		),
		"horizonMinutes": 30,
		"trainingRecords": len(training_data),
		"metrics": metrics,
	}
	if args.json:
		print(json.dumps(prediction))
		return

	print(f"Training records: {len(training_data)}")
	print(f"Features: {', '.join(feature_columns)}")
	print(
		"Metrics:",
		{
			key: round(value, 4) if value is not None else None
			for key, value in metrics.items()
		},
	)
	print(f"Latest prediction: {prediction['predictedOccupancy']:.4f}")


if __name__ == "__main__":
	main()

