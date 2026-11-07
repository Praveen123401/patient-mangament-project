import { Link } from "react-router-dom";
import {
  Users, Stethoscope, CalendarCheck, BedDouble, FlaskConical, Pill, IndianRupee,
  UserPlus, CalendarPlus, ClipboardPlus, TestTube,
} from "lucide-react";
import { getDashboardStats } from "../../api/dashboardApi";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth.js";
import { formatCurrency } from "../../utils/formatCurrency";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card.jsx";
import Loader from "../../components/common/Loader";
import BarChartCard from "../../components/charts/BarChartCard";
import DonutChartCard from "../../components/charts/DonutChartCard";

const QUICK = [
  { to: "/patients/new", label: "Register patient", icon: UserPlus, roles: ["admin", "receptionist", "nurse", "doctor"] },
  { to: "/appointments/new", label: "Book appointment", icon: CalendarPlus, roles: ["admin", "receptionist", "nurse", "doctor"] },
  { to: "/admissions/new", label: "Admit patient", icon: ClipboardPlus, roles: ["admin", "doctor", "receptionist"] },
  { to: "/lab/orders/new", label: "New lab order", icon: TestTube, roles: ["admin", "doctor"] },
];

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const { data, loading, error } = useFetch(() => getDashboardStats(), []);

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;

  const s = data?.data || {};
  const canSeeMoney = ["admin", "receptionist"].includes(user.role);

  const apptData = (s.appointmentsByStatus || []).map((a) => ({ status: a._id, count: a.count }));
  const bedData = [
    { name: "Occupied", value: s.beds?.occupied || 0, color: "#dc2626" },
    { name: "Available", value: s.beds?.available || 0, color: "#16a34a" },
  ];
  const quick = QUICK.filter((q) => q.roles.includes(user.role));

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      />

      <div className="stats-grid">
        <StatCard label="Total patients" value={s.totalPatients} icon={Users} color="blue" />
        <StatCard label="Doctors" value={s.totalDoctors} icon={Stethoscope} color="green" />
        <StatCard label="Today's appointments" value={s.todayAppointments} icon={CalendarCheck} color="purple" />
        <StatCard label="Admitted now" value={s.currentlyAdmitted} icon={BedDouble} color="orange" />
        <StatCard label="Pending lab orders" value={s.pendingLabOrders} icon={FlaskConical} color="blue" />
        <StatCard label="Low stock medicines" value={s.lowStockMedicines} icon={Pill} color="red" />
        {canSeeMoney && (
          <StatCard label="Today's revenue" value={formatCurrency(s.todayRevenue)} icon={IndianRupee} color="green" sub={`Total ${formatCurrency(s.totalRevenue)}`} />
        )}
      </div>

      <div className="dash-grid">
        <BarChartCard
          title="Today's appointments by status"
          data={apptData}
          xKey="status"
          bars={[{ key: "count", name: "Appointments", color: "#2563eb" }]}
        />
        <DonutChartCard title="Bed occupancy" data={bedData} />
      </div>

      {quick.length > 0 && (
        <Card title="Quick actions">
          <div className="quick-grid">
            {quick.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="quick">
                <Icon size={18} /> {label}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}