import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { deletePatient, getPatients } from "../../api/patientApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDebounce from "../../hooks/useDebounce";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth.js";
import { BLOOD_GROUPS, GENDERS } from "../../utils/constants";
import calculateAge from "../../utils/calculateAge";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ExportButton from "../../components/common/ExportButton";
import Avatar from "../../components/common/Avatar";

export default function PatientList() {
  useDocumentTitle("Patients");
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [params] = useSearchParams();
  const urlSearch = params.get("search") || "";

  const [q, setQ] = useState(urlSearch);
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // the top bar search sends ?search=... so keep the box in sync
  useEffect(() => {
    setQ(urlSearch);
    setPage(1);
  }, [urlSearch]);

  const search = useDebounce(q);
  const { data, loading, error, reload } = useFetch(
    () => getPatients({ search, gender, bloodGroup, page, limit: 10 }),
    [search, gender, bloodGroup, page]
  );

  const canCreate = hasRole("admin", "receptionist", "nurse", "doctor");
  const canDelete = hasRole("admin");

  const columns = [
    { header: "Patient ID", key: "patientId" },
    {
      header: "Name",
      render: (p) => (
        <div className="name-cell">
          <Avatar name={p.name} size={32} />
          <strong>{p.name}</strong>
        </div>
      ),
    },
    { header: "Age / Gender", render: (p) => `${p.age ?? calculateAge(p.dob) ?? "-"} / ${p.gender}` },
    { header: "Phone", key: "phone" },
    { header: "Blood", render: (p) => p.bloodGroup || "-" },
    {
      header: "",
      width: 190,
      render: (p) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <Link className="btn btn-outline btn-sm" to={`/patients/${p._id}`}>View</Link>
          {canCreate && <Link className="btn btn-outline btn-sm" to={`/patients/${p._id}/edit`}>Edit</Link>}
          {canDelete && (
            <button className="btn btn-outline btn-sm" onClick={() => setToDelete(p)}>Remove</button>
          )}
        </div>
      ),
    },
  ];

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePatient(toDelete._id);
      toast.success("Patient removed");
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setDeleting(false);
    }
  };
  const rows = data?.data || [];

  return (
    <>
      <PageHeader title="Patients" subtitle="All registered patients">
        <ExportButton
          rows={rows}
          filename="patients.csv"
          columns={[
            { label: "Patient ID", key: "patientId" },
            { label: "Name", key: "name" },
            { label: "Gender", key: "gender" },
            { label: "Phone", key: "phone" },
            { label: "Blood group", key: "bloodGroup" },
          ]}
        />
        {canCreate && (
          <Link to="/patients/new" className="btn btn-primary"><Plus size={16} /> Add patient</Link>
        )}
      </PageHeader>

      <FilterBar
        search={q}
        onSearch={(v) => { setQ(v); setPage(1); }}
        placeholder="Search by name, ID or phone"
        onReset={() => { setQ(""); setGender(""); setBloodGroup(""); setPage(1); }}
      >
        <select value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }}>
          <option value="">All genders</option>
          {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={bloodGroup} onChange={(e) => { setBloodGroup(e.target.value); setPage(1); }}>
          <option value="">All blood groups</option>
          {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </FilterBar>

      {error && <p className="error">{error}</p>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No patients found"
        onRowClick={(p) => navigate(`/patients/${p._id}`)}
      />
      <Pagination page={data?.page} pages={data?.pages} total={data?.total} onChange={setPage} />

      <ConfirmDialog
        open={!!toDelete}
        danger
        loading={deleting}
        title="Remove patient?"
        message={`${toDelete?.name} will be hidden from the patient list. Their records are kept.`}
        confirmText="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}