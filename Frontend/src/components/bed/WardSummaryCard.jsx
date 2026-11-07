import { formatCurrency } from "../../utils/formatCurrency";

// ward comes from GET /api/wards (includes ward.beds counts)
export default function WardSummaryCard({ ward, onClick }) {
  const { total = 0, occupied = 0, available = 0, maintenance = 0 } = ward.beds || {};
  const pct = total ? Math.round((occupied / total) * 100) : 0;
  return (
    <div className="card ward-card clickable" onClick={() => onClick?.(ward)}>
      <div className="card-body">
        <div className="ward-top">
          <h4>{ward.name}</h4>
          <span className="badge badge-blue">{ward.type}</span>
        </div>
        <p className="muted">
          {ward.department?.name || "No department"} · Floor {ward.floor ?? "-"} · {formatCurrency(ward.chargePerDay)}/day
        </p>
        <div className="progress"><div style={{ width: `${pct}%` }} /></div>
        <div className="ward-counts">
          <span>{occupied} occupied</span>
          <span>{available} free</span>
          {maintenance > 0 && <span>{maintenance} maintenance</span>}
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );
}