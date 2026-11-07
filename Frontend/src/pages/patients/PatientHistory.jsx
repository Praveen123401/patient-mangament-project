import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPatientHistory } from "../../api/patientApi";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import Breadcrumb from "../../components/common/Breadcrumb";
import Tabs from "../../components/common/Tabs";
import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import PatientSummary from "../../components/patient/PatientSummary";

export default function PatientHistory() {
  const { id } = useParams();
  useDocumentTitle("Patient history");
  const [tab, setTab] = useState("appointments");
  const { data, loading, error } = useFetch(() => getPatientHistory(id), [id]);

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;

  const h = data?.data;
  if (!h) return null;

  const tabs = [
    { key: "appointments", label: "Appointments", count: h.appointments.length },
    { key: "records", label: "Medical records", count: h.records.length },
    { key: "prescriptions", label: "Prescriptions", count: h.prescriptions.length },
    { key: "admissions", label: "Admissions", count: h.admissions.length },
    { key: "labOrders", label: "Lab", count: h.labOrders.length },
    { key: "bills", label: "Bills", count: h.bills.length },
  ];

  const tables = {
    appointments: {
      rows: h.appointments,
      columns: [
        { header: "Date", render: (a) => formatDate(a.date) },
        { header: "Time", key: "timeSlot" },
        { header: "Doctor", render: (a) => a.doctor?.user?.name || "-" },
        { header: "Reason", render: (a) => a.reason || "-" },
        { header: "Status", render: (a) => <StatusBadge status={a.status} /> },
      ],
    },
    records: {
      rows: h.records,
      columns: [
        { header: "Date", render: (r) => formatDate(r.createdAt) },
        { header: "Diagnosis", render: (r) => r.diagnosis || "-" },
        { header: "Symptoms", render: (r) => (r.symptoms || []).join(", ") || "-" },
        { header: "BP", render: (r) => r.vitals?.bp || "-" },
        { header: "", render: (r) => <Link className="link" to={`/records/${r._id}`}>Open</Link> },
      ],
    },
    prescriptions: {
      rows: h.prescriptions,
      columns: [
        { header: "Date", render: (r) => formatDate(r.createdAt) },
        { header: "Medicines", render: (r) => r.medicines.map((m) => m.name).join(", ") },
        { header: "", render: (r) => <Link className="link" to={`/prescriptions/${r._id}`}>View</Link> },
      ],
    },
    admissions: {
      rows: h.admissions,
      columns: [
        { header: "Admission No", key: "admissionNo" },
        { header: "Ward / Bed", render: (a) => `${a.ward?.name || "-"} / ${a.bed?.bedNumber || "-"}` },
        { header: "Admitted", render: (a) => formatDateTime(a.admitDate) },
        { header: "Discharged", render: (a) => (a.dischargeDate ? formatDateTime(a.dischargeDate) : "-") },
        { header: "Status", render: (a) => <StatusBadge status={a.status} /> },
        { header: "", render: (a) => <Link className="link" to={`/admissions/${a._id}`}>Open</Link> },
      ],
    },
    labOrders: {
      rows: h.labOrders,
      columns: [
        { header: "Order No", key: "orderNo" },
        { header: "Tests", render: (o) => o.tests.map((t) => t.test?.name).filter(Boolean).join(", ") },
        { header: "Date", render: (o) => formatDate(o.createdAt) },
        { header: "Status", render: (o) => <StatusBadge status={o.status} /> },
        {
          header: "",
          render: (o) =>
            o.status === "completed" ? <Link className="link" to={`/lab/orders/${o._id}/report`}>Report</Link> : null,
        },
      ],
    },
    bills: {
      rows: h.bills,
      columns: [
        { header: "Bill No", key: "billNo" },
        { header: "Date", render: (b) => formatDate(b.createdAt) },
        { header: "Total", render: (b) => formatCurrency(b.totalAmount) },
        { header: "Paid", render: (b) => formatCurrency(b.paidAmount) },
        { header: "Status", render: (b) => <StatusBadge status={b.status} /> },
        { header: "", render: (b) => <Link className="link" to={`/billing/${b._id}`}>Open</Link> },
      ],
    },
  };

  const current = tables[tab];

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Patients", to: "/patients" },
          { label: h.patient.name, to: `/patients/${id}` },
          { label: "History" },
        ]}
      />
      <PatientSummary patient={h.patient} />
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <DataTable columns={current.columns} rows={current.rows} emptyText="Nothing recorded yet" />
    </>
  );
}