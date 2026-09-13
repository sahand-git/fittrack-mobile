/* localized-render */
import React, { useState } from 'react';
import { t, useLocale, localeTag } from '../utils/locale';
import { tokens } from '../theme/tokens';
import { Utensils, CheckCircle2, AlertCircle } from 'lucide-react';

export interface CalorieDataPoint {
  date: string; // YYYY-MM-DD
  calories: number;
  target: number;
  label?: string; // e.g. "Mon", "Tue"
}

interface TrendBarChartProps {
  data: CalorieDataPoint[];
  targetCalories: number;
  emptyMessage?: string;
}

export const TrendBarChart: React.FC<TrendBarChartProps> = ({
  data,
  targetCalories,
  emptyMessage = 'No meals logged in this period.'
}) => {
  useLocale();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hasAnyData = data.some((d) => d.calories > 0);
  if (!data || data.length === 0 || !hasAnyData) {
    return (
      <div className="py-12 px-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <Utensils className="w-8 h-8 text-slate-400 mx-auto mb-2" strokeWidth={tokens.icons.strokeWidth} />
        <p className="text-xs font-semibold text-slate-500">{t(emptyMessage)}</p>
        <p className="text-[11px] text-slate-400 mt-1">{t("Log your breakfast, lunch, or dinner to see daily calorie balance.")}</p>
      </div>
    );
  }

  const width = 600;
  const height = 240;
  const paddingX = 35;
  const paddingY = 35;

  const maxCalorie = Math.max(
    targetCalories * 1.15,
    ...data.map((d) => d.calories),
    1000
  );

  const getY = (val: number) => {
    return height - paddingY - (val / maxCalorie) * (height - paddingY * 2);
  };

  const barSlotWidth = (width - paddingX * 2) / data.length;
  const barWidth = Math.min(28, Math.max(8, barSlotWidth * 0.58));
  const targetY = getY(targetCalories);

  // Statistics
  const activeDays = data.filter((d) => d.calories > 0);
  const avgCalories = activeDays.length > 0
    ? Math.round(activeDays.reduce((acc, d) => acc + d.calories, 0) / activeDays.length)
    : 0;
  const daysOnTarget = activeDays.filter((d) => d.calories <= d.target).length;
  const adherenceRate = activeDays.length > 0
    ? Math.round((daysOnTarget / activeDays.length) * 100)
    : 0;

  return (
    <div className="space-y-3">
      {/* Metric Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {t(avgCalories.toLocaleString(localeTag()))}
          </span>
          <span className="text-xs font-bold text-slate-500">{t("avg kcal / day")}</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            <span>{t(adherenceRate)}{t("% on target")}</span>
          </span>
        </div>

        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-slate-400 border border-dashed border-slate-400 inline-block" />
          <span>{t("Budget")}: {t(targetCalories)} {t("kcal")}</span>
        </div>
      </div>

      {/* SVG Bar Chart Container */}
      <div className="relative w-full overflow-hidden bg-slate-50/70 border border-slate-200/80 rounded-2xl p-2 sm:p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-56 select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background Grid Lines */}
          {[0, 0.5, 1].map((ratio) => {
            const gridVal = Math.round(ratio * maxCalorie);
            const gridY = getY(gridVal);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={gridY}
                  x2={width - paddingX}
                  y2={gridY}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 6}
                  y={gridY + 4}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 font-mono font-medium"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Target Reference Line */}
          <g>
            <line
              x1={paddingX}
              y1={targetY}
              x2={width - paddingX}
              y2={targetY}
              stroke="#64748B"
              strokeWidth="1.5"
              strokeDasharray="5 3"
            />
            <text
              x={width - paddingX}
              y={targetY - 5}
              textAnchor="end"
              className="text-[9px] fill-slate-500 font-bold"
            >
              {targetCalories} kcal
            </text>
          </g>

          {/* Day Bars */}
          {data.map((item, idx) => {
            const centerX = paddingX + idx * barSlotWidth + barSlotWidth / 2;
            const barX = centerX - barWidth / 2;
            const barY = getY(item.calories);
            const barHeight = Math.max(0, height - paddingY - barY);
            const isOverTarget = item.calories > item.target;
            const isHovered = hoveredIndex === idx;

            // Date formatting
            const dateParts = item.date.split('-');
            const shortDate = `${dateParts[1]}/${dateParts[2]}`;

            // Show label every N bars if 30 days
            const step = data.length > 14 ? 5 : 1;
            const showLabel = idx % step === 0 || idx === data.length - 1;

            return (
              <g key={item.date}>
                {/* Invisible wide hover touch area */}
                <rect
                  x={paddingX + idx * barSlotWidth}
                  y={paddingY}
                  width={barSlotWidth}
                  height={height - paddingY * 2}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onTouchStart={() => setHoveredIndex(idx)}
                />

                {/* Visible rounded bar */}
                {item.calories > 0 ? (
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    rx={Math.min(6, barWidth / 2)}
                    ry={Math.min(6, barWidth / 2)}
                    fill={
                      isOverTarget
                        ? isHovered ? '#E11D48' : '#F43F5E'
                        : isHovered ? '#0F766E' : '#0D9488'
                    }
                    className="transition-all duration-150 pointer-events-none"
                  />
                ) : (
                  /* Dot for zero calories */
                  <circle
                    cx={centerX}
                    cy={height - paddingY - 3}
                    r="2"
                    fill="#CBD5E1"
                    className="pointer-events-none"
                  />
                )}

                {/* X Axis Label */}
                {showLabel && (
                  <text
                    x={centerX}
                    y={height - 10}
                    textAnchor="middle"
                    className="text-[9px] fill-slate-500 font-mono font-medium pointer-events-none"
                  >
                    {item.label || shortDate}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover / Touch Tooltip Overlay */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 text-white px-3 py-2 rounded-xl shadow-lg text-center whitespace-nowrap"
            style={{
              left: `${((paddingX + hoveredIndex * barSlotWidth + barSlotWidth / 2) / width) * 100}%`,
              top: `${(Math.max(getY(data[hoveredIndex].calories), 60) / height) * 100}%`
            }}
          >
            <span className="text-[10px] text-slate-300 block">{data[hoveredIndex].date}</span>
            <span className="text-xs font-bold font-mono text-white block">
              {data[hoveredIndex].calories} / {data[hoveredIndex].target} kcal
            </span>
            <span
              className={`text-[10px] font-bold mt-0.5 block ${
                data[hoveredIndex].calories <= data[hoveredIndex].target
                  ? 'text-teal-300'
                  : 'text-rose-300'
              }`}
            >
              {data[hoveredIndex].calories <= data[hoveredIndex].target
                ? `${data[hoveredIndex].target - data[hoveredIndex].calories} kcal remaining`
                : `+${data[hoveredIndex].calories - data[hoveredIndex].target} kcal over`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
