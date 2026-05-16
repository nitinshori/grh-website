/**
 * Lightweight SVG chart components for the admin dashboard.
 *
 * Zero dependencies — generates raw SVG. Use these for KPI sparklines,
 * trend lines, and bar charts. For anything richer (zoom, hover tooltips,
 * dual axes) bring in Recharts. Today, keep it lean.
 *
 * All components are PURE — pass data in, get JSX out. They're safe to use
 * in server components.
 */

interface Point {
  /** Display label (date, week, etc.) */
  label: string;
  /** Numeric value */
  value: number;
}

// ── Sparkline (tiny inline trend) ──────────────────────────────

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
}

export function Sparkline({
  values,
  width = 120,
  height = 36,
  color = "#25b4b4",
  fillOpacity = 0.15,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height} className="text-gray-200">
        <line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke="currentColor" strokeWidth={1} />
      </svg>
    );
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return [x, y] as const;
  });
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={areaPath} fill={color} fillOpacity={fillOpacity} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Line chart (with axis labels + grid) ───────────────────────

interface LineChartProps {
  data: Point[];
  height?: number;
  color?: string;
  fillOpacity?: number;
  yLabel?: string;
}

export function LineChart({
  data,
  height = 220,
  color = "#25b4b4",
  fillOpacity = 0.12,
  yLabel,
}: LineChartProps) {
  const width = 720; // viewBox width; will scale via CSS to container
  const padding = { top: 16, right: 12, bottom: 32, left: 36 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic py-12 text-center">
        No data yet for this period.
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = niceCeiling(max);
  const step = data.length > 1 ? plotW / (data.length - 1) : plotW;

  const points = data.map((d, i) => {
    const x = padding.left + i * step;
    const y = padding.top + (1 - d.value / niceMax) * plotH;
    return { x, y, label: d.label, value: d.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(padding.top + plotH).toFixed(1)} L${points[0].x.toFixed(1)},${(padding.top + plotH).toFixed(1)} Z`;

  // Y-axis ticks (4 lines)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    value: Math.round(niceMax * f),
    y: padding.top + (1 - f) * plotH,
  }));

  // X-axis labels — show every Nth point to avoid overlap
  const labelEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid + Y labels */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padding.left} x2={width - padding.right} y1={t.y} y2={t.y} stroke="#e5e7eb" strokeWidth={1} />
          <text x={padding.left - 6} y={t.y + 3.5} fontSize={10} fill="#6b7280" textAnchor="end">{t.value}</text>
        </g>
      ))}

      {/* Area + line */}
      <path d={areaPath} fill={color} fillOpacity={fillOpacity} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color}>
          <title>{`${p.label}: ${p.value}`}</title>
        </circle>
      ))}

      {/* X labels */}
      {points.map((p, i) =>
        i % labelEvery === 0 || i === points.length - 1 ? (
          <text key={`x-${i}`} x={p.x} y={height - 12} fontSize={10} fill="#6b7280" textAnchor="middle">{p.label}</text>
        ) : null
      )}

      {yLabel && (
        <text x={6} y={padding.top - 4} fontSize={10} fill="#6b7280" fontWeight={500}>{yLabel}</text>
      )}
    </svg>
  );
}

// ── Horizontal bar chart ──────────────────────────────────────

interface HBarChartProps {
  data: Point[];
  color?: string;
  /** Pass a map of label → href for clickable bars (optional). */
  links?: Record<string, string>;
}

export function HBarChart({ data, color = "#25b4b4", links }: HBarChartProps) {
  if (data.length === 0) {
    return <div className="text-sm text-gray-400 italic py-6 text-center">No data.</div>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const w = (d.value / max) * 100;
        const inner = (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-gray-700 truncate">{d.label}</span>
                <span className="text-xs font-semibold text-gray-900 tabular-nums">{d.value}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, backgroundColor: color }} />
              </div>
            </div>
          </div>
        );
        const href = links?.[d.label];
        return href ? (
          <a key={i} href={href} className="block hover:bg-gray-50 rounded-md -mx-2 px-2 py-1 transition-colors">{inner}</a>
        ) : (
          <div key={i}>{inner}</div>
        );
      })}
    </div>
  );
}

// ── Donut chart (small, for status breakdowns) ────────────────

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}

export function DonutChart({ segments, size = 120, thickness = 14 }: DonutChartProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const length = (s.value / total) * circumference;
          const dasharray = `${length} ${circumference}`;
          const dashoffset = -offset;
          offset += length;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
            >
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          );
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={20} fontWeight={700} fill="#111827">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9} fill="#6b7280">total</text>
      </svg>
      <div className="flex-1 space-y-1.5 text-xs">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="flex-1 text-gray-700">{s.label}</span>
            <span className="font-semibold text-gray-900 tabular-nums">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function niceCeiling(n: number): number {
  if (n <= 1) return 1;
  if (n <= 5) return 5;
  if (n <= 10) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * magnitude);
  for (const c of candidates) if (c >= n) return c;
  return 10 * magnitude;
}
