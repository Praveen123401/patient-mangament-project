import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { admitPatient } from "../../api/admissionApi";
import { getPatient, getPatients } from "../../api/patientApi";
import { getDoctors } from "../../api/doctorApi";
import { getWards } from "../../api/wardApi";
import { getAvailableBeds } from "../../api/bedApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { formatCurrency } from "../../utils/formatCurrency";
import Breadcrumb from "../../components/common/Breadcrumb";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import SelectSearch from "../../components/common/SelectSearch";
import PatientSummary from "../../components/patient/PatientSummary";

export default function AdmitPatient() {
  useDocumentTitle("Admit patient");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetPatient = params.get("patient");

  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({ doctor: "", ward: "", bed: "", reason: "", diagnosis: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // patient chosen from the patient page (?patient=ID)
  useEffect(() => {
    if (presetPatient) getPatient(presetPatient).then((r) => setPatient(r.data)).catch(() => {});
  }, [presetPatient]);

  const doctors = useFetch(() => getDoctors({ limit: 100 }), []);
  const wards = useFetch(() => getWards(), []);
  const beds = useFetch(
    () => (form.ward ? getAvailableBeds({ ward: form.ward }) : Promise.resolve({ data: [] })),
    [form.ward]
  );

  const wardList = (wards.data?.data || []).filter((w) => (w.beds?.available || 0) > 0);
  const selectedWard = wardList.find((w) => w._id === form.ward);

  const set = (e) => {
    const { name, value } = e.target;
    // changing the ward clears the chosen bed
    setForm({ ...form, [name]: value, ...(name === "ward" ? { bed: "" } : {}) });
    setErrors({ ...errors, [name]: "" });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!patient) errs.patient = "Select a patient";
    if (!form.doctor) errs.doctor = "Select a doctor";
    if (!form.bed) errs.bed = "Select a bed";
    if (!form.reason.trim()) errs.reason = "Reason is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const res = await admitPatient({
        patient: patient._id,
        doctor: form.doctor,
        bed: form.bed,
        reason: form.reason.trim(),
        diagnosis: form.diagnosis.trim(),
      });
      toast.success(`Admitted: ${res.data.admissionNo}`);
      navigate(`/admissions/${res.data._id}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Admissions", to: "/admissions" }, { label: "Admit patient" }]} />
      <PageHeader title="Admit patient" subtitle="Patient IN: assigns a bed and starts the stay" />

      <form onSubmit={onSubmit} noValidate>
        <Card title="Patient">
          {patient ? (
            <>
              <PatientSummary patient={patient} />
              {!presetPatient && (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setPatient(null)}>
                  Change patient
                </button>
              )}
            </>
          ) : (
            <SelectSearch
              label="Search patient"
              placeholder="Name, patient ID or phone"
              fetcher={(q) => getPatients({ search: q, limit: 8 }).then((r) => r.data)}
              getLabel={(p) => p.name}
              getSub={(p) => p.patientId}
              value={patient}
              onSelect={(p) => { setPatient(p); setErrors({ ...errors, patient: "" }); }}
            />
          )}
          {errors.patient && <small className="error">{errors.patient}</small>}
        </Card>

        <div style={{ height: 14 }} />

        <Card title="Bed and doctor">
          <div className="form-grid">
            <FormField
              as="select"
              label="Doctor"
              name="doctor"
              value={form.doctor}
              onChange={set}
              error={errors.doctor}
              required
              options={(doctors.data?.data || []).map((d) => ({
                value: d._id,
                label: `Dr. ${d.user?.name} (${d.specialization})`,
              }))}
            />
            <FormField
              as="select"
              label="Ward"
              name="ward"
              value={form.ward}
              onChange={set}
              options={wardList.map((w) => ({ value: w._id, label: `${w.name} - ${w.beds.available} free` }))}
            />
            <FormField
              as="select"
              label="Bed"
              name="bed"
              value={form.bed}
              onChange={set}
              error={errors.bed}
              required
              disabled={!form.ward}
              options={(beds.data?.data || []).map((b) => ({ value: b._id, label: b.bedNumber }))}
            />
          </div>

          {!wards.loading && wardList.length === 0 && (
            <p className="muted">
              No free beds. Add wards and beds first in <Link className="link" to="/wards">Wards &amp; Beds</Link>.
            </p>
          )}
          {selectedWard && (
            <p className="muted">
              {selectedWard.type} ward · {formatCurrency(selectedWard.chargePerDay)} per day
            </p>
          )}
        </Card>

        <div style={{ height: 14 }} />

        <Card title="Reason for admission">
          <FormField as="textarea" label="Reason" name="reason" value={form.reason} onChange={set} error={errors.reason} required />
          <FormField label="Provisional diagnosis" name="diagnosis" value={form.diagnosis} onChange={set} />
        </Card>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Admitting..." : "Admit patient"}
          </button>
        </div>
      </form>
    </>
  );
}