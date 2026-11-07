import StatusBadge from "../common/StatusBadge";

export default function ResultFlagBadge({ flag }) {
  if (!flag || flag === "n/a") return <span className="muted">-</span>;
  return <StatusBadge status={flag} />;
}