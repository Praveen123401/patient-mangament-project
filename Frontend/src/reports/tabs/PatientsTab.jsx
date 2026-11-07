import { CalendarCheck, CheckCircle2, UserPlus, Users } from "lucide-react";
import { getPatientReport } from "../../api/reportApi";
import useFetch from "../../hooks/useFetch";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import ExportButton from "../../components/common/ExportButton";
import LineChartCard from "../../components/charts/LineChartCard";
import BarChartCard from "../../components/charts/BarChartCard";
import DonutChartCard from "../../components/charts/DonutChartCard";
import RankList from "../RankList";
import { shortDay, titleCase } from "../reportUtils";

const GENDER_COLORS = { male: "#2563eb", female: "#ec4899", other: "#94a3b8" };
const STATUS_COLORS = { pending: "#f59e0b", confirmed: "#2563eb", completed: "#16a34a", cancelled: "#dc2626" };

export default function PatientsTab({ from, to }) {
  const { data, loading, error } = useFetch(() => getPatientReport({ from, to }), [from, to]);
  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;

  const r = data.data;
  const t = r.totals;
  const registrations = r.registrations.map((d) => ({ ...d, day: shortDay(d.date) }));

  return (
    <>
      <div className="stats-grid rep-stats">
        <StatCard label="New patients" value={t.newPatients} icon={UserPlus} color="blue" sub="registered in this period" />
        <StatCard label="All patients" value={t.totalPatients} icon={Users} color="green" />
        <StatCard label="Appointments" value={t.appointments} icon={CalendarCheck} color="purple" />
        <StatCard label="Completed visits" value={t.completed} icon={CheckCircle2} color="green" />
      </div>

      <div className="page-actions rep-actions">
        <ExportButton
          rows={registrations}
          filename={`patients-${from}-to-${to}.csv`}
          columns={[
            { label: "Date", key: "date" },
            { label: "New patients", key: "count" },
          ]}
        />
      </div>

      <LineChartCard
        title="New patients per day"
        data={registrations}
        xKey="day"
        lines={[{ key: "count", name: "New patients", color: "#2563eb" }]}
      />

      <div style={{ height: 16 }} />

      <div className="rep-grid">
        <DonutChartCard
          title="Patients by gender"
          data={r.byGender.map((g) => ({ name: titleCase(g.name), value: g.count, color: GENDER_COLORS[g.name] }))}
        />
        <BarChartCard
          title="Patients by age group"
          data={r.byAge}
          xKey="name"
          bars={[{ key: "count", name: "Patients", color: "#0ea5e9" }]}
        />
      </div>

      <div className="rep-grid">
        <DonutChartCard
          title="Appointments by status"
          data={r.appointmentsByStatus.map((s) => ({ name: titleCase(s.name), value: s.count, color: STATUS_COLORS[s.name] }))}
        />
        <Card title="Busiest doctors">
          <RankList items={r.appointmentsByDoctor.map((d) => ({ name: d.name, value: d.count }))} format={(v) => `${v} visits`} />
        </Card>
      </div>
    </>
  );
}