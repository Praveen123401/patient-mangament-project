export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      {label && <strong>{label}</strong>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name}>
          <span style={{ color: p.color || p.payload?.fill }}>●</span> {p.name}: <b>{p.value}</b>
        </div>
      ))}
    </div>
  );
}