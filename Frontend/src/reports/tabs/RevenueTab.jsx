import { FileText, IndianRupee, Receipt, Wallet } from "lucide-react";
import { getRevenueReport } from "../../api/reportApi";
import useFetch from "../../hooks/useFetch";
import { formatCurrency } from "../../utils/formatCurrency";
import { methodInfo } from "../../utils/paymentMethods";
import StatCard from "../../components/common/StatCard";
import Card from "../../components/common/Card";
import DataTable from "../../components/common/DataTable";
import Loader from "../../components/common/Loader";
import ExportButton from "../../components/common/ExportButton";
import LineChartCard from "../../components/charts/LineChartCard";
import DonutChartCard from "../../components/charts/DonutChartCard";
import { shortDay } from "../reportUtils";

export default function RevenueTab({ from, to }) {
  const { data, loading, error } = useFetch(() => getRevenueReport({ from, to }), [from, to]);
  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;

  const r = data.data;
  const t = r.totals;
  const daily = r.daily.map((d) => ({ ...d, day: shortDay(d.date) }));
  const methods = r.byMethod.map((m) => ({
    name: methodInfo(m.method).label,
    value: m.amount,
    color: methodInfo(m.method).color,
    count: m.count,
  }));

  const methodColumns = [
    { header: "Method", render: (m) => <b style={{ color: m.color }}>{m.name}</b> },
    { header: "Payments", key: "count" },
    { header: "Amount", render: (m) => formatCurrency(m.value) },
    { header: "Share", render: (m) => (t.collected ? `${Math.round((m.value / t.collected) * 100)}%` : "-") },
  ];

  return (
    <>
      <div className="stats-grid rep-stats">
        <StatCard label="Collected in this period" value={formatCurrency(t.collected)} icon={IndianRupee} color="green" />
        <StatCard label="Billed in this period" value={formatCurrency(t.billed)} icon={Receipt} color="blue" sub={`${t.billsCreated} bills created`} />
        <StatCard label="Outstanding (all unpaid bills)" value={formatCurrency(t.outstanding)} icon={Wallet} color="red" sub={`${t.outstandingBills} bills`} />
        <StatCard label="Average per bill" value={formatCurrency(t.billsCreated ? t.billed / t.billsCreated : 0)} icon={FileText} color="purple" />
      </div>

      <div className="page-actions rep-actions">
        <ExportButton
          rows={daily}
          filename={`revenue-${from}-to-${to}.csv`}
          columns={[
            { label: "Date", key: "date" },
            { label: "Collected (INR)", key: "amount" },
          ]}
        />
      </div>

      <LineChartCard
        title="Money collected per day"
        data={daily}
        xKey="day"
        lines={[{ key: "amount", name: "Collected (₹)", color: "#2563eb" }]}
      />

      <div style={{ height: 16 }} />

      <div className="rep-grid">
        <DonutChartCard
          title="Revenue by service"
          data={r.byCategory.filter((c) => c.amount > 0).map((c) => ({ name: c.name, value: c.amount }))}
        />
        <DonutChartCard title="Payments by method" data={methods.filter((m) => m.value > 0)} />
      </div>

      <Card title="Payment methods in detail">
        <DataTable columns={methodColumns} rows={methods} emptyText="No payments in this period" />
      </Card>
    </>
  );
}