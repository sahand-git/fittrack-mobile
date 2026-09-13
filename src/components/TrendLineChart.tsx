/* localized-render */
import React, { useState } from 'react';
import { t, useLocale, localeTag } from '../utils/locale';
import { tokens } from '../theme/tokens';
import { Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react';

export interface DataPoint {
  date: string; // YYYY-MM-DD
  value: number; // e.g. weight in kg
  note?: string;
}

interface TrendLineChartProps {
  data: DataPoint[];
  targetValue?: number;
  unit?: string;
  emptyMessage?: string;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  targetValue,
  unit = 'kg',
  emptyMessage = 'No weight entries recorded in this period.'
}) => {
  useLocale();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-12 px-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
        <Scale className="w-8 h-8 text-slate-400 mx-auto mb-2" strokeWidth={tokens.icons.strokeWidth} />
        <p className="text-xs font-semibold text-slate-500">{t(emptyMessage)}</p>
        <p className="text-[11px] text-slate-400 mt-1">{t("Log your weight in Profile or Quick Entry to track progress.")}</p>
      </div>
    );
  }

  // Width & height virtual coordinate system
  const width = 600;
  const height = 240;
  const paddingX = 45;
  const paddingY = 35;

  const values = data.map((d) => d.value);
  if (targetValue !== undefined) values.push(targetValue);

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Add 5% breathing room
  const buffer = Math.max(1, (rawMax - rawMin) * 0.1);
  const minY = Math.floor(rawMin - buffer);
  const maxY = Math.ceil(rawMax + buffer);
  const rangeY = maxY - minY || 1;

  const getX = (index: number) => {
    if (data.length === 1) return width / 2;
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    return height - paddingY - ((val - minY) / rangeY) * (height - paddingY * 2);
  };

  // Build SVG Path points
  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.value),
    data: d
  }));

  // Build smooth bezier path
  let pathD = '';
  if (points.length === 1) {
    pathD = `M ${points[0].x} ${points[0].y}`;
  } else {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx = (p0.x + p1.x) / 2;
      pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
  }

  // Area path for gradient fill under the line
  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  const targetY = targetValue !== undefined ? getY(targetValue) : null;

  // Weight difference
  const firstVal = data[0].value;
  const lastVal = data[data.length - 1].value;
  const diff = Math.round((lastVal - firstVal) * 10) / 10;

  return (
    <div className="space-y-3">
      {/* Metric Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {t(lastVal.toLocaleString(localeTag()))}
          </span>
          <span className="text-xs font-bold text-slate-500">{t(unit)}</span>
          {data.length > 1 && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                diff < 0
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : diff > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {diff < 0 ? <TrendingDown className="w-3 h-3" /> : diff > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              <span>{t(diff > 0 ? `+${diff}` : `${diff}`)} {t(unit)}</span>
            </span>
          )}
        </div>

        {targetValue !== undefined && (
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-teal-500 border border-dashed border-teal-500 inline-block" />
            <span>{t("Goal")}: {t(targetValue)} {t(unit)}</span>
          </div>
        )}
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden bg-slate-50/70 border border-slate-200/80 rounded-2xl p-2 sm:p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-56 select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0D9488" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {[0, 0.5, 1].map((ratio) => {
            const gridVal = Math.round(minY + ratio * rangeY);
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
                  x={paddingX - 8}
                  y={gridY + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono font-medium"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Target Reference Line */}
          {targetY !== null && (
            <g>
              <line
                x1={paddingX}
                y1={targetY}
                x2={width - paddingX}
                y2={targetY}
                stroke="#0D9488"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
            </g>
          )}

          {/* Gradient Area Fill */}
          {areaD && <path d={areaD} fill="url(#weightAreaGradient)" />}

          {/* Main Line Stroke */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#0D9488"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Data Circles */}
          {points.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx}>
                {/* Invisible large touch target */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="14"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onTouchStart={() => setHoveredIndex(idx)}
                />
                {/* Visible dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? '6' : '4'}
                  fill="#FFFFFF"
                  stroke="#0D9488"
                  strokeWidth={isHovered ? '3' : '2'}
                  className="transition-all duration-150 pointer-events-none"
                />
              </g>
            );
          })}

          {/* X Axis Date Labels */}
          {points.map((p, idx) => {
            // Show every Nth label to prevent clutter
            const step = Math.max(1, Math.floor(points.length / 5));
            const showLabel = idx === 0 || idx === points.length - 1 || idx % step === 0;
            if (!showLabel) return null;

            const dateParts = p.data.date.split('-');
            const shortDate = `${dateParts[1]}/${dateParts[2]}`;

            return (
              <text
                key={`label-${idx}`}
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 font-mono font-medium"
              >
                {shortDate}
              </text>
            );
          })}
        </svg>

        {/* Hover / Touch Tooltip Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 text-white px-2.5 py-1.5 rounded-xl shadow-lg text-center"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100}%`
            }}
          >
            <span className="text-[10px] text-slate-300 block">{points[hoveredIndex].data.date}</span>
            <span className="text-xs font-bold font-mono text-teal-300">
              {points[hoveredIndex].data.value} {unit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
