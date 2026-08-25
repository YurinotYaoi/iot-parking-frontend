"use client";

import Cell from "./Cell";
import { GridType, LayoutTool } from "@/models/layout";
import type { SensorMap } from "@/hooks/useSensorMap";

interface GridProps {
  readonly grid: GridType;
  readonly selectedTool: LayoutTool | null;
  readonly updateCell: (row: number, col: number) => void;
  readonly clearCell?: (row: number, col: number) => void;
  readonly sensorMap?: SensorMap;
}

export default function Grid({
  grid,
  selectedTool,
  updateCell,
  clearCell,
  sensorMap,
}: GridProps) {
  const rows = grid.length;
  const cols = grid[0]?.length || 1;

  const handleCellClick = (row: number, col: number) => {
    updateCell(row, col);
  };

  const handleCellRightClick = (row: number, col: number) => {
    if (clearCell) {
      clearCell(row, col);
    }
  };

  return (
    <div className="w-full flex-1 border 
    border-gray-300 bg-gray-50 
    dark:border-slate-700 dark:bg-slate-900
    overflow-hidden rounded-lg">
      <div
        className="grid w-full h-full gap-0.5 p-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
      >
        {grid.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const liveStatus =
              cell.type === "slot" && cell.spotId
                ? sensorMap?.[cell.spotId]?.status
                : undefined;
            return (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                data={cell}
                liveStatus={liveStatus}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onRightClick={() => handleCellRightClick(rowIndex, colIndex)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
