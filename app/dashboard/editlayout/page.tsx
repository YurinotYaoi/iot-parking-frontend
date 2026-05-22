"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Grid from "@/components/layout/Grid";
import Toolbar from "@/components/layout/Toolbar";
import AvailableSpots from "@/components/layout/AvailableSpots";
import { useGrid } from "@/hooks/useGrid";
import { CellType, SpotData, GridType } from "@/models/layout";
import { getLayoutById, updateLayout } from "@/services/layoutService";
import { auth } from "@/lib/configs/firebaseClient";
import { useSensorMap } from "@/hooks/useSensorMap";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function EditLayoutPage() {
    useEffect(() => {
    document.title = "Edit Layout";
  }, []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const layoutId = searchParams.get("id");

  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(8);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [initialGrid, setInitialGrid] = useState<GridType | null>(null);

  const { grid, updateCell, resizeGrid, clearCell, getPlacedSpots } = useGrid(
    rows,
    cols,
    initialGrid || undefined
  );

  const [selectedTool, setSelectedTool] = useState<CellType | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<SpotData | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { sensorMap } = useSensorMap();

  const placedSpots = getPlacedSpots();

  // Fetch layout data
  useEffect(() => {
    if (!layoutId) {
      setError("No layout ID provided");
      setLoading(false);
      return;
    }

    const fetchLayout = async () => {
      try {
        const data = await getLayoutById(layoutId);
        if (!data) {
          throw new Error("Layout not found");
        }

        setName(data.layoutName || "");
        setNotes(data.notes || "");
        const rowCount = data.totalRows || 5;
        const colCount = data.totalColumns || 8;
        setRows(rowCount);
        setCols(colCount);

        if (data.grid) {
          setInitialGrid(data.grid);
        }
      } catch (err) {
        console.error("Error fetching layout:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch layout");
      } finally {
        setLoading(false);
      }
    };

    fetchLayout();
  }, [layoutId]);

  const handleRowsChange = (value: number) => {
    if (value > 0) {
      setRows(value);
      resizeGrid(value, cols);
    }
  };

  const handleColsChange = (value: number) => {
    if (value > 0) {
      setCols(value);
      resizeGrid(rows, value);
    }
  };

  const handleSelectSpot = (spot: SpotData) => {
    setSelectedSpot(spot);
    setSelectedTool(null);
  };

  const handleGridCellClick = (rowIndex: number, colIndex: number) => {
    if (selectedSpot) {
      updateCell(rowIndex, colIndex, "slot", selectedSpot);
      setSelectedSpot(null);
    } else if (selectedTool) {
      updateCell(rowIndex, colIndex, selectedTool);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Layout name is required");
      return;
    }

    if (!layoutId) {
      setError("No layout ID found");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Not authenticated");
      }

      const updates = {
        layoutName: name,
        notes,
        totalRows: rows,
        totalColumns: cols,
        grid,
      };

      await updateLayout(layoutId, updates);

      toast.success("Layout updated successfully!");
      router.push("/dashboard/layout");
    } catch (err) {
      console.error("Error saving layout:", err);
      setError(err instanceof Error ? err.message : "Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    toast("Unsaved changes will be lost.", {
      action: { label: "Leave anyway", onClick: () => router.push("/dashboard/layout") },
      cancel: { label: "Stay", onClick: () => {} },
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen dark:bg-slate-950 dark:text-slate-100">
        <div className="text-lg">Loading layout...</div>
      </div>
    );
  }

  if (!layoutId) {
    return (
      <div className="p-6 flex items-center justify-center h-screen dark:bg-slate-950">
        <div className="text-lg text-red-600 dark:text-red-400">No layout ID provided</div>
      </div>
    );
  }

  return (
    <main className="flex flex-col w-full items-center justify-center">
      <div className="w-screen max-w-600 flex-rows h-213">

        <div className="p-2 flex flex-col gap-6 dark:text-slate-100 dark:bg-slate-950 h-213">
          {/* Header with title and actions */}
          <div className="w-full flex border-2 border-gray-800 rounded-md p-1 justify-between">
            <h1 className="font-bold dark:text-slate-100 h-full flex items-center pl-2">
              Edit Layout
            </h1>
            <div className="flex gap-1">
              <Button
                onClick={handleCancel}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="shadow-md active:shadow-inner active:translate-y-px px-6 py-2 bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded">
              {error}
            </div>
          )}

          
          <div className="flex gap-6 flex-1 overflow-hidden ">
            
            {/* LEFT - GRID AREA - TOOLBAR AND GRID */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden border-2 border-gray-800 rounded-md p-2">
              <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
              <div className="flex flex-col gap-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedSpot ? `Selected Spot: ${selectedSpot.slotName}` : "Select a tool or spot to place on grid"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Right-click to clear cells</p>
              </div>

              <Grid
                grid={grid}
                selectedTool={selectedTool}
                updateCell={(row, col) => handleGridCellClick(row, col)}
                clearCell={clearCell}
                sensorMap={sensorMap}
              />

              <div className="text-sm text-slate-600 dark:text-slate-400">
                Grid Size: {rows} rows × {cols} columns = {rows * cols} cells
              </div>
            </div>

            {/* RIGHT - CONTROL PANEL */}
            <div className="w-80 flex flex-col gap-6 overflow-y-auto dark:text-slate-100">
              {/* LAYOUT INFO */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-700">
                <h2 className="font-semibold mb-4 dark:text-slate-100">Layout Info</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="layout-name" className="block text-sm font-medium mb-1 dark:text-slate-100">Layout Name</label>
                    <input
                      id="layout-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter layout name"
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="layout-notes" className="block text-sm font-medium mb-1 dark:text-slate-100">Notes</label>
                    <textarea
                      id="layout-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter layout notes"
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 h-20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* GRID CONFIGURATION */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-700">
                <h2 className="font-semibold mb-4 dark:text-slate-100">Grid Configuration</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="grid-rows" className="block text-sm font-medium mb-1 dark:text-slate-100">Rows</label>
                    <input
                      id="grid-rows"
                      type="number"
                      min="1"
                      max="50"
                      value={rows}
                      onChange={(e) => handleRowsChange(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="grid-cols" className="block text-sm font-medium mb-1 dark:text-slate-100">Columns</label>
                    <input
                      id="grid-cols"
                      type="number"
                      min="1"
                      max="50"
                      value={cols}
                      onChange={(e) => handleColsChange(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* AVAILABLE SPOTS */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <AvailableSpots
                  placedSpotIds={placedSpots}
                  onSelectSpot={handleSelectSpot}
                  currentLayoutId={layoutId}
                />
                {selectedSpot && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Current Selection</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{selectedSpot.slotName}</p>
                    <small className="text-blue-600 dark:text-blue-300">Click on a grid cell to place it</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
