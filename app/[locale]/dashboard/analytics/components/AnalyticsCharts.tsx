'use client';

import type { TrendPoint, HourlyPoint } from './analytics-types';

export function LineChart({
  data,
  width = 400,
  height = 200,
  noDataLabel,
  titleFormat,
}: {
  data: TrendPoint[];
  width?: number;
  height?: number;
  noDataLabel: string;
  titleFormat: (date: string, count: number) => string;
}) {
  if (data.length === 0) return <div className="flex h-[200px] items-center justify-center text-gray-400 text-sm">{noDataLabel}</div>;
  const padding = { top: 10, right: 10, bottom: 24, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const maxY = Math.max(1, ...data.map((d) => d.count));
  const scaleY = (v: number) => padding.top + innerH - (v / maxY) * innerH;
  const scaleX = (i: number) => padding.left + (i / (data.length - 1 || 1)) * innerW;
  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(d.count)}`).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
        </linearGradient>
      </defs>
      {data.map((d, i) => (
        <line key={d.date} x1={scaleX(i)} y1={scaleY(d.count)} x2={scaleX(i)} y2={height - padding.bottom} stroke="url(#lineGrad)" strokeWidth={scaleX(1) - scaleX(0)} fill="none" />
      ))}
      <path d={pathD} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={d.date} cx={scaleX(i)} cy={scaleY(d.count)} r={4} fill="#6366f1">
          <title>{titleFormat(d.date, d.count)}</title>
        </circle>
      ))}
      {data.map((d, i) => (
        <text key={d.date} x={scaleX(i)} y={height - 6} textAnchor="middle" className="fill-gray-500 text-[10px]">
          {d.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

export function BarChart({ data, width = 400, height = 200 }: { data: HourlyPoint[]; width?: number; height?: number }) {
  const maxY = Math.max(1, ...data.map((d) => d.count));
  const padding = { top: 10, right: 10, bottom: 28, left: 28 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barW = innerW / 24 - 2;
  const scaleY = (v: number) => padding.top + innerH - (v / maxY) * innerH;
  const left = (i: number) => padding.left + i * (innerW / 24);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
        </linearGradient>
      </defs>
      {data.map((d, i) => (
        <g key={d.hour}>
          <rect x={left(i)} y={scaleY(d.count)} width={barW} height={innerH - (scaleY(d.count) - padding.top)} fill="url(#barGrad)" rx={2} />
          {i % 4 === 0 && (
            <text x={left(i) + barW / 2} y={height - 8} textAnchor="middle" className="fill-gray-500 text-[9px]">
              {d.hour}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function ResolutionRing({ aiResolved, needsHuman, size = 80 }: { aiResolved: number; needsHuman: number; size?: number }) {
  const total = aiResolved + needsHuman;
  const circumference = 2 * Math.PI * (size / 2 - 4);
  const greenDash = total > 0 ? (aiResolved / total) * circumference : 0;
  const orangeDash = total > 0 ? (needsHuman / total) * circumference : circumference;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke="#22c55e"
        strokeWidth={6}
        strokeDasharray={`${greenDash} ${circumference - greenDash}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 4}
        fill="none"
        stroke="#f97316"
        strokeWidth={6}
        strokeDasharray={`${orangeDash} ${circumference - orangeDash}`}
        strokeDashoffset={-greenDash}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
