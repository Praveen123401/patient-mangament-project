import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { cancelAppointment, getAppointments, updateAppointmentStatus } from "../../api/appointmentApi";
import { getDoctors } from "../../api/doctorApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth";
import { formatDay, toInputDate } from "../../utils/formatDate";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";
import CancelDialog from "./CancelDialog";

export default function AppointmentList() {
  useDocumentTitle("Appointments");
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isDoctor = hasRole("doctor");
  const canUpdateStatus = hasRole("admin", "doctor", "nurse");

  const [date, setDate] = useState(toInputDate());
  const [status, setStatus] = useState("");
  const [doctor, setDoctor] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => getAppointments({ date: date || undefined, status, doctor, page, limit: 10 }),
    [date, status, doctor, page]
  );
  const doctors = useFetch(() => getDoctors({ limit: 100 }), []);

  const change = async (a, next) => {
    setBusyId(a._id);
    try {
      await updateAppointmentStatus(a._id, next);
      toast.success(`Marked ${next}`);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  const doCancel = async (reason) => {
    setCancelling(true);
    try {
      await cancelAppointment(toCancel._id, reason);
      toast.success("Appointment cancelled");
      setToCancel(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setCancelling(false);
    }
  };

  const columns = [
    { header: "Date", render: (a) => formatDay(a.date) },
    { header: "Time", render: (a) => <b>{a.timeSlot}</b> },
    {
      header: "Patient",
      render: (a) => (
        <div>
          <strong>{a.patient?.name}</strong>
          <div className="muted">{a.patient?.patientId} · {a.patient?.phone}</div>
        </div>
      ),
    },
    {
      header: "Doctor",
      render: (a) => (
        <div>
          Dr. {a.doctor?.user?.name}
          <div className="muted">{a.doctor?.specialization}</div>
        </div>
      ),
    },
    { header: "Reason", render: (a) => a.reason || "-" },
    { header: "Status", render: (a) => <StatusBadge status={a.status} /> },
    {
      header: "",
      width: 250,
      render: (a) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <Link className="btn btn-outline btn-sm" to={`/appointments/${a._id}`}>View</Link>
          {a.status === "pending" && canUpdateStatus && (
            <button className="btn btn-primary btn-sm" disabled={busyId === a._id} onClick={() => change(a, "confirmed")}>
              Confirm
            </button>
          )}
          {a.status === "confirmed" && canUpdateStatus && (
            <button className="btn btn-success btn-sm" disabled={busyId === a._id} onClick={() => change(a, "completed")}>
              Complete
            </button>
          )}
          {["pending", "confirmed"].includes(a.status) && (
            <button className="btn btn-outline btn-sm" onClick={() => setToCancel(a)}>Cancel</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Appointments" subtitle={isDoctor ? "Your appointments" : "Scheduled visits for all doctors"}>
        <Link to="/appointments/new" className="btn btn-primary">
          <Plus size={16} /> Book appointment
        </Link>
      </PageHeader>

      <FilterBar onReset={() => { setDate(toInputDate()); setStatus(""); setDoctor(""); setPage(1); }}>
        <input
          className="month-input"
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setPage(1); }}
          title="Day"
        />
        <button className="btn btn-ghost" onClick={() => { setDate(""); setPage(1); }}>All dates</button>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {!isDoctor && (
          <select value={doctor} onChange={(e) => { setDoctor(e.target.value); setPage(1); }}>
            <option value="">All doctors</option>
            {(doctors.data?.data || []).map((d) => (
              <option key={d._id} value={d._id}>Dr. {d.user?.name}</option>
            ))}
          </select>
        )}
      </FilterBar>

      {error && <p className="error">{error}</p>}
      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={loading}
        emptyText={date ? "No appointments on this date" : "No appointments found"}
        onRowClick={(a) => navigate(`/appointments/${a._id}`)}
      />
      <Pagination page={data?.page} pages={data?.pages} total={data?.total} onChange={setPage} />

      <CancelDialog
        open={!!toCancel}
        patientName={toCancel?.patient?.name}
        loading={cancelling}
        onConfirm={doCancel}
        onClose={() => setToCancel(null)}
      />
    </>
  );
}