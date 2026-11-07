import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { getAdmissions } from "../../api/admissionApi";
import { getWards } from "../../api/wardApi";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth";
import { formatDateTime } from "../../utils/formatDate";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";

const daysBetween = (from, to) =>
  Math.max(1, Math.ceil((new Date(to || Date.now()) - new Date(from)) / 86400000));

export default function AdmissionList() {
  useDocumentTitle("Admissions");
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [status, setStatus] = useState("admitted");
  const [ward, setWard] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error } = useFetch(
    () => getAdmissions({ status, ward, page, limit: 10 }),
    [status, ward, page]
  );
  const wards = useFetch(() => getWards(), []);

  const columns = [
    { header: "Admission No", key: "admissionNo" },
    {
      header: "Patient",
      render: (a) => (
        <div>
          <strong>{a.patient?.name}</strong>
          <div className="muted">{a.patient?.patientId}</div>
        </div>
      ),
    },
    { header: "Ward / Bed", render: (a) => `${a.ward?.name || "-"} / ${a.bed?.bedNumber || "-"}` },
    { header: "Doctor", render: (a) => (a.doctor?.user?.name ? `Dr. ${a.doctor.user.name}` : "-") },
    { header: "Admitted", render: (a) => formatDateTime(a.admitDate) },
    { header: "Days", render: (a) => daysBetween(a.admitDate, a.dischargeDate) },
    { header: "Status", render: (a) => <StatusBadge status={a.status} /> },
  ];

  return (
    <>
      <PageHeader title="Admissions" subtitle="Patients admitted to wards">
        {hasRole("admin", "doctor", "receptionist") && (
          <Link to="/admissions/new" className="btn btn-primary">
            <Plus size={16} /> Admit patient
          </Link>
        )}
      </PageHeader>

      <FilterBar onReset={() => { setStatus("admitted"); setWard(""); setPage(1); }}>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="admitted">Currently admitted</option>
          <option value="discharged">Discharged</option>
          <option value="">All</option>
        </select>
        <select value={ward} onChange={(e) => { setWard(e.target.value); setPage(1); }}>
          <option value="">All wards</option>
          {(wards.data?.data || []).map((w) => (
            <option key={w._id} value={w._id}>{w.name}</option>
          ))}
        </select>
      </FilterBar>

      {error && <p className="error">{error}</p>}

      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={loading}
        emptyText="No admissions found"
        onRowClick={(a) => navigate(`/admissions/${a._id}`)}
      />
      <Pagination page={data?.page} pages={data?.pages} total={data?.total} onChange={setPage} />
    </>
  );
}