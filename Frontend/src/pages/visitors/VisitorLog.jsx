import { useState } from "react";
import { Plus, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { getVisitors, visitorIn, visitorOut } from "../../api/visitorApi";
import { getAdmissions } from "../../api/admissionApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import FormField from "../../components/common/FormField";

const EMPTY_FORM = {
  visitorName: "",
  phone: "",
  patient: "",
  relation: "",
  purpose: "",
  idProof: "",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("en-IN");
};

export default function VisitorLog() {
  useDocumentTitle("Visitors");

  const [insideOnly, setInsideOnly] = useState(true);
  const [date, setDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] = useState("");

  const visitors = useFetch(
    () =>
      getVisitors({
        inside: insideOnly ? "true" : undefined,
        date: date || undefined,
        limit: 100,
      }),
    [insideOnly, date]
  );
  const admissions = useFetch(
    () => getAdmissions({ status: "admitted", limit: 100 }),
    []
  );

  const admittedPatients = (admissions.data?.data || [])
    .filter((admission) => admission.patient?._id)
    .map((admission) => admission.patient);

  const updateForm = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const registerVisitor = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await visitorIn({        ...form,
        visitorName: form.visitorName.trim(),
        patient: form.patient,
      });
      toast.success("Visitor checked in");
      setForm(EMPTY_FORM);
      setModalOpen(false);
      visitors.reload();
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setSaving(false);
    }
  };

  const checkOut = async (visitor) => {
    setCheckingOut(visitor._id);
    try {
      await visitorOut(visitor._id);
      toast.success("Visitor checked out");
      visitors.reload();
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setCheckingOut("");
    }
  };

  const rows = visitors.data?.data || [];
  const columns = [
    { header: "Visitor", key: "visitorName" },
    { header: "Phone", key: "phone" },
    {
      header: "Patient",
      render: (visitor) =>
        visitor.patient?.fullName || visitor.patient?.name || "-",
    },
    { header: "Relation", key: "relation" },
    { header: "Purpose", key: "purpose" },
    { header: "Checked in", render: (visitor) => formatDateTime(visitor.inTime) },
    {
      header: "Checked out",
      render: (visitor) =>
        visitor.outTime ? (
          formatDateTime(visitor.outTime)
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={checkingOut === visitor._id}
            onClick={() => checkOut(visitor)}
          >
            {checkingOut === visitor._id ? "Checking out..." : "Check out"}
          </button>
        ),
    },
  ];

  return (
    <>
      <PageHeader title="Visitor log" subtitle="Record visitor check-ins and check-outs">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
          disabled={!admittedPatients.length}
          title={!admittedPatients.length ? "Visitors can only be registered for admitted patients" : ""}
        >
          <Plus size={16} /> Check in visitor
        </button>
      </PageHeader>

      <div className="filter-bar">
        <label>
          <input
            type="checkbox"
            checked={insideOnly}
            onChange={(event) => setInsideOnly(event.target.checked)}
          />{" "}
          Show visitors currently inside only
        </label>
        <FormField
          label="Visit date"
          name="visitor-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      {visitors.error && <p className="error">{visitors.error}</p>}
      {admissions.error && <p className="error">Unable to load admitted patients: {admissions.error}</p>}
      {!admissions.loading && !admittedPatients.length && (
        <p className="muted">Visitors can be checked in only for currently admitted patients.</p>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        loading={visitors.loading}
        emptyText="No visitor records found"
      />

      <Modal
        open={modalOpen}
        title="Check in visitor"
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              form="visitor-form"
              disabled={saving || admissions.loading || !admittedPatients.length}
            >
              <UserCheck size={16} />
              {saving ? "Checking in..." : "Check in"}
            </button>
          </>
        }
      >
        <form id="visitor-form" onSubmit={registerVisitor} noValidate>
          <FormField
            label="Visitor name"
            name="visitorName"
            value={form.visitorName}
            onChange={updateForm}
            required
            minLength={2}
          />
          <FormField
            as="select"
            label="Admitted patient"
            name="patient"
            value={form.patient}
            onChange={updateForm}
            required
            options={admittedPatients.map((patient) => ({
              value: patient._id,
              label: `${patient.fullName || patient.name} (${patient.patientId})`,
            }))}
          />
          <FormField
            label="Phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={updateForm}
          />
          <FormField
            label="Relation to patient"
            name="relation"
            value={form.relation}
            onChange={updateForm}
          />
          <FormField
            label="Purpose of visit"
            name="purpose"
            value={form.purpose}
            onChange={updateForm}
          />
          <FormField
            label="ID proof"
            name="idProof"
            value={form.idProof}
            onChange={updateForm}
          />
        </form>
      </Modal>
    </>
  );
}
