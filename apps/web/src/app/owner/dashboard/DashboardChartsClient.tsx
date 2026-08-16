"use client";

import { useState } from "react";
import { TrendingUp, Calendar, BarChart2 } from "lucide-react";

interface ChartDataPoint {
  label: string;
  amount: number;
}

interface DashboardChartsClientProps {
  dailyData: ChartDataPoint[];
  weeklyData: ChartDataPoint[];
  monthlyData: ChartDataPoint[];
}

export default function DashboardChartsClient({
  dailyData,
  weeklyData,
  monthlyData
}: DashboardChartsClientProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number; label: string; amount: number } | null>(null);

  const getActiveData = () => {
    switch (activeTab) {
      case "weekly":
        return weeklyData;
      case "monthly":
        return monthlyData;
      case "daily":
      default:
        return dailyData;
    }
  };

  const currentData = getActiveData();
  const maxVal = Math.max(...currentData.map(d => d.amount), 1); // Avoid division by 0

  // Chart configuration
  const width = 600;
  const height = 240;
  const paddingX = 50;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Calculate coordinates for points
  const points = currentData.map((d, index) => {
    const x = paddingX + (index / (currentData.length - 1 || 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.amount / maxVal) * chartHeight;
    return { x, y, label: d.label, amount: d.amount };
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Generate SVG Line & Area paths
  const linePath = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
      {/* Title and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-brand-evergreen">
              <TrendingUp size={18} />
            </div>
            <h3 className="font-black text-brand-navy text-lg">Tren Pendapatan Transaksi</h3>
          </div>
          <p className="text-slate-500 text-xs mt-1">Grafik visual omzet terverifikasi (Daily, Weekly, Monthly).</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 self-start sm:self-auto shadow-sm">
          {[
            { id: "daily", label: "Harian", icon: Calendar },
            { id: "weekly", label: "Mingguan", icon: BarChart2 },
            { id: "monthly", label: "Bulanan", icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setHoveredPoint(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-white text-brand-navy shadow-sm ring-1 ring-black/5"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingY + chartHeight * ratio;
            const gridVal = maxVal * (1 - ratio);
            return (
              <g key={i} className="opacity-40">
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  {gridVal >= 1000000 
                    ? `${(gridVal / 1000000).toFixed(1)}M` 
                    : gridVal >= 1000 
                    ? `${(gridVal / 1000).toFixed(0)}k` 
                    : gridVal.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Render Area Chart for Daily and Monthly */}
          {activeTab !== "weekly" && (
            <>
              {/* Area Fill */}
              <path
                d={areaPath}
                fill={activeTab === "daily" ? "url(#dailyGrad)" : "url(#monthlyGrad)"}
                className="transition-all duration-500 ease-in-out"
              />
              {/* Line Stroke */}
              <path
                d={linePath}
                fill="none"
                stroke={activeTab === "daily" ? "#10b981" : "#6366f1"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500 ease-in-out"
              />
              {/* Interaction points */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.index === idx ? "7" : "4"}
                  fill={activeTab === "daily" ? "#10b981" : "#6366f1"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-150 cursor-pointer shadow-md"
                  onMouseEnter={() => setHoveredPoint({ index: idx, x: p.x, y: p.y, label: p.label, amount: p.amount })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </>
          )}

          {/* Render Bar Chart for Weekly */}
          {activeTab === "weekly" && (
            <g>
              {points.map((p, idx) => {
                const barWidth = Math.min(32, chartWidth / (points.length * 1.8));
                const barHeight = chartHeight - (p.y - paddingY);
                const x = p.x - barWidth / 2;
                return (
                  <g key={idx} className="group">
                    <rect
                      x={x}
                      y={p.y}
                      width={barWidth}
                      height={Math.max(barHeight, 2)}
                      rx="6"
                      fill="url(#weeklyGrad)"
                      className="transition-all duration-300 cursor-pointer origin-bottom hover:brightness-110"
                      onMouseEnter={() => setHoveredPoint({ index: idx, x: p.x, y: p.y, label: p.label, amount: p.amount })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* X Axis Labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - paddingY + 16}
              fill="#94a3b8"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
            >
              {p.label}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip HTML representation for absolute accuracy */}
        {hoveredPoint && (
          <div
            className="absolute bg-slate-900 text-white p-3 rounded-2xl shadow-xl pointer-events-none z-10 flex flex-col border border-white/10 backdrop-blur-md text-[11px] transition-all duration-150"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 25}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-0.5">{hoveredPoint.label}</span>
            <span className="font-black text-xs text-emerald-400">{formatCurrency(hoveredPoint.amount)}</span>
            {/* Tooltip arrow */}
            <div className="absolute left-1/2 bottom-0 w-2.5 h-2.5 bg-slate-900 border-r border-b border-white/10 transform -translate-x-1/2 translate-y-1/2 rotate-45" />
          </div>
        )}
      </div>
    </div>
  );
}
