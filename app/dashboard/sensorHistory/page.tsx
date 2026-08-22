"use client";

import { Button } from "@/components/ui/button";
import SensorHistory, { HistoryEntry } from "@/components/layout/SensorHistory";
import { Spinner } from "@/components/Spinner";
import { auth } from "@/lib/configs/firebaseClient";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  AUTO_CAPTURE_MS,
  getAutoCaptureState,
  startAutoCapture,
  stopAutoCapture,
} from "@/lib/sensorHistoryAutoCapture";

interface LayoutOption {
  layoutId: string;
  layoutName: string;
}

interface AiPrediction {
  predictedOccupancy: number;
  predictedAvailableSlots: number;
  horizonMinutes: number;
  trainingRecords: number;
  metrics: {
    mae: number;
    rmse: number;
    r2: number | null;
  };
}

function buildHistoryReport(history: HistoryEntry[]) {
  const records = history
    .filter((entry) => typeof entry.timestamp === "number" && typeof entry.occupancyRate === "number")
    .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  if (!records.length) return null;

  const latest = records.at(-1)!;
  const latestOccupancy = Math.max(0, Math.min(1, latest.occupancyRate ?? 0));
  const recent = records.slice(-3).map((entry) => entry.occupancyRate ?? 0);
  const previous = records.slice(-6, -3).map((entry) => entry.occupancyRate ?? 0);
  const recentAverage = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const previousAverage = previous.length
    ? previous.reduce((sum, value) => sum + value, 0) / previous.length
    : recentAverage;
  const changePerRecord = recentAverage - previousAverage;
  const projectedOccupancy = Math.max(0, Math.min(1, latestOccupancy + changePerRecord * 2));

  const hourly = new Map<number, number[]>();
  records.forEach((entry) => {
    if (typeof entry.hour === "number") {
      hourly.set(entry.hour, [...(hourly.get(entry.hour) ?? []), entry.occupancyRate ?? 0]);
    }
  });
  const peak = [...hourly.entries()].sort((a, b) => {
    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    return average(b[1]) - average(a[1]);
  })[0];
  const peakHour = peak?.[0] ?? latest.hour ?? 0;
  const peakOccupancy = peak
    ? peak[1].reduce((sum, value) => sum + value, 0) / peak[1].length
    : latestOccupancy;
  let trend = "stable";
  if (changePerRecord > 0.02) trend = "rising";
  if (changePerRecord < -0.02) trend = "falling";
  const totalSlots = latest.totalSlots ?? 0;

  return {
    latestOccupancy,
    latestAvailable: latest.vacantSlots ?? Math.max(0, totalSlots - (latest.occupiedSlots ?? 0)),
    projectedOccupancy,
    projectedAvailable: Math.max(0, Math.round(totalSlots * (1 - projectedOccupancy))),
    peakHour: new Date(2020, 0, 1, peakHour).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    peakOccupancy,
    trend,
    sampleCount: records.length,
  };
}

