import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarClock, ClipboardList, Pill } from "lucide-react";
import toast from "react-hot-toast";
import {
  cancelAppointment, getAppointment, rescheduleAppointment, updateAppointmentStatus,
} from "../../api/appointmentApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth";
import { formatDay, formatDateTime, toInputDate } from "../../utils/formatDate";
import Breadcrumb from "../../components/common/Breadcrumb";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import Modal from "../../components/common/Modal";
import FormField from "../../components/common/FormField";
import StatusBadge from "../../components/common/StatusBadge";
import CancelDialog from "./CancelDialog";
import SlotsField from "./SlotsField";

const Row = ({ label, value }) => (
  <div className="info-row">
    <span>{label}</span>
    <b>{value || "-"}</b>
  </div>
);

export default function AppointmentDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const canUpdateStatus = hasRole("admin", "doctor", "nurse");
  const { data, loading, error, reload } = useFetch(() => getAppointment(id), [id]);
  const a = data?.data;
  useDocumentTitle(a ? `Appointment ${a.timeSlot}` : "Appointment");

  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reschedOpen, setReschedOpen] = useState(false);
  const [newDate, setNewDate] = useState(toInputDate());
  const [newSlot, setNewSlot] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;
  if (!a) return null;

  const open = ["pending", "confirmed"].includes(a.status);

  const setStatus = async (next) => {
    setBusy(true);
    try {
      await updateAppointmentStatus(id, next);
      toast.success(`Marked ${next}`);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async (reason) => {
    setBusy(true);
    try {
      await cancelAppointment(id, reason);
      toast.success("Appointment cancelled");
      setCancelOpen(false);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const doReschedule = async () => {
    if (!newSlot) return toast.error("Pick a new time slot");
    setBusy(true);
    try {
      await rescheduleAppointment(id, { date: newDate, timeSlot: newSlot });
      toast.success("Appointment rescheduled");
      setReschedOpen(false);
      setNewSlot("");
      reload();
    } catch (err) {
      toast.error(errMsg(err));
      if (err.response?.status === 409) {
        setNewSlot("");
        setRefreshKey((k) => k + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Appointments", to: "/appointments" }, { label: `${formatDay(a.date)}, ${a.timeSlot}` }]} />

      <PageHeader title={`${formatDay(a.date)} at ${a.timeSlot}`} subtitle={`${a.patient?.name} with Dr. ${a.doctor?.user?.name}`}>
        <StatusBadge status={a.status} />
        {a.status === "pending" && canUpdateStatus && (
          <button className="btn btn-primary" disabled={busy} onClick={() => setStatus("confirmed")}>Confirm</button>
        )}
        {a.status === "confirmed" && canUpdateStatus && (
          <button className="btn btn-success" disabled={busy} onClick={() => setStatus("completed")}>Mark completed</button>
        )}
        {open && (
          <>
            <button className="btn btn-outline" onClick={() => { setNewDate(toInputDate()); setNewSlot(""); setReschedOpen(true); }}>
              <CalendarClock size={16} /> Reschedule
            </button>
            <button className="btn btn-outline" onClick={() => setCancelOpen(true)}>Cancel</button>
          </>
        )}
      </PageHeader>

      <div className="info-grid">
        <Card title="Patient">
          <Row label="Name" value={<Link className="link" to={`/patients/${a.patient?._id}`}>{a.patient?.name}</Link>} />
          <Row label="Patient ID" value={a.patient?.patientId} />
          <Row label="Phone" value={a.patient?.phone} />
        </Card>

        <Card title="Visit">
          <Row label="Doctor" value={a.doctor?.user?.name ? `Dr. ${a.doctor.user.name}` : ""} />
          <Row label="Specialization" value={a.doctor?.specialization} />
          <Row label="Date" value={formatDay(a.date)} />
          <Row label="Time" value={a.timeSlot} />
          <Row label="Reason" value={a.reason} />
          {a.status === "cancelled" && <Row label="Cancel reason" value={a.cancelReason} />}
          <Row label="Booked on" value={formatDateTime(a.createdAt)} />
        </Card>
      </div>

      {hasRole("admin", "doctor", "nurse") && a.status !== "cancelled" && (
        <div className="page-actions" style={{ marginTop: 16 }}>
          <Link className="btn btn-outline" to={`/records/new?patient=${a.patient?._id}&appointment=${a._id}`}>
            <ClipboardList size={16} /> Add medical record
          </Link>
          {hasRole("admin", "doctor") && (
            <Link className="btn btn-outline" to={`/prescriptions/new?patient=${a.patient?._id}`}>
              <Pill size={16} /> Write prescription
            </Link>
          )}
        </div>
      )}

      <CancelDialog
        open={cancelOpen}
        patientName={a.patient?.name}
        loading={busy}
        onConfirm={doCancel}
        onClose={() => setCancelOpen(false)}
      />

      <Modal
        open={reschedOpen}
        title="Reschedule appointment"
        onClose={() => setReschedOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setReschedOpen(false)}>Close</button>
            <button className="btn btn-primary" disabled={busy || !newSlot} onClick={doReschedule}>
              {busy ? "Saving..." : "Save new time"}
            </button>
          </>
        }
      >
        <FormField
          label="New date"
          name="newDate"
          type="date"
          min={toInputDate()}
          value={newDate}
          onChange={(e) => { setNewDate(e.target.value); setNewSlot(""); }}
        />
        <SlotsField doctorId={a.doctor?._id} date={newDate} value={newSlot} onChange={setNewSlot} refreshKey={refreshKey} />
      </Modal>
    </>
  );
}