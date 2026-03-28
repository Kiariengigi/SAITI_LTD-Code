interface DonutChartProps {
  value: number;      // 0–100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

export default function DonutChart({
  value,
  size = 72,
  strokeWidth = 8,
  color = "#F5C800",
  trackColor = "#e8e8e8",
  label,
  sublabel,
}: DonutChartProps) {
  const r     = (size - strokeWidth) / 2;
  const circ  = 2 * Math.PI * r;
  const filled = (value / 100) * circ;

  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      {/* Centre label */}
      <div className="text-center" style={{ zIndex: 1, lineHeight: 1 }}>
        {label && (
          <div style={{ fontSize: size > 60 ? 14 : 10, fontWeight: 700, color: "#111", fontFamily: "'DM Mono', monospace" }}>
            {label}
          </div>
        )}
        {sublabel && (
          <div style={{ fontSize: 9, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}