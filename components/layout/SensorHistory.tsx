
'use client';

import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { rtdb, auth } from '@/lib/configs/firebaseClient';
import { DataSnapshot } from "firebase/database";

type HistoryEntry = {
  id: string;
  layoutId?: string;
  timestamp?: number;
  day?: string;
  hour?: number;
  totalSlots?: number;
  occupiedSlots?: number;
  vacantSlots?: number;
  occupancyRate?: number;
};

interface SensorHistoryProps {
  readonly layoutId?: string;
  readonly refreshKey?: number;
}


function sortByTimestamp(entries: HistoryEntry[]): HistoryEntry[] {
  return entries.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
}

function parseSnapshotToHistoryEntries(snapshot: DataSnapshot): HistoryEntry[] {
  const data = snapshot.val() || {};
  const entries = Object.entries(data).map(([id, value]) => ({
    id,
    ...(value as Record<string, unknown>),
  }));
  return sortByTimestamp(entries);
}


export default function SensorHistory({ layoutId, refreshKey = 0 }: SensorHistoryProps ) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    if (!layoutId) {
      setHistory([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const historyRef = ref(rtdb, `sensorHistory/${layoutId}`);
    const unsub = onValue(
      historyRef,
      (snapshot) => {
        const entries = parseSnapshotToHistoryEntries(snapshot);
        setHistory(entries);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Unable to load sensor history');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [layoutId, refreshKey]);

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleString();
  };

  const formatRate = (rate?: number) => {
    if (rate === undefined || rate === null) return '—';
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (!layoutId) {
    return <div className="text-sm text-gray-500">Select a layout to view sensor history.</div>;
  }

  return (
    <div className="w-full overflow-auto rounded-md border border-gray-300 bg-white dark:bg-slate-900 dark:border-slate-700">
      <div className="p-3 border-b border-gray-300 dark:border-slate-700">
        <h2 className="text-lg font-semibold">Sensor History</h2>
      </div>

      {loading && <div className="p-4 text-sm text-gray-500">Loading history...</div>}
      {error && <div className="p-4 text-sm text-red-500">{error}</div>}

      {!loading && !error && history.length === 0 && (
        <div className="p-4 text-sm text-gray-500">No history found for this layout yet.</div>
      )}

      {!loading && history.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 dark:bg-slate-800">
            <tr>
              <th className="border-b border-gray-300 dark:border-slate-700 px-3 py-2 text-left">Timestamp</th>
              <th className="border-b border-gray-300 dark:border-slate-700 px-3 py-2 text-left">Total</th>
              <th className="border-b border-gray-300 dark:border-slate-700 px-3 py-2 text-left">Occupied</th>
              <th className="border-b border-gray-300 dark:border-slate-700 px-3 py-2 text-left">Vacant</th>
              <th className="border-b border-gray-300 dark:border-slate-700 px-3 py-2 text-left">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id} className="odd:bg-white even:bg-gray-50 dark:odd:bg-slate-900 dark:even:bg-slate-800">
                <td className="border-b border-gray-200 dark:border-slate-700 px-3 py-2">{formatTime(entry.timestamp)}</td>
                <td className="border-b border-gray-200 dark:border-slate-700 px-3 py-2">{entry.totalSlots ?? 0}</td>
                <td className="border-b border-gray-200 dark:border-slate-700 px-3 py-2">{entry.occupiedSlots ?? 0}</td>
                <td className="border-b border-gray-200 dark:border-slate-700 px-3 py-2">{entry.vacantSlots ?? 0}</td>
                <td className="border-b border-gray-200 dark:border-slate-700 px-3 py-2">{formatRate(entry.occupancyRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}