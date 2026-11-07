import { AlertTriangle, FlaskConical, IndianRupee, Timer } from "lucide-react";
import { getLabReport } from "../../api/reportApi";
import useFetch from "../../hooks/useFetch";
import { formatCurrency } from "../../utils/formatCurrency";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import BarChartCard from "../../components/charts/BarChartCard";
import DonutChartCard from "../../components/charts/DonutChartCard";
import RankList from "../RankList";
import { titleCase } from "../reportUtils";

const STATUS_COLORS = { ordered: "#94a3b8", collected: "#2563eb", processing: "#f59e0b", completed: "#16a34a", cancelled: "#dc2626" };

export default function LabTab({ from, to }) {
  const { data, loading, error } = useFetch(() => getLabReport({ from, to }), [from, to]);
  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;

  const r = data.data;
  const t = r.totals;

  return (
    <>
      <div className="stats-grid rep-stats">
        <StatCard label="Lab orders" value={t.orders} icon={FlaskConical} color="blue" sub={`${t.completed} completed`} />
        <StatCard label="Lab revenue" value={formatCurrency(t.revenue)} icon={IndianRupee} color="green" />
        <StatCard label="Critical results" value={t.criticalResults} icon={AlertTriangle} color="red" />
        <StatCard label="Average turnaround" value={`${t.avgTurnaroundHours} h`} icon={Timer} color="purple" sub="order to verified report" />
      </div>

      <div className="rep-grid">
        <DonutChartCard
          title="Orders by status"
          data={r.byStatus.map((s) => ({ name: titleCase(s.name), value: s.count, color: STATUS_COLORS[s.name] }))}
        />
        <BarChartCard
          title="Tests by category"
          data={r.byCategory.map((c) => ({ ...c, name: titleCase(c.name) }))}
          xKey="name"
          bars={[{ key: "count", name: "Tests", color: "#6366f1" }]}
        />
      </div>

      <Card title="Most ordered tests">
        <RankList items={r.topTests.map((x) => ({ name: x.name, value: x.count }))} format={(v) => `${v} orders`} />
      </Card>
    </>
  );
}