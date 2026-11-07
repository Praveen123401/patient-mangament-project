import { IndianRupee, Package, Pill, ShoppingCart, TimerOff } from "lucide-react";
import { getPharmacyReport } from "../../api/reportApi";
import useFetch from "../../hooks/useFetch";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import RankList from "../RankList";

export default function PharmacyTab({ from, to }) {
  const { data, loading, error } = useFetch(() => getPharmacyReport({ from, to }), [from, to]);
  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;

  const r = data.data;
  const t = r.totals;

  const lowColumns = [
    { header: "Medicine", render: (m) => <b>{m.name}</b> },
    { header: "In stock", render: (m) => <span className="med-qty low">{m.stock}</span> },
    { header: "Reorder at", key: "reorderLevel" },
  ];
  const expiryColumns = [
    { header: "Medicine", render: (m) => <b>{m.name}</b> },
    { header: "Batch", render: (m) => m.batchNo || "-" },
    { header: "Stock", key: "stock" },
    { header: "Expires", render: (m) => formatDate(m.expiryDate) },
  ];

  return (
    <>
      <p className="form-note">
        Stock figures show what is in the pharmacy right now. Sales follow the date range above.
      </p>

      <div className="stats-grid rep-stats">
        <StatCard label="Medicines" value={t.medicines} icon={Pill} color="blue" />
        <StatCard label="Units in stock" value={t.stockUnits} icon={Package} color="green" />
        <StatCard label="Stock value" value={formatCurrency(t.stockValue)} icon={IndianRupee} color="purple" />
        <StatCard label="Expired medicines" value={t.expired} icon={TimerOff} color="red" />
        <StatCard label="Sold in this period" value={formatCurrency(t.soldAmount)} icon={ShoppingCart} color="orange" sub={`${t.soldUnits} units`} />
      </div>

      <div className="rep-grid">
        <Card title="Low stock (reorder soon)">
          <DataTable columns={lowColumns} rows={r.lowStock} emptyText="No low stock medicines" />
        </Card>
        <Card title="Expiring in 30 days">
          <DataTable columns={expiryColumns} rows={r.expiring} emptyText="Nothing expiring soon" />
        </Card>
      </div>

      <Card title="Top selling medicines">
        <RankList items={r.topSold.map((m) => ({ name: m.name, value: m.amount }))} format={formatCurrency} empty="No medicines dispensed in this period" />
      </Card>
    </>
  );
}