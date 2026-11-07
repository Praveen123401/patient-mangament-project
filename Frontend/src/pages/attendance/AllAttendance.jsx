import { useState } from "react";
import { Link } from "react-router-dom";
import { getAllAttendance } from "../../api/attendanceApi";
import { getUsers } from "../../api/userApi";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { formatDate, formatTime, toInputDate } from "../../utils/formatDate";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import ExportButton from "../../components/common/ExportButton";
import StatusBadge from "../../components/common/StatusBadge";

const hoursLabel = (h) => {
  if (h == null) return "-";
  const mins = Math.round(h * 60);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export default function AllAttendance() {
  useDocumentTitle("Staff attendance");
  const [date, setDate] = useState(toInputDate());
  const [month, setMonth] = useState("");
  const [user, setUser] = useState("");
  const [page, setPage] = useState(1);

  // a chosen day wins; clear the day to filter by month instead
  const { data, loading, error } = useFetch(
    () => getAllAttendance({ user, date: date || undefined, month: date ? undefined : month || undefined, page, limit: 15 }),
    [date, month, user, page]
  );
  const users = useFetch(() => getUsers({ limit: 100 }), []);

  const staff = (users.data?.data || []).filter((u) => u.role !== "patient");
  const rows = data?.data || [];

  const columns = [
    {
      header: "Staff member",
      render: (r) => (
        <div>
          <strong>{r.user?.name || "-"}</strong>
          <div className="muted" style={{ textTransform: "capitalize" }}>{r.user?.role}</div>
        </div>
      ),
    },
    { header: "Date", render: (r) => formatDate(r.date) },
    { header: "Check in", render: (r) => formatTime(r.checkIn) },
    { header: "Check out", render: (r) => (r.checkOut ? formatTime(r.checkOut) : <StatusBadge status="processing" />) },
    { header: "Hours", render: (r) => (r.hoursWorked != null ? <b>{hoursLabel(r.hoursWorked)}</b> : "-") },
  ];

  return (
    <>
      <PageHeader title="Staff attendance" subtitle="Check-in and check-out records of all staff">
        <Link to="/attendance" className="btn btn-outline">My attendance</Link>
        <ExportButton
          rows={rows}
          filename="attendance.csv"
          columns={[
            { label: "Name", value: (r) => r.user?.name },
            { label: "Role", value: (r) => r.user?.role },
            { label: "Date", key: "date" },
            { label: "Check in", value: (r) => formatTime(r.checkIn) },
            { label: "Check out", value: (r) => (r.checkOut ? formatTime(r.checkOut) : "") },
            { label: "Hours", key: "hoursWorked" },
          ]}
        />
      </PageHeader>

      <FilterBar onReset={() => { setDate(toInputDate()); setMonth(""); setUser(""); setPage(1); }}>
        <input
          className="month-input"
          type="date"
          value={date}
          max={toInputDate()}
          onChange={(e) => { setDate(e.target.value); setPage(1); }}
          title="Day"
        />
        <input
          className="month-input"
          type="month"
          value={month}
          max={toInputDate().slice(0, 7)}
          disabled={!!date}
          onChange={(e) => { setMonth(e.target.value); setPage(1); }}
          title="Clear the day to filter by month"
        />
        <select value={user} onChange={(e) => { setUser(e.target.value); setPage(1); }}>
          <option value="">All staff</option>
          {staff.map((u) => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>
        {date && (
          <button className="btn btn-ghost" onClick={() => { setDate(""); setPage(1); }}>
            Filter by month instead
          </button>
        )}
      </FilterBar>

      {error && <p className="error">{error}</p>}
      <DataTable columns={columns} rows={rows} loading={loading} emptyText="No attendance records for this filter" />
      <Pagination page={data?.page} pages={data?.pages} total={data?.total} onChange={setPage} />
    </>
  );
}