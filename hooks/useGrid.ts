import { useEffect, useState } from "react";
import { GridType, CellType, SpotData } from "@/models/layout";

const createGrid = (rows: number, cols: number): GridType => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: "empty" as CellType }))
  );
};

export const useGrid = (rows: number, cols: number, initialGrid?: GridType) => {
  const [grid, setGrid] = useState<GridType>(() =>
    initialGrid || createGrid(rows, cols)
  );

  useEffect(() => {
    if (initialGrid) {
      setGrid(initialGrid);
    }
  }, [initialGrid]);

  const resizeGrid = (newRows: number, newCols: number) => {
    setGrid(createGrid(newRows, newCols));
  };

  const updateCell = (row: number, col: number, type: CellType, spotData?: SpotData) => {
    setGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);

      if (!newGrid[row]?.[col]) return prev;

      // If placing an empty or road cell, just update it
      if (type !== "slot" || !spotData) {
        newGrid[row][col] = { type };
        return newGrid;
      }

      // If placing a spot, first remove this spot from anywhere else on the grid
      for (let r = 0; r < newGrid.length; r++) {
        for (let c = 0; c < newGrid[r].length; c++) {
          if (
            newGrid[r][c].type === "slot" &&
            newGrid[r][c].spotId === spotData.slotId &&
            !(r === row && c === col)
          ) {
            // Remove it from the previous location
            newGrid[r][c] = { type: "empty" };
          }
        }
      }

      // Now place the spot at the new location
      newGrid[row][col] = {
        type: "slot",
        spotId: spotData.slotId,
        spotData,
      };

      return newGrid;
    });
  };

  const clearCell = (row: number, col: number) => {
    setGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      if (newGrid[row]?.[col]) {
        newGrid[row][col] = { type: "empty" };
      }
      return newGrid;
    });
  };

  const updateCellStatus = (row: number, col: number, status: string) => {
    setGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      const cell = newGrid[row]?.[col];
      if (!cell || cell.type !== "slot" || !cell.spotData) return prev;

      newGrid[row][col] = {
        ...cell,
        spotData: { ...cell.spotData, status },
      };
      return newGrid;
    });
  };

  const getPlacedSpots = (): string[] => {
    const placedSpotIds: string[] = [];
    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === "slot" && cell.spotId) {
          placedSpotIds.push(cell.spotId);
        }
      });
    });
    return placedSpotIds;
  };

  return { grid, updateCell, updateCellStatus, resizeGrid, clearCell, getPlacedSpots };
};