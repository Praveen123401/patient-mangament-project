import { PRESETS, iso } from "./reportUtils";

export default function ReportRange({ value, onChange }) {
  const today = iso(new Date());
  const active = PRESETS.find((p) => {
    const r = p.get();
    return r.from === value.from && r.to === value.to;
  })?.key;

  const setFrom = (e) => {
    const from = e.target.value;
    if (from) onChange({ from, to: value.to < from ? from : value.to });
  };
  const setTo = (e) => {
    const to = e.target.value;
    if (to) onChange({ from: value.from > to ? to : value.from, to });
  };

  return (
    <div className="range-bar">
      <div className="range-presets">
        {PRESETS.map((p) => (
          <button key={p.key} type="button" className={`range-chip ${active === p.key ? "active" : ""}`} onClick={() => onChange(p.get())}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="range-dates">
        <label>
          From
          <input type="date" value={value.from} max={today} onChange={setFrom} />
        </label>
        <label>
          To
          <input type="date" value={value.to} max={today} onChange={setTo} />
        </label>
      </div>
    </div>
  );
}