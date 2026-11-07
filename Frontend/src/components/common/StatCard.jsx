// <StatCard label="Patients" value={120} icon={Users} color="blue" sub="+4 today" />
export default function StatCard({ label, value, icon: Icon, color = "blue", sub }) {
  return (
    <div className="stat">
      <div className={`stat-icon ${color}`}>{Icon && <Icon size={22} />}</div>
      <div>
        <p className="stat-label">{label}</p>
        <h2 className="stat-value">{value ?? "-"}</h2>
        {sub && <small className="muted">{sub}</small>}
      </div>
    </div>
  );
}