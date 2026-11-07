import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getAdmission } from "../../api/admissionApi";
import { dischargePatient } from "../../api/dischargeApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { DISCHARGE_CONDITIONS } from "../../utils/constants";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateTime, toInputDate } from "../../utils/formatDate";
import Breadcrumb from "../../components/common/Breadcrumb";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Loader from "../../components/common/Loader";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const EMPTY_MED = { name: "", dosage: "", frequency: "", duration: "" };

export default function DischargePatient() {
  useDocumentTitle("Discharge patient");
  const { id } = useParams(); // the admission id
  const navigate = useNavigate();

  const { data, loading, error } = useFetch(() => getAdmission(id), [id]);
  const [form, setForm] = useState({
    condition: "recovered",
    finalDiagnosis: "",
    treatmentGiven: "",
    summary: "",
    followUpDate: "",
  });
  const [meds, setMeds] = useState([{ ...EMPTY_MED }]);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  if (loading) return <Loader />;
  const a = data?.data;
  if (!a) return <p className="error">{error || "Admission not found"}</p>;
  if (a.status !== "admitted") return <p className="error">This patient is already discharged.</p>;

  const days = Math.max(1, Math.ceil((Date.now() - new Date(a.admitDate)) / 86400000));

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const setMed = (i, field, value) =>
    setMeds(meds.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  const submit = async () => {
    setSaving(true);
    try {
      await dischargePatient(id, {
        condition: form.condition,
        finalDiagnosis: form.finalDiagnosis.trim() || a.diagnosis,
        treatmentGiven: form.treatmentGiven.trim(),
        summary: form.summary.trim(),
        followUpDate: form.followUpDate || undefined,
        medicinesOnDischarge: meds.filter((m) => m.name.trim()),
      });
      toast.success("Patient discharged. Final bill created.");
      navigate(`/admissions/${id}`);
    } catch (err) {
      toast.error(errMsg(err));
      setConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  // the button only opens the confirmation box
  const onSubmit = (e) => {
    e.preventDefault();
    setConfirm(true);
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Admissions", to: "/admissions" },
          { label: a.admissionNo, to: `/admissions/${id}` },
          { label: "Discharge" },
        ]}
      />
      <PageHeader title="Discharge patient" subtitle="Patient OUT: frees the bed and creates the final bill" />

      <Card title="Stay so far">
        <div className="info-row"><span>Patient</span><b>{a.patient?.name} ({a.patient?.patientId})</b></div>
        <div className="info-row"><span>Ward / Bed</span><b>{a.ward?.name} / {a.bed?.bedNumber}</b></div>
        <div className="info-row"><span>Admitted</span><b>{formatDateTime(a.admitDate)}</b></div>
        <div className="info-row"><span>Days so far</span><b>{days}</b></div>
        <div className="info-row">
          <span>Bed rate</span>
          <b>{formatCurrency(a.ward?.chargePerDay)} per day (final charges are added to the bill on discharge)</b>
        </div>
      </Card>

      <div style={{ height: 14 }} />

      <form onSubmit={onSubmit}>
        <Card title="Discharge details">
          <div className="form-grid">
            <FormField
              as="select"
              label="Condition at discharge"
              name="condition"
              value={form.condition}
              onChange={set}
              options={DISCHARGE_CONDITIONS}
            />
            <FormField
              label="Follow-up date"
              name="followUpDate"
              type="date"
              min={toInputDate()}
              value={form.followUpDate}
              onChange={set}
            />
          </div>
          <FormField
            label="Final diagnosis"
            name="finalDiagnosis"
            placeholder={a.diagnosis || ""}
            value={form.finalDiagnosis}
            onChange={set}
          />
          <FormField as="textarea" label="Treatment given" name="treatmentGiven" value={form.treatmentGiven} onChange={set} />
          <FormField as="textarea" label="Summary and instructions" name="summary" value={form.summary} onChange={set} />
        </Card>

        <div style={{ height: 14 }} />

        <Card
          title="Medicines on discharge"
          actions={
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setMeds([...meds, { ...EMPTY_MED }])}>
              <Plus size={14} /> Add medicine
            </button>
          }
        >
          {meds.map((m, i) => (
            <div className="row-grid" key={i}>
              <FormField label={i === 0 ? "Medicine" : undefined} name={`name${i}`} value={m.name} onChange={(e) => setMed(i, "name", e.target.value)} />
              <FormField label={i === 0 ? "Dosage" : undefined} name={`dosage${i}`} placeholder="500mg" value={m.dosage} onChange={(e) => setMed(i, "dosage", e.target.value)} />
              <FormField label={i === 0 ? "Frequency" : undefined} name={`freq${i}`} placeholder="1-0-1" value={m.frequency} onChange={(e) => setMed(i, "frequency", e.target.value)} />
              <FormField label={i === 0 ? "Duration" : undefined} name={`dur${i}`} placeholder="5 days" value={m.duration} onChange={(e) => setMed(i, "duration", e.target.value)} />
              {meds.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginBottom: 16 }}
                  onClick={() => setMeds(meds.filter((_, idx) => idx !== i))}
                  aria-label="Remove medicine"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </Card>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary">Discharge patient</button>
        </div>
      </form>

      <ConfirmDialog
        open={confirm}
        danger
        loading={saving}
        title="Discharge this patient?"
        message="The bed will be freed and the final bill created. This cannot be undone."
        confirmText="Discharge"
        onConfirm={submit}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}