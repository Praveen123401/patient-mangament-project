import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  createDepartment, deleteDepartment, getDepartments, updateDepartment,
} from "../../api/departmentApi";
import { errMsg } from "../../api/axios";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { DEFAULT_DEPARTMENTS } from "../../utils/constants";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import FormField from "../../components/common/FormField";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import WardTabs from "./WardTabs";

const EMPTY = { name: "", description: "" };

export default function DepartmentList() {
  useDocumentTitle("Departments");
  const { data, loading, error, reload } = useFetch(() => getDepartments(), []);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setNameError("");
    setModal(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.name, description: d.description || "" });
    setNameError("");
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setNameError("Department name is required");
    setSaving(true);
    try {
      const body = { name: form.name.trim(), description: form.description.trim() };
      if (editing) await updateDepartment(editing._id, body);
      else await createDepartment(body);
      toast.success(editing ? "Department updated" : "Department added");
      setModal(false);
      reload();
    } catch (err) {
      toast.error(errMsg(err)); // a duplicate name shows up here
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteDepartment(toDelete._id);
      toast.success("Department removed");
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setDeleting(false);
    }
  };

  // creates only the standard departments that do not exist yet, so it is safe to click twice
  const addStandard = async () => {
    const have = new Set((data?.data || []).map((d) => d.name.toLowerCase()));
    const missing = DEFAULT_DEPARTMENTS.filter((n) => !have.has(n.toLowerCase()));
    if (!missing.length) return toast.success("All standard departments already exist");

    setSeeding(true);
    let added = 0;
    for (const name of missing) {
      try {
        await createDepartment({ name });
        added += 1;
      } catch {
        /* skip one that fails and carry on with the rest */
      }
    }
    setSeeding(false);
    toast.success(`${added} departments added`);
    reload();
  };

  const columns = [
    { header: "Department", render: (d) => <strong>{d.name}</strong> },
    { header: "Description", render: (d) => d.description || "-" },
    {
      header: "",
      width: 170,
      render: (d) => (
        <div className="row-actions">
          <button className="btn btn-outline btn-sm" onClick={() => openEdit(d)}>
            <Pencil size={13} /> Edit
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setToDelete(d)}>
            <Trash2 size={13} /> Remove
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Departments" subtitle="Cardiology, Orthopedics, General Medicine and so on">
        <button className="btn btn-outline" onClick={addStandard} disabled={seeding || loading}>
          {seeding ? "Adding..." : "Add standard departments"}
        </button>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Add department
        </button>
      </PageHeader>

      <WardTabs />

      {error && <p className="error">{error}</p>}
      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={loading}
        emptyText="No departments yet. Click “Add standard departments” to create the usual ones."
      />

      <Modal
        open={modal}
        title={editing ? "Edit department" : "Add department"}
        size="sm"
        onClose={() => setModal(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" form="dept-form" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <form id="dept-form" onSubmit={save} noValidate>
          <FormField
            label="Name"
            name="name"
            placeholder="e.g. Cardiology"
            value={form.name}
            onChange={(e) => { setForm({ ...form, name: e.target.value }); setNameError(""); }}
            error={nameError}
            required
          />
          <FormField
            as="textarea"
            label="Description"
            name="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        danger
        loading={deleting}
        title="Remove department?"
        message={`${toDelete?.name} will be deactivated. Existing wards and doctors keep their record.`}
        confirmText="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}