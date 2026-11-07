import { formatCurrency } from "../../utils/formatCurrency";

// tests = list from getLabTests(); selected = array of test ids; onChange(newIds)
export default function TestSelector({ tests = [], selected = [], onChange }) {
  const groups = tests.reduce((acc, t) => {
    (acc[t.category] ||= []).push(t);
    return acc;
  }, {});

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const total = tests.filter((t) => selected.includes(t._id)).reduce((s, t) => s + t.price, 0);

  return (
    <div>
      {Object.entries(groups).map(([cat, list]) => (
        <div key={cat} className="ts-group">
          <h4 className="ts-cat">{cat}</h4>
          <div className="ts-grid">
            {list.map((t) => (
              <label key={t._id} className={`ts-item ${selected.includes(t._id) ? "on" : ""}`}>
                <input type="checkbox" checked={selected.includes(t._id)} onChange={() => toggle(t._id)} />
                <span>
                  {t.name}
                  {t.fastingRequired && <small className="muted"> (fasting)</small>}
                </span>
                <b>{formatCurrency(t.price)}</b>
              </label>
            ))}
          </div>
        </div>
      ))}
      <p className="ts-total">
        {selected.length} selected · Total <b>{formatCurrency(total)}</b>
      </p>
    </div>
  );
}