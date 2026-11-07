const COLORS = {
  pending: "orange", confirmed: "blue", completed: "green", cancelled: "red",
  admitted: "blue", discharged: "gray",
  available: "green", occupied: "red", maintenance: "orange",
  unpaid: "red", partial: "orange", paid: "green",
  ordered: "gray", collected: "blue", processing: "orange",
  normal: "green", high: "red", low: "orange", critical: "red",
  routine: "gray", urgent: "red", active: "green", inactive: "gray",
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={`badge badge-${COLORS[status] || "gray"}`}>{status}</span>;
}