import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDischarges } from "../../api/dischargeApi";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { formatDateTime } from "../../utils/formatDate";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/common/StatusBadge";

export default function DischargeList() {
  useDocumentTitle("Discharge records");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, loading, error } = useFetch(() => getDischarges({ page, limit: 10 }), [page]);

  const columns = [
    { header: "Admission No", render: (d) => d.admission?.admissionNo || "-" },
    {
      header: "Patient",
      render: (d) => (
        <div>
          <strong>{d.patient?.name}</strong>
          <div className="muted">{d.patient?.patientId}</div>
        </div>
      ),
    },
    { header: "Admitted", render: (d) => formatDateTime(d.admission?.admitDate) },
    { header: "Discharged", render: (d) => formatDateTime(d.dischargeDate) },
    { header: "Days", render: (d) => d.daysStayed ?? "-" },
    { header: "Condition", render: (d) => <StatusBadge status={d.condition === "recovered" ? "completed" : "pending"} /> },
    {
      header: "",
      render: (d) => (
        <Link className="link" to={`/admissions/${d.admission?._id}`} onClick={(e) => e.stopPropagation()}>
          Open
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Discharge records" subtitle="Patients discharged from the hospital" />
      {error && <p className="error">{error}</p>}
      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={loading}
        emptyText="No discharges yet"
        onRowClick={(d) => d.admission?._id && navigate(`/admissions/${d.admission._id}`)}
      />
      <Pagination page={data?.page} pages={data?.pages} total={data?.total} onChange={setPage} />
    </>
  );
}