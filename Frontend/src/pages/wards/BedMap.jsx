import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { createBed, deleteBed, getBeds, updateBedStatus } from "../../api/bedApi";
import { getWards } from "../../api/wardApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth";
import PageHeader from "../../components/common/PageHeader";
import FilterBar from "../../components/common/FilterBar";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import FormField from "../../components/common/FormField";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusBadge from "../../components/common/StatusBadge";
import BedTile from "../../components/bed/BedTile";
import BedLegend from "../../components/bed/BedLegend";
import WardTabs from "./WardTabs";

export default function BedMap() {
  useDocumentTitle("Bed map");
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const canSetStatus = hasRole("admin", "nurse");

  const [params, setParams] = useSearchParams();
  const ward = params.get("ward") || "";
  const [status, setStatus] = useState("");

  const wards = useFetch(() => getWards(), []);
  const { data, loading, error, reload } = useFetch(() => getBeds({ ward, status }), [ward, status]);

  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // add beds
  const [addOpen, setAddOpen] = useState(false);
  const [add, setAdd] = useState({ ward: "", mode: "several", bedNumber: "", prefix: "B", count: 5 });
  const [adding, setAdding] = useState(false);

  const beds = data?.data || [];

  // group beds by ward
  const groups = beds.reduce((acc, b) => {
    const key = b.ward?._id || "none";
    (acc[key] ||= { name: b.ward?.name || "No ward", beds: [] }).beds.push(b);
    return acc;
  }, {});

  const changeStatus = async (next) => {
    setBusy(true);
    try {
      await updateBedStatus(selected._id, next);
      toast.success(`Bed marked ${next}`);
      setSelected(null);
      reload();
      wards.reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const removeBed = async () => {
    setBusy(true);
    try {
      await deleteBed(selected._id);
      toast.success("Bed deleted");
      setConfirmDelete(false);
      setSelected(null);
      reload();
      wards.reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const saveBeds = async (e) => {
    e.preventDefault();
    if (!add.ward) return toast.error("Select a ward");
    const body =
      add.mode === "one"
        ? { ward: add.ward, bedNumber: add.bedNumber.trim() }
        : { ward: add.ward, prefix: add.prefix.trim() || "B", count: Number(add.count) };
    if (add.mode === "one" && !body.bedNumber) return toast.error("Enter the bed number");
    if (add.mode === "several" && !(body.count > 0 && body.count <= 50)) return toast.error("Count must be 1 to 50");

    setAdding(true);
    try {
      await createBed(body);
      toast.success("Beds added");
      setAddOpen(false);
      reload();
      wards.reload();
    } catch (err) {
      toast.error(errMsg(err)); // duplicate bed numbers show up here
    } finally {
      setAdding(false);
    }
  };

  const setAddField = (e) => setAdd({ ...add, [e.target.name]: e.target.value });
  const adm = selected?.currentAdmission;

  return (
    <>
      <PageHeader title="Wards & Beds" subtitle="Click a bed for details">
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setAdd({ ...add, ward }); setAddOpen(true); }}>
            <Plus size={16} /> Add beds
          </button>
        )}
      </PageHeader>

      <WardTabs />

      <FilterBar onReset={() => { setParams({}); setStatus(""); }}>
        <select value={ward} onChange={(e) => setParams(e.target.value ? { ward: e.target.value } : {})}>
          <option value="">All wards</option>
          {(wards.data?.data || []).map((w) => (
            <option key={w._id} value={w._id}>{w.name}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </FilterBar>

      <BedLegend />
      {error && <p className="error">{error}</p>}

      {loading ? (
        <Loader />
      ) : !beds.length ? (
        <EmptyState title="No beds found" text={isAdmin ? "Use “Add beds” to create beds in a ward." : "Ask the admin to add beds."} />
      ) : (
        Object.entries(groups).map(([key, g]) => {
          const free = g.beds.filter((b) => b.status === "available").length;
          return (
            <section key={key} className="bed-group">
              <div className="bed-group-head">
                <h3>{g.name}</h3>
                <span className="muted">{free} of {g.beds.length} free</span>
              </div>
              <div className="bed-grid">
                {g.beds.map((b) => (
                  <BedTile key={b._id} bed={b} onClick={setSelected} />
                ))}
              </div>
            </section>
          );
        })
      )}

      {/* bed details */}
      <Modal
        open={!!selected && !confirmDelete}
        title={selected ? `Bed ${selected.bedNumber}` : ""}
        size="sm"
        onClose={() => setSelected(null)}
        footer={
          selected && (
            <>
              {isAdmin && selected.status !== "occupied" && (
                <button className="btn btn-outline" onClick={() => setConfirmDelete(true)}>Delete</button>
              )}
              {canSetStatus && selected.status === "available" && (
                <button className="btn btn-outline" disabled={busy} onClick={() => changeStatus("maintenance")}>
                  Mark maintenance
                </button>
              )}
              {canSetStatus && selected.status === "maintenance" && (
                <button className="btn btn-primary" disabled={busy} onClick={() => changeStatus("available")}>
                  Mark available
                </button>
              )}
            </>
          )
        }
      >
        {selected && (
          <>
            <div className="info-row"><span>Ward</span><b>{selected.ward?.name}</b></div>
            <div className="info-row"><span>Status</span><StatusBadge status={selected.status} /></div>
            {selected.status === "occupied" && adm && (
              <>
                <div className="info-row"><span>Patient</span><b>{adm.patient?.name || "-"}</b></div>
                <div className="info-row">
                  <span>Admission</span>
                  <Link className="link" to={`/admissions/${adm._id}`}>{adm.admissionNo}</Link>
                </div>
              </>
            )}
            {selected.status === "occupied" && (
              <p className="muted">To free this bed, discharge or transfer the patient.</p>
            )}
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        danger
        loading={busy}
        title="Delete bed?"
        message={`Bed ${selected?.bedNumber} will be removed permanently.`}
        confirmText="Delete"
        onConfirm={removeBed}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* add beds */}
      <Modal
        open={addOpen}
        title="Add beds"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="bed-form" type="submit" disabled={adding}>
              {adding ? "Adding..." : "Add"}
            </button>
          </>
        }
      >
        <form id="bed-form" onSubmit={saveBeds}>
          <FormField
            as="select"
            label="Ward"
            name="ward"
            value={add.ward}
            onChange={setAddField}
            options={(wards.data?.data || []).map((w) => ({ value: w._id, label: w.name }))}
            required
          />
          <FormField
            as="select"
            label="How many"
            name="mode"
            value={add.mode}
            onChange={setAddField}
            options={[{ value: "several", label: "Several beds at once" }, { value: "one", label: "One bed" }]}
          />
          {add.mode === "one" ? (
            <FormField label="Bed number" name="bedNumber" placeholder="e.g. G-06" value={add.bedNumber} onChange={setAddField} />
          ) : (
            <div className="form-grid">
              <FormField label="Prefix" name="prefix" placeholder="G" value={add.prefix} onChange={setAddField} />
              <FormField label="Number of beds" name="count" type="number" min="1" max="50" value={add.count} onChange={setAddField} />
            </div>
          )}
          {add.mode === "several" && (
            <p className="muted">
              Creates {add.prefix || "B"}-01, {add.prefix || "B"}-02 and so on. To add more later in the same ward, use a different prefix or add one bed at a time.
            </p>
          )}
        </form>
      </Modal>
    </>
  );
}