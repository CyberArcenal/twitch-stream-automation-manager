import React from "react";
import { Download, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { dialogs } from "../../../utils/dialogs";

export const ExportButtons: React.FC = () => {
  const exportAsPNG = async () => {
    const element = document.getElementById("analytics-charts");
    if (!element) return;
    try {
      const dataUrl = await toPng(element);
      saveAs(dataUrl, "analytics.png");
    } catch (err) {
      console.error("Failed to export PNG", err);
    }
  };

  const exportAsCSV = () => {
    // Example: collect all chart data (simplified)
    const rows = [["Date", "Followers"]];
    // In real implementation you would fetch current data from state or re‑fetch
    dialogs.info("CSV export would collect all analytics data – implement as needed.");
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={exportAsPNG}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-bg)] rounded-lg text-[var(--text-primary)] text-sm hover:bg-[#2a2a2e] transition"
      >
        <Download className="w-4 h-4" /> Export as PNG
      </button>
      <button
        onClick={exportAsCSV}
        className="flex items-center gap-2 px-4 py-2 bg-[#9147ff] rounded-lg text-[var(--text-primary)] text-sm hover:bg-[#772ce8] transition"
      >
        <Share2 className="w-4 h-4" /> Export CSV
      </button>
    </div>
  );
};