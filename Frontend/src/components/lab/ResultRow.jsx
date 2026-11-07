import ResultFlagBadge from "./ResultFlagBadge";

// item = one entry of order.tests (test is populated). Shows the normal range next to the input.
export default function ResultRow({ item, value, onChange, readOnly }) {
  const { test } = item;
  const range = test.normalRange;
  return (
    <tr>
      <td>
        <strong>{test.name}</strong>
        <small className="muted"> {test.category}</small>
      </td>
      <td>
        {readOnly ? (
          <b>{item.value ?? "-"}</b>
        ) : (
          <input className="result-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="Value" />
        )}
      </td>
      <td>{test.unit || "-"}</td>
      <td className="muted">{range?.min != null || range?.max != null ? `${range.min ?? ""} - ${range.max ?? ""}` : "-"}</td>
      <td><ResultFlagBadge flag={item.flag} /></td>
    </tr>
  );
}