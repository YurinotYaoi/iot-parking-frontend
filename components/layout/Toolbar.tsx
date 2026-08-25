"use client";

import { LayoutTool } from "@/models/layout";

interface Props {
  readonly selectedTool: LayoutTool | null;
  readonly setSelectedTool: (tool: LayoutTool | null) => void;
}

export default function Toolbar({ selectedTool, setSelectedTool }: Props) {
  const tools: { value: LayoutTool; label: string }[] = [
    { value: "empty", label: "Empty" },
    { value: "road", label: "Road" },
    { value: "available", label: "Available" },
    { value: "reserved", label: "Reserved" },
  ];

  return (
    <div className="flex gap-1 flex-wrap">
      {tools.map((tool) => (
        <button
          key={tool.value}
          onClick={() => setSelectedTool(tool.value)}
          className={`px-4 py-2 border rounded transition-colors ${
            selectedTool === tool.value 
              ? "bg-slate-800 text-white border-black " 
              : "bg-white border-gray-300 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-slate-100   "
          }`}
        >
          {tool.label}
        </button>
      ))}
      
      {selectedTool === null && (
        <div className="text-sm text-gray-500 self-center">
          Select a tool (right-click to clear cells)
        </div>
      )}
    </div>
  );
}