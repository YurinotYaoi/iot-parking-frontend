"use client";

import { Button } from "@/components/ui/button";
import SensorHistory from "@/components/layout/SensorHistory";
import { Spinner } from "@/components/Spinner";
import { auth } from "@/lib/configs/firebaseClient";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  AUTO_CAPTURE_MS,
  getAutoCaptureState,
  getSecondsUntilNextCapture,
  startAutoCapture,
  stopAutoCapture,
} from "@/lib/sensorHistoryAutoCapture";

interface LayoutOption {
  layoutId: string;
  layoutName: string;
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

          {selectedLayoutId && <SensorHistory layoutId={selectedLayoutId} refreshKey={refreshKey} />}
        </div>
      </div>
    </main>
  );
}