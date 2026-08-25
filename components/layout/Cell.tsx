"use client";

import { CellData } from "@/models/layout";

interface Props {
  readonly data: CellData;
  readonly liveStatus?: string;
  readonly onClick: () => void;
  readonly onRightClick?: (event: React.MouseEvent) => void;
}

const getCellContent = (
  type: string,
  spotData: CellData["spotData"],
  status: string | undefined
) => {
  if (type === "slot" && spotData) {
    const display = status ?? "—";
    return (
      <>
        <div className="font-bold text-white">{spotData.slotName}</div>
        <div className="text-white text-[10px]">{display}</div>
      </>
    );
  }
  if (type === "road") {
    return <div className="text-white font-bold">ROAD</div>;
  }
  return <div className="text-gray-500 text-xs">empty</div>;
};

const getColor = (type: string, status: string | undefined) => {
  if (type === "road") return "bg-gray-500 hover:bg-gray-600";
  if (type === "slot") {
    if (status === "occupied") return "bg-red-500 hover:bg-red-600";
    if (status === "reserved") return "bg-yellow-400 hover:bg-yellow-500";
    if (status === "free" || status === "available") return "bg-green-500 hover:bg-green-600";
    return "bg-blue-500 hover:bg-blue-600";
  }
  return "bg-green-100 hover:bg-green-200";
};

export default function Cell({ data, liveStatus, onClick, onRightClick }: Props) {
  const status =
    liveStatus === "occupied"
      ? "occupied"
      : data.spotData?.status === "reserved"
        ? "reserved"
      : liveStatus ?? data.spotData?.status;

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    onRightClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      onClick={onClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      className={`
        w-full
        h-full
        min-w-0
        min-h-0
        flex
        flex-col
        items-center
        justify-center
        cursor-pointer
        transition-colors
        text-center
        p-1
        text-xs
        border-0
        rounded
        ${getColor(data.type, status)}
      `}
      aria-label={`Cell: ${data.type}${status ? `, ${status}` : ""}`}
    >
      {getCellContent(data.type, data.spotData, status)}
    </button>
  );
}
