import argparse
import json
import os
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import pandas as pd


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


def main() -> None:
	parser = argparse.ArgumentParser(description="Load parking sensor history.")
	parser.add_argument(
		"--layout-id",
		help="Only fetch history for one layout; omit to fetch all layouts.",
	)
	args = parser.parse_args()

	sensor_history = fetch_sensor_history(args.layout_id)
	print(sensor_history.to_string(index=False))


if __name__ == "__main__":
	main()

