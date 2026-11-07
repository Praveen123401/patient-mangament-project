import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { createBill, getBills } from "../api/billingApi";
import { getPatients } from "../api/patientApi";
import { errMsg } from "../api/axios";
import useFetch from "../hooks/useFetch";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";
import PageHeader from "../components/common/PageHeader";
import FilterBar from "../components/common/FilterBar";
import DataTable from "../components/common/DataTable";
import Pagination from "../components/common/Pagination";
import StatusBadge from "../components/common/StatusBadge";
import Modal from "../components/common/Modal";
import FormField from "../components/common/FormField";
import SelectSearch from "../components/common/SelectSearch";

const EMPTY_ITEM = { description: "", amount: "", quantity: 1 };

export default function BillList() {
  useDocumentTitle("Billing");
  const navigate = useNavigate();

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(
    () => getBills({ status, page, limit: 10 }),
    [status, page]
  );

  // create bill
  const [open, setOpen] = useState(false);
  const [patient, setPatient] = useState(null);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  const setItem = (i, field, value) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));

  const total = items.reduce((s, it) => s + (Number(it.amount) || 0) * (Number(it.quantity) || 0), 0);

  const openNew = () => {
    setPatient(null);
    setItems([{ ...EMPTY_ITEM }]);
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!patient) return toast.error("Select a patient");
    const valid = items.filter((it) => it.description.trim());
    if (!valid.length) return toast.error("Add at least one item");
    if (valid.some((it) => !(Number(it.amount) >= 0) || it.amount === "" || !(Number(it.quantity) >= 1))) {
      return toast.error("Check the amount and quantity of each item");
    }

    setSaving(true);
    try {
      const res = await createBill({
        patient: patient._id,
        items: valid.map((it) => ({
          description: it.description.trim(),
          amount: Number(it.amount),
          quantity: Number(it.quantity),
        })),
      });
      toast.success(`Bill created: ${res.data.billNo}`);
      setOpen(false);
      reload();
      navigate(`/billing/${res.data._id}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { header: "Bill No", render: (b) => <strong>{b.billNo}</strong> },
    {
      header: "Patient",
      render: (b) => (
        <div>
          {b.patient?.name}
          <div className="muted">{b.patient?.patientId}</div>
        </div>
      ),
    },
    { header: "Date", render: (b) => formatDate(b.createdAt) },
    { header: "Total", render: (b) => formatCurrency(b.totalAmount) },
    { header: "Paid", render: (b) => formatCurrency(b.paidAmount) },
    {
      header: "Balance",
      render: (b) => {
        const bal = b.totalAmount - b.paidAmount;
        return <span className={bal > 0 ? "due" : "ok"}>{formatCurrency(bal)}</span>;
      },
    },
    { header: "Status", render: (b) => <StatusBadge status={b.status} /> },
    {
      header: "",
      width: 150,
      render: (b) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <Link className="btn btn-outline btn-sm" to={`/billing/${b._id}`}>View</Link>
          {b.status !== "paid" && b.totalAmount > b.paidAmount && (
            <Link className="btn btn-primary btn-sm" to={`/billing/${b._id}/pay`}>Pay</Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Billing" subtitle="Invoices and payments. Charges from admissions, lab and pharmacy are added automatically.">
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> New bill
        </button>
      </PageHeader>

      <FilterBar onReset={() => { setStatus(""); setPage(1); }}>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All bills</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partly paid</option>
          <option value="paid">Paid</option>
        </select>
      </FilterBar>

      {error && <p className="error">{error}</p>}
      <DataTable
        columns={columns}
        rows={data?.data || []}
        loading={loading}
        emptyText="No bills found"
        onRowClick={(b) => navigate(`/billing/${b._id}`)}
      />
      <Pagination page={data?.page} pages={data?.pages} total={data?.total} onChange={setPage} />

      <Modal
        open={open}
        title="New bill"
        size="lg"
        onClose={() => setOpen(false)}
        footer={
          <>
            <span className="muted" style={{ marginRight: "auto" }}>Total: <b>{formatCurrency(total)}</b></span>
            <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="bill-form" type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create bill"}
            </button>
          </>
        }
      >
        <form id="bill-form" onSubmit={save} noValidate>
          <SelectSearch
            label="Patient"
            placeholder="Name, patient ID or phone"
            fetcher={(q) => getPatients({ search: q, limit: 8 }).then((r) => r.data)}
            getLabel={(p) => p.name}
            getSub={(p) => p.patientId}
            value={patient}
            onSelect={setPatient}
          />

          <h4 style={{ margin: "8px 0 10px" }}>Items</h4>
          {items.map((it, i) => (
            <div className="bill-row" key={i}>
              <FormField label={i === 0 ? "Description" : undefined} name={`d${i}`} placeholder="e.g. Consultation fee" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} />
              <FormField label={i === 0 ? "Amount (₹)" : undefined} name={`a${i}`} type="number" min="0" value={it.amount} onChange={(e) => setItem(i, "amount", e.target.value)} />
              <FormField label={i === 0 ? "Qty" : undefined} name={`q${i}`} type="number" min="1" value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} />
              {items.length > 1 ? (
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setItems(items.filter((_, idx) => idx !== i))} aria-label="Remove item">
                  <Trash2 size={14} />
                </button>
              ) : (
                <span />
              )}
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setItems([...items, { ...EMPTY_ITEM }])}>
            <Plus size={14} /> Add item
          </button>
        </form>
      </Modal>
    </>
  );
}