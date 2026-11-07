import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "../common/Card";
import ChartTooltip from "./ChartTooltip";

// <LineChartCard title="Appointments" data={rows} xKey="day" lines={[{ key: "count", name: "Appointments", color: "#2563eb" }]} />
export default function LineChartCard({ title, data = [], xKey, lines = [], height = 260, actions }) {
  return (
    <Card title={title} actions={actions}>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            {lines.length > 1 && <Legend />}
            {lines.map((l) => (
              <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color || "#2563eb"} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}