import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getAdmission, transferBed } from "../../api/admissionApi";
import { getWards } from "../../api/wardApi";
import { getAvailableBeds } from "../../api/bedApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import Breadcrumb from "../../components/common/Breadcrumb";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Loader from "../../components/common/Loader";

export default function TransferBed() {
  useDocumentTitle("Transfer bed");
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ward: "", newBed: "", reason: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const adm = useFetch(() => getAdmission(id), [id]);
  const wards = useFetch(() => getWards(), []);
  const beds = useFetch(
    () => (form.ward ? getAvailableBeds({ ward: form.ward }) : Promise.resolve({ data: [] })),
    [form.ward]
  );

  const set = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value, ...(name === "ward" ? { newBed: "" } : {}) });
    setErrors({ ...errors, [name]: "" });
  };

  if (adm.loading) return <Loader />;
  const a = adm.data?.data;
  if (!a) return <p className="error">{adm.error || "Admission not found"}</p>;
  if (a.status !== "admitted") return <p className="error">Only currently admitted patients can be transferred.</p>;

  const wardList = (wards.data?.data || []).filter((w) => (w.beds?.available || 0) > 0);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.newBed) {
      setErrors({ newBed: "Select the new bed" });
      return;
    }
    setSaving(true);
    try {
      await transferBed(id, { newBed: form.newBed, reason: form.reason.trim() });
      toast.success("Patient transferred");
      navigate(`/admissions/${id}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Admissions", to: "/admissions" },
          { label: a.admissionNo, to: `/admissions/${id}` },
          { label: "Transfer" },
        ]}
      />
      <PageHeader title="Transfer bed" subtitle={`${a.patient?.name} · now in ${a.ward?.name}, bed ${a.bed?.bedNumber}`} />

      <form onSubmit={onSubmit} noValidate>
        <Card title="New bed">
          <div className="form-grid">
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
              name="newBed"
              value={form.newBed}
              onChange={set}
              error={errors.newBed}
              required
              disabled={!form.ward}
              options={(beds.data?.data || [])
                .filter((b) => b._id !== a.bed?._id)
                .map((b) => ({ value: b._id, label: b.bedNumber }))}
            />
          </div>
          <FormField as="textarea" label="Reason for transfer" name="reason" value={form.reason} onChange={set} />
          <p className="muted">Bed charges are calculated per ward at discharge.</p>
        </Card>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Transferring..." : "Transfer patient"}
          </button>
        </div>
      </form>
    </>
  );
}