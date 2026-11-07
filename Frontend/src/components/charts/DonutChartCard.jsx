import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import Card from "../common/Card";
import ChartTooltip from "./ChartTooltip";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#8b5cf6", "#0ea5e9"];

// <DonutChartCard title="Beds" data={[{ name: "Occupied", value: 12 }, { name: "Available", value: 8 }]} />
export default function DonutChartCard({ title, data = [], height = 260, colors = COLORS, actions }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  return (
    <Card title={title} actions={actions}>
      <div style={{ width: "100%", height, position: "relative" }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="85%" paddingAngle={2}>
              {data.map((d, i) => (
                <Cell key={d.name} fill={d.color || colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{total}</strong>
          <small>Total</small>
        </div>
      </div>
    </Card>
  );
}