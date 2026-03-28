// MiniBarChart.tsx

interface MiniBarChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  highlightIndex?: number;
}

export default function MiniBarChart({
  data,
  width = 100,
  height = 60,
  color = "#111",
  highlightIndex,
}: MiniBarChartProps) {
  const max     = Math.max(...data, 1);
  const barW    = (width - (data.length - 1) * 3) / data.length;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {data.map((val, i) => {
        const barH = (val / max) * (height - 4);
        const x    = i * (barW + 3);
        const y    = height - barH;
        const isHi = highlightIndex === i;
        return (
          <rect
            key={i}
            x={x} y={y}
            width={barW} height={barH}
            rx={2}
            fill={isHi ? "#F5C800" : color}
            opacity={isHi ? 1 : 0.15 + (i / data.length) * 0.85}
          />
        );
      })}
    </svg>
  );
}