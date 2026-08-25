export type CellType = "empty" | "road" | "slot";
export type LayoutTool = CellType | "available" | "reserved";

export interface SpotData {
  slotId: string;
  slotName: string;
  rowNo: string;
  columnNo: string;
  floor: string;
  vehicleType?: string;
  status: string;
  ownerId?: string;
  layoutId?: string;
  lotId?: string;
  sensor?: {
    sensorId: string;
    deviceId: string;
    status?: string;
    assigned?: boolean;
  } | null;
}

export interface CellData {
  type: CellType;
  spotId?: string; // ID of the spot placed here
  spotData?: SpotData; // Full spot data for quick access
}

export type GridType = CellData[][];

export interface LayoutData {
  layoutId?: string;
  layoutName: string;
  notes?: string;
  rows: number;
  cols: number;
  grid: GridType;
  lotId?: string;
  floor?: string;
  ownerId?: string;
  createdAt?: number;
  updatedAt?: number;
}

