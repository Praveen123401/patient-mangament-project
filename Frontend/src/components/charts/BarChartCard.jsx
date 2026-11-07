import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Card from "../common/Card";
import ChartTooltip from "./ChartTooltip";

export default function BarChartCard({ title, data = [], xKey, bars = [], height = 260, actions }) {
  return (
    <Card title={title} actions={actions}>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            {bars.length > 1 && <Legend />}
            {bars.map((b) => (
              <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color || "#2563eb"} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}