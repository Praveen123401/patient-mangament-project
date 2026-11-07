import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { IndianRupee, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { addBillItem, getBill } from "../api/billingApi";
import { errMsg } from "../api/axios";
import useFetch from "../hooks/useFetch";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate, formatDateTime } from "../utils/formatDate";
import Breadcrumb from "../components/common/Breadcrumb";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Tabs from "../components/common/Tabs";
import DataTable from "../components/common/DataTable";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import FormField from "../components/common/FormField";
import StatusBadge from "../components/common/StatusBadge";
import InvoiceActions from "../components/print/InvoiceActions";
import InvoiceTemplate from "../components/print/InvoiceTemplate";
import { MethodBadge } from "../components/common/PaymentMethodPicker";
export default function BillDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState("details");
  const { data, loading, error, reload } = useFetch(() => getBill(id), [id]);
  const bill = data?.data;
  useDocumentTitle(bill ? bill.billNo : "Bill");

  const [itemOpen, setItemOpen] = useState(false);
  const [item, setItem] = useState({ description: "", amount: "", quantity: 1 });
  const [saving, setSaving] = useState(false);

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;
  if (!bill) return null;

  const balance = bill.totalAmount - bill.paidAmount;
  const isPaid = bill.status === "paid";

  const saveItem = async (e) => {
    e.preventDefault();
    if (!item.description.trim()) return toast.error("Enter a description");
    if (item.amount === "" || Number(item.amount) < 0) return toast.error("Enter a valid amount");
    if (!(Number(item.quantity) >= 1)) return toast.error("Quantity must be at least 1");

    setSaving(true);
    try {
      await addBillItem(id, {
        description: item.description.trim(),
        amount: Number(item.amount),
        quantity: Number(item.quantity),
      });
      toast.success("Item added");
      setItemOpen(false);
      setItem({ description: "", amount: "", quantity: 1 });
      reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const itemColumns = [
    { header: "#", width: 50, render: (_, i) => i },
    { header: "Description", key: "description" },
    { header: "Qty", key: "quantity" },
    { header: "Rate", render: (i) => formatCurrency(i.amount) },
    { header: "Amount", render: (i) => <b>{formatCurrency(i.amount * i.quantity)}</b> },
  ];
  // DataTable does not pass the index, so number the rows here
  const itemRows = bill.items.map((it, i) => ({ ...it, _n: i + 1 }));
  itemColumns[0] = { header: "#", width: 50, render: (r) => r._n };

   const paymentColumns = [
    { header: "Date", render: (p) => formatDateTime(p.date) },
    { header: "Method", render: (p) => <MethodBadge method={p.method} /> },
    { header: "Reference", render: (p) => p.reference || "-" },
    { header: "Amount", render: (p) => <b>{formatCurrency(p.amount)}</b> },
  ];

  return (
    <>
      <Breadcrumb items={[{ label: "Billing", to: "/billing" }, { label: bill.billNo }]} />

      <PageHeader title={bill.billNo} subtitle={`${bill.patient?.name} · ${bill.patient?.patientId} · ${formatDate(bill.createdAt)}`}>
        <StatusBadge status={bill.status} />
        {!isPaid && (
          <button className="btn btn-outline" onClick={() => setItemOpen(true)}>
            <Plus size={16} /> Add item
          </button>
        )}
        {!isPaid && balance > 0 && (
          <Link to={`/billing/${bill._id}/pay`} className="btn btn-primary">
            <IndianRupee size={16} /> Record payment
          </Link>
        )}
      </PageHeader>

      <Tabs
        tabs={[
          { key: "details", label: "Details" },
          { key: "invoice", label: "Invoice (print)" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "details" ? (
        <>
          <Card title="Items">
            <DataTable columns={itemColumns} rows={itemRows} emptyText="No items on this bill" />
          </Card>

          <div style={{ height: 14 }} />

          <div className="info-grid">
            <Card title="Payments">
              <DataTable columns={paymentColumns} rows={bill.payments} emptyText="No payments recorded yet" />
            </Card>

            <Card title="Summary">
              <div className="info-row"><span>Total</span><b>{formatCurrency(bill.totalAmount)}</b></div>
              <div className="info-row"><span>Paid</span><b>{formatCurrency(bill.paidAmount)}</b></div>
              <div className="info-row big">
                <span>Balance due</span>
                <b className={balance > 0 ? "due" : "ok"}>{formatCurrency(balance)}</b>
              </div>
              {bill.admission && (
                <div className="info-row">
                  <span>Admission</span>
                  <Link className="link" to={`/admissions/${bill.admission}`}>View admission</Link>
                </div>
              )}
              <div className="info-row">
                <span>Patient</span>
                <Link className="link" to={`/patients/${bill.patient?._id}`}>{bill.patient?.name}</Link>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <>
          <InvoiceActions bill={bill} />
          <InvoiceTemplate bill={bill} />
        </>
      )}

      <Modal
        open={itemOpen}
        title="Add item to bill"
        size="sm"
        onClose={() => setItemOpen(false)}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setItemOpen(false)}>Cancel</button>
            <button className="btn btn-primary" form="item-form" type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add item"}
            </button>
          </>
        }
      >
        <form id="item-form" onSubmit={saveItem} noValidate>
          <FormField label="Description" name="description" placeholder="e.g. Dressing charges" value={item.description} onChange={(e) => setItem({ ...item, description: e.target.value })} required />
          <div className="form-grid">
            <FormField label="Amount (₹)" name="amount" type="number" min="0" value={item.amount} onChange={(e) => setItem({ ...item, amount: e.target.value })} required />
            <FormField label="Quantity" name="quantity" type="number" min="1" value={item.quantity} onChange={(e) => setItem({ ...item, quantity: e.target.value })} />
          </div>
        </form>
      </Modal>
    </>
  );
}