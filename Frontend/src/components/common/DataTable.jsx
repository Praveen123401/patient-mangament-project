import Loader from "./Loader";
import EmptyState from "./EmptyState";

/*
 <DataTable
   columns={[{ header: "Name", key: "name" }, { header: "Doctor", render: (r) => r.doctor.user.name }]}
   rows={data} loading={loading} onRowClick={(r) => navigate(...)} />
*/
export default function DataTable({ columns, rows = [], loading, emptyText = "No records found", onRowClick, rowKey = "_id" }) {
  if (loading) return <Loader />;
  if (!rows.length) return <EmptyState title={emptyText} />;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header} style={{ width: c.width }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[rowKey] || i} className={onRowClick ? "clickable" : ""} onClick={() => onRowClick?.(r)}>
              {columns.map((c) => (
                <td key={c.header}>{c.render ? c.render(r) : r[c.key] ?? "-"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}