export default function SensorHistoryScreen() {
  useEffect(() => {
    document.title = "Sensor History";
  }, []);

  const router = useRouter();
  const [layouts, setLayouts] = useState<LayoutOption[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [nextCaptureAt, setNextCaptureAt] = useState<number | null>(null);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [aiPrediction, setAiPrediction] = useState<AiPrediction | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayouts = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const res = await fetch("/api/layouts?lotId=default-lot-id", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        setLayouts(data as LayoutOption[]);

        if (data.length > 0) {
          setSelectedLayoutId(data[0].layoutId);
        }
      } catch (error) {
        console.error("Failed to load layouts for history", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLayouts();
  }, []);

  const [isNavigating, startTransition] = useTransition();
  const [navTarget, setNavTarget] = useState<string | null>(null);

  const navigateTo = (path: string) => {
    setNavTarget(path);
    startTransition(() => {
      router.push(path);
    });
  };

  const isBackNav = isNavigating && navTarget === "/dashboard";

  const createHistorySnapshot = useCallback(async () => {
    if (!selectedLayoutId) return;

    try {
      setSnapshotSaving(true);
      setSnapshotMessage(null);

      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const token = await user.getIdToken();
      const res = await fetch("/api/sensor-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ layoutId: selectedLayoutId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to create history snapshot");
      }

      setSnapshotMessage("Snapshot created successfully.");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Create history snapshot error:", error);
      setSnapshotMessage(error instanceof Error ? error.message : "Failed to create snapshot");
    } finally {
      setSnapshotSaving(false);
    }
  }, [selectedLayoutId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedState = getAutoCaptureState();
    if (savedState.enabled && savedState.layoutId) {
      setAutoCaptureEnabled(true);
      setSelectedLayoutId(savedState.layoutId);
      setNextCaptureAt(savedState.nextCaptureAt ?? Date.now() + AUTO_CAPTURE_MS);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!autoCaptureEnabled || !selectedLayoutId) {
      stopAutoCapture();
      setNextCaptureAt(null);
      return;
    }

    const state = getAutoCaptureState();
    if (!state.enabled || state.layoutId !== selectedLayoutId) {
      startAutoCapture(selectedLayoutId, async () => {
        await createHistorySnapshot();
      });
    }

    setNextCaptureAt(getAutoCaptureState().nextCaptureAt ?? Date.now() + AUTO_CAPTURE_MS);
  }, [autoCaptureEnabled, selectedLayoutId]);

  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const report = buildHistoryReport(history);

  useEffect(() => {
    if (!selectedLayoutId) {
      setAiPrediction(null);
      return;
    }

    const loadPrediction = async () => {
      try {
        setPredictionLoading(true);
        setPredictionError(null);
        const user = auth.currentUser;
        if (!user) throw new Error("User not authenticated");

        const token = await user.getIdToken();
        const response = await fetch(
          `/api/sensor-history/predict?layoutId=${encodeURIComponent(selectedLayoutId)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = await response.json();
        if (!response.ok) throw new Error(json?.error || "Prediction failed");
        setAiPrediction(json.data as AiPrediction);
      } catch (error) {
        console.error("Load AI parking prediction error:", error);
        setAiPrediction(null);
        setPredictionError(error instanceof Error ? error.message : "Prediction unavailable");
      } finally {
        setPredictionLoading(false);
      }
    };

    loadPrediction();
  }, [selectedLayoutId, refreshKey]);

  useEffect(() => {
    if (!autoCaptureEnabled) {
      setSecondsLeft(0);
      return;
    }

    const updateCountdown = () => {
      const currentState = getAutoCaptureState();
      const nextAt = currentState.nextCaptureAt ?? Date.now() + AUTO_CAPTURE_MS;
      setNextCaptureAt(nextAt);
      setSecondsLeft(Math.max(0, Math.ceil((nextAt - Date.now()) / 1000)));
    };

    updateCountdown();
    const countdownId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(countdownId);
  }, [autoCaptureEnabled]);

  return (
    <main className="flex flex-col w-full items-center justify-center">
      <div className="w-screen max-w-6xl flex flex-col h-full px-4 py-4">
        <div className="mb-4 flex border-2 border-gray-800 rounded-md p-1 gap-1">
          <Button
            onClick={() => navigateTo("/dashboard")}
            disabled={isNavigating}
            className="shadow-md active:shadow-inner active:translate-y-px rounded-sm bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800 disabled:opacity-60"
          >
            {isBackNav ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" label="Going back" />
                Loading…
              </span>
            ) : (
              <>
                <FaArrowLeft className="mr-2" />
                Back
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Sensor History</h1>

          {loading ? (
            <div className="text-sm text-gray-500">Loading layouts...</div>
          ) : layouts.length === 0 ? (
            <div className="text-sm text-gray-500">No layouts found for this lot.</div>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <label htmlFor="layout-select" className="text-sm font-medium">
                Layout
              </label>
              <select
                id="layout-select"
                value={selectedLayoutId}
                onChange={(e) => setSelectedLayoutId(e.target.value)}
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-700"
              >
                {layouts.map((layout) => (
                  <option key={layout.layoutId} value={layout.layoutId}>
                    {layout.layoutName}
                  </option>
                ))}
              </select>

              <Button
                onClick={() => {
                  const nextValue = !autoCaptureEnabled;
                  setAutoCaptureEnabled(nextValue);

                  if (!nextValue) {
                    stopAutoCapture();
                    setNextCaptureAt(null);
                    return;
                  }

                  if (selectedLayoutId) {
                    startAutoCapture(selectedLayoutId, async () => {
                      await createHistorySnapshot();
                    });
                    setNextCaptureAt(Date.now() + AUTO_CAPTURE_MS);
                  }
                }}
                disabled={!selectedLayoutId}
                className={`shadow-md active:shadow-inner active:translate-y-px rounded-sm border border-transparent disabled:opacity-60 ${
                  autoCaptureEnabled
                    ? "bg-green-600 text-white hover:bg-green-700 hover:text-white"
                    : "bg-black text-white hover:bg-white hover:text-black hover:border-black dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800"
                }`}
              >
                {autoCaptureEnabled ? "Auto capture: On" : "Auto capture: Off"}
              </Button>

              <Button
                onClick={createHistorySnapshot}
                disabled={snapshotSaving || !selectedLayoutId}
                className="shadow-md active:shadow-inner active:translate-y-px rounded-sm bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800 disabled:opacity-60"
              >
                {snapshotSaving ? "Creating..." : "Capture now"}
              </Button>
            </div>
          )}

          {autoCaptureEnabled && nextCaptureAt && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Next capture in {secondsLeft}s
            </div>
          )}

          {snapshotMessage && (
            <div className="text-sm text-gray-600 dark:text-gray-300">{snapshotMessage}</div>
          )}

          {report && (
            <section className="border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-orange-600">Analytical report</p>
                  <h2 className="text-xl font-bold">Predictive parking demand</h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Based on {report.sampleCount} snapshots</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="border-l-4 border-orange-500 bg-white p-3 dark:bg-slate-800">
                  <p className="text-xs text-gray-500">Peak parking hour</p>
                  <p className="mt-1 text-lg font-bold">{report.peakHour}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{(report.peakOccupancy * 100).toFixed(0)}% average occupied</p>
                </div>
                <div className="border-l-4 border-red-500 bg-white p-3 dark:bg-slate-800">
                  <p className="text-xs text-gray-500">AI expected congestion</p>
                  <p className="mt-1 text-lg font-bold">
                    {predictionLoading ? "..." : `${((aiPrediction?.predictedOccupancy ?? report.projectedOccupancy) * 100).toFixed(0)}%`}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Random Forest, 30 minutes ahead</p>
                </div>
                <div className="border-l-4 border-green-600 bg-white p-3 dark:bg-slate-800">
                  <p className="text-xs text-gray-500">AI future availability</p>
                  <p className="mt-1 text-lg font-bold">
                    {predictionLoading ? "..." : `${aiPrediction?.predictedAvailableSlots ?? report.projectedAvailable} slots`}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Random Forest estimate</p>
                </div>
                <div className="border-l-4 border-blue-500 bg-white p-3 dark:bg-slate-800">
                  <p className="text-xs text-gray-500">Current behavior</p>
                  <p className="mt-1 text-lg font-bold capitalize">{report.trend} demand</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{report.latestAvailable} slots available now</p>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-3 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-300">
                <span className="font-semibold">Behavior analysis:</span> Demand is {report.trend} across the latest observations, with the busiest recurring hour at {report.peakHour}.
                <span className="ml-1 text-gray-500">{aiPrediction ? `The Random Forest trained on ${aiPrediction.trainingRecords} records and returned MAE ${(aiPrediction.metrics.mae * 100).toFixed(1)} percentage points.` : "The AI forecast is loading from the Python model."}</span>
                {predictionError && <span className="ml-1 text-red-600">{predictionError}</span>}
              </div>
            </section>
          )}

          {selectedLayoutId && (
            <SensorHistory
              layoutId={selectedLayoutId}
              refreshKey={refreshKey}
              onHistoryChange={setHistory}
            />
          )}
        </div>
      </div>
    </main>
  );
}