import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { createWard, deleteWard, getWards, updateWard } from "../../api/wardApi";
import { createBed } from "../../api/bedApi";
import { getDepartments } from "../../api/departmentApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth";
import { STANDARD_WARDS, WARD_TYPES } from "../../utils/constants";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/common/EmptyState";
import Modal from "../../components/common/Modal";
import FormField from "../../components/common/FormField";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import WardSummaryCard from "../../components/bed/WardSummaryCard";
import WardTabs from "./WardTabs";

const EMPTY = { name: "", type: "general", department: "", floor: "", chargePerDay: "" };

export default function WardList() {
  useDocumentTitle("Wards");
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  const { data, loading, error, reload } = useFetch(() => getWards(), []);
  const departments = useFetch(() => getDepartments(), []);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null); // ward being edited, or null for a new one
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setModal(true);
  };

  const openEdit = (w) => {
    setEditing(w);
    setForm({
      name: w.name,
      type: w.type,
      department: w.department?._id || "",
      floor: w.floor ?? "",
      chargePerDay: w.chargePerDay ?? "",
    });
    setErrors({});
    setModal(true);
  };

  const set = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Ward name is required";
    if (form.chargePerDay !== "" && Number(form.chargePerDay) < 0) errs.chargePerDay = "Cannot be negative";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const body = {
      name: form.name.trim(),
      type: form.type,
      department: form.department || undefined,
      floor: form.floor === "" ? undefined : Number(form.floor),
      chargePerDay: form.chargePerDay === "" ? 0 : Number(form.chargePerDay),
    };

    setSaving(true);
    try {
      if (editing) await updateWard(editing._id, body);
      else await createWard(body);
      toast.success(editing ? "Ward updated" : "Ward created");
      setModal(false);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteWard(toDelete._id);
      toast.success("Ward removed");
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setDeleting(false);
    }
  };

  // creates the standard wards that do not exist yet, each with its beds. Safe to click twice.
  const addStandard = async () => {
    const have = new Set((data?.data || []).map((w) => w.name.toLowerCase()));
    const missing = STANDARD_WARDS.filter((w) => !have.has(w.name.toLowerCase()));
    if (!missing.length) return toast.success("All standard wards already exist");

    setSeeding(true);
    let wardsAdded = 0;
    let bedsAdded = 0;
    for (const w of missing) {
      try {
        const res = await createWard({ name: w.name, type: w.type, floor: w.floor, chargePerDay: w.chargePerDay });
        wardsAdded += 1;
        try {
          const beds = await createBed({ ward: res.data._id, prefix: w.prefix, count: w.beds });
          bedsAdded += beds.count || w.beds;
        } catch {
          /* the ward exists; add its beds later from the Bed map */
        }
      } catch {
        /* skip this ward and carry on with the rest */
      }
    }
    setSeeding(false);
    toast.success(`${wardsAdded} wards and ${bedsAdded} beds added`);
    reload();
  };

  const wards = data?.data || [];

  return (
    <>
      <PageHeader title="Wards & Beds" subtitle="Ward capacity and bed availability">
        {isAdmin && (
          <>
            <button className="btn btn-outline" onClick={addStandard} disabled={seeding || loading}>
              {seeding ? "Adding..." : "Add standard wards and beds"}
            </button>
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={16} /> Add ward
            </button>
          </>
        )}
      </PageHeader>

      <WardTabs />

      {error && <p className="error">{error}</p>}
      {loading ? (
        <Loader />
      ) : !wards.length ? (
        <EmptyState
          title="No wards yet"
          text={
            isAdmin
              ? "Create the usual wards with their beds in one click, or add a ward yourself."
              : "Ask the admin to add wards."
          }
          action={
            isAdmin && (
              <button className="btn btn-primary" onClick={addStandard} disabled={seeding}>
                {seeding ? "Adding..." : "Add standard wards and beds"}
              </button>
            )
          }
        />
      ) : (
        <div className="ward-grid">
          {wards.map((w) => (
            <div key={w._id}>
              <WardSummaryCard ward={w} onClick={() => navigate(`/wards/beds?ward=${w._id}`)} />
              {isAdmin && (
                <div className="ward-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(w)}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setToDelete(w)}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        title={editing ? "Edit ward" : "Add ward"}
        onClose={() => setModal(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="ward-form" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <form id="ward-form" onSubmit={save} noValidate>
          <FormField label="Ward name" name="name" placeholder="e.g. General Ward A" value={form.name} onChange={set} error={errors.name} required />
          <div className="form-grid">
            <FormField as="select" label="Type" name="type" value={form.type} onChange={set} options={WARD_TYPES} />
            <FormField
              as="select"
              label="Department"
              name="department"
              value={form.department}
              onChange={set}
              options={(departments.data?.data || []).map((d) => ({ value: d._id, label: d.name }))}
            />
            <FormField label="Floor" name="floor" type="number" min="0" value={form.floor} onChange={set} />
            <FormField
              label="Charge per day (₹)"
              name="chargePerDay"
              type="number"
              min="0"
              value={form.chargePerDay}
              onChange={set}
              error={errors.chargePerDay}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        danger
        loading={deleting}
        title="Remove ward?"
        message={`${toDelete?.name} will be deactivated. A ward with occupied beds cannot be removed.`}
        confirmText="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}