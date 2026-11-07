import { BedDouble, Clock, LogIn, LogOut, Percent } from "lucide-react";
import { getAdmissionReport } from "../../api/reportApi";
import useFetch from "../../hooks/useFetch";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import ExportButton from "../../components/common/ExportButton";
import LineChartCard from "../../components/charts/LineChartCard";
import DonutChartCard from "../../components/charts/DonutChartCard";
import RankList from "../RankList";
import { shortDay, titleCase } from "../reportUtils";

export default function AdmissionsTab({ from, to }) {
  const { data, loading, error } = useFetch(() => getAdmissionReport({ from, to }), [from, to]);
  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;

  const r = data.data;
  const t = r.totals;
  const daily = r.daily.map((d) => ({ ...d, day: shortDay(d.date) }));

  return (
    <>
      <div className="stats-grid rep-stats">
        <StatCard label="Admitted" value={t.admitted} icon={LogIn} color="blue" sub="in this period" />
        <StatCard label="Discharged" value={t.discharged} icon={LogOut} color="green" sub="in this period" />
        <StatCard label="In hospital now" value={t.currentlyAdmitted} icon={BedDouble} color="orange" />
        <StatCard label="Average stay" value={`${t.avgStayDays} days`} icon={Clock} color="purple" />
        <StatCard label="Bed occupancy" value={`${t.occupancyPercent}%`} icon={Percent} color="red" sub={`${t.totalBeds} beds in total`} />
      </div>

      <div className="page-actions rep-actions">
        <ExportButton
          rows={daily}
          filename={`admissions-${from}-to-${to}.csv`}
          columns={[
            { label: "Date", key: "date" },
            { label: "Admissions", key: "count" },
          ]}
        />
      </div>

      <LineChartCard
        title="Admissions per day"
        data={daily}
        xKey="day"
        lines={[{ key: "count", name: "Admissions", color: "#2563eb" }]}
      />

      <div style={{ height: 16 }} />

      <div className="rep-grid">
        <DonutChartCard
          title="Beds right now"
          data={[
            { name: "Available", value: r.beds.available, color: "#16a34a" },
            { name: "Occupied", value: r.beds.occupied, color: "#dc2626" },
            { name: "Maintenance", value: r.beds.maintenance, color: "#f59e0b" },
          ].filter((b) => b.value > 0)}
        />
        <Card title="Admissions by ward">
          <RankList items={r.byWard.map((w) => ({ name: w.name, value: w.count }))} format={(v) => `${v} patients`} />
        </Card>
      </div>

      <DonutChartCard
        title="How patients left"
        data={r.dischargeByCondition.map((c) => ({ name: c.name === "lama" ? "LAMA" : titleCase(c.name), value: c.count }))}
      />
    </>
  );
}