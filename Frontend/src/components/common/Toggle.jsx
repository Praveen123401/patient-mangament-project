export default function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
      />
      <span className="toggle-track" aria-hidden="true" />
    </label>
  );
}
