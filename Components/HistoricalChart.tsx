"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

type HistoricalChartProps = {
  regionId: string;
  currentWaterLevel: number;
  darkMode?: boolean;
};

export default function HistoricalChart({ regionId, currentWaterLevel, darkMode }: HistoricalChartProps) {
  // Generate realistic mock 24h historical data based on the current water level
  const data = useMemo(() => {
    const result = [];
    let level = Math.max(0, currentWaterLevel - 30); // Starting point 24h ago
    
    // Create 12 data points (every 2 hours)
    for (let i = 24; i >= 0; i -= 2) {
      const time = new Date();
      time.setHours(time.getHours() - i);
      
      // Add some random fluctuation, trending towards currentWaterLevel
      if (i === 0) {
        level = currentWaterLevel;
      } else {
        const trend = (currentWaterLevel - level) / (i / 2);
        level = Math.max(0, level + trend + (Math.random() * 10 - 5));
      }

      result.push({
        time: time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        waterLevel: Math.round(level)
      });
    }
    return result;
  }, [regionId, currentWaterLevel]);

  return (
    <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">Tren Ketinggian Air (24 Jam Terakhir)</h3>
        <p className="text-xs font-medium text-slate-400">Pola genangan dan air pasang di wilayah ini.</p>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="#334155" 
            />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              unit="cm"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#0f172a",
                borderColor: "#1e293b",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "bold",
                color: "#f8fafc",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
              }}
              itemStyle={{ color: "#38bdf8" }}
              formatter={(value: any) => [`${value} cm`, "Level Air"]}
              labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
            />
            <Area
              type="monotone"
              dataKey="waterLevel"
              stroke="#0ea5e9"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorWater)"
              activeDot={{ r: 6, fill: "#0284c7", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
