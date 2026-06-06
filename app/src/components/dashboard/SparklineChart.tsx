export function SparklineChart() {
  const data = [65, 72, 68, 75, 82, 78, 85, 92, 88, 95, 102, 98, 105, 112, 108];
  const width = 120;
  const height = 40;
  const padding = 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${padding},${height} ${points} ${width - padding},${height}`}
        fill="url(#sparklineGrad)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="#4F46E5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
