import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn, LogOut, Users } from "lucide-react";
import toast from "react-hot-toast";
import { checkIn, checkOut, getMyAttendance } from "../../api/attendanceApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth";
import { formatDate, formatTime, toInputDate } from "../../utils/formatDate";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { CalendarCheck, Clock, Timer } from "lucide-react";

const hoursLabel = (h) => {
  if (h == null) return "-";
  const mins = Math.round(h * 60);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export default function MyAttendance() {
  useDocumentTitle("My attendance");
  const { user, hasRole } = useAuth();

  const today = toInputDate();
  const [month, setMonth] = useState(today.slice(0, 7)); // YYYY-MM
  const [now, setNow] = useState(new Date());
  const [busy, setBusy] = useState(false);

  // live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // this month's records (used for today's status) and the chosen month's records (table)
  const current = useFetch(() => getMyAttendance(today.slice(0, 7)), []);
  const selected = useFetch(() => getMyAttendance(month), [month]);

  const todayRecord = (current.data?.data || []).find((r) => r.date === today);
  const rows = selected.data?.data || [];

  const reloadAll = () => {
    current.reload();
    selected.reload();
  };

  const act = async (fn, okMessage) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMessage);
      reloadAll();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const working = todayRecord && !todayRecord.checkOut;
  const done = todayRecord && todayRecord.checkOut;
  const workedSoFar = working ? (now - new Date(todayRecord.checkIn)) / 3600000 : null;

  const days = rows.length;
  const totalHours = rows.reduce((s, r) => s + (r.hoursWorked || 0), 0);
  const avg = rows.filter((r) => r.hoursWorked).length
    ? totalHours / rows.filter((r) => r.hoursWorked).length
    : 0;

  const columns = [
    { header: "Date", render: (r) => formatDate(r.date) },
    { header: "Day", render: (r) => new Date(r.date).toLocaleDateString("en-IN", { weekday: "long", timeZone: "UTC" }) },
    { header: "Check in", render: (r) => formatTime(r.checkIn) },
    {
      header: "Check out",
      render: (r) => (r.checkOut ? formatTime(r.checkOut) : <StatusBadge status="processing" />),
    },
    { header: "Hours", render: (r) => (r.hoursWorked != null ? <b>{hoursLabel(r.hoursWorked)}</b> : "-") },
  ];

  return (
    <>
      <PageHeader title="My attendance" subtitle={`${user.name} · ${user.role}`}>
        {hasRole("admin") && (
          <Link to="/attendance/all" className="btn btn-outline">
            <Users size={16} /> All staff attendance
          </Link>
        )}
      </PageHeader>

      <Card>
        <div className="att-hero">
          <div>
            <div className="att-clock">
              {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="att-date">
              {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>

            <div className="att-status">
              {!todayRecord && <span className="badge badge-gray">Not checked in</span>}
              {working && (
                <>
                  <span className="badge badge-green">Working</span>
                  <span className="muted">
                    In at {formatTime(todayRecord.checkIn)} · {hoursLabel(workedSoFar)} so far
                  </span>
                </>
              )}
              {done && (
                <>
                  <span className="badge badge-blue">Day complete</span>
                  <span className="muted">
                    {formatTime(todayRecord.checkIn)} to {formatTime(todayRecord.checkOut)} · {hoursLabel(todayRecord.hoursWorked)}
                  </span>
                </>
              )}
            </div>
          </div>

          {!todayRecord && (
            <button className="btn btn-success att-btn" disabled={busy || current.loading} onClick={() => act(checkIn, "Checked in")}>
              <LogIn size={18} /> {busy ? "Please wait..." : "Check in"}
            </button>
          )}
          {working && (
            <button className="btn btn-danger att-btn" disabled={busy} onClick={() => act(checkOut, "Checked out")}>
              <LogOut size={18} /> {busy ? "Please wait..." : "Check out"}
            </button>
          )}
        </div>
      </Card>

      <div style={{ height: 18 }} />

      <div className="page-header" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>History</h2>
        <input
          className="month-input"
          type="month"
          value={month}
          max={today.slice(0, 7)}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
        />
      </div>

      <div className="stats-grid">
        <StatCard label="Days present" value={days} icon={CalendarCheck} color="green" />
        <StatCard label="Total hours" value={hoursLabel(totalHours)} icon={Clock} color="blue" />
        <StatCard label="Average per day" value={hoursLabel(avg)} icon={Timer} color="purple" />
      </div>

      {selected.error && <p className="error">{selected.error}</p>}
      <DataTable columns={columns} rows={rows} loading={selected.loading} emptyText="No attendance recorded for this month" />
    </>
  );
}