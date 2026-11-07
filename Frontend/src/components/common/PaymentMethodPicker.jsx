import { METHOD_GROUPS, PAYMENT_METHODS, methodInfo } from "../../utils/paymentMethods";

// <PaymentMethodPicker value={method} onChange={setMethod} />
export default function PaymentMethodPicker({ value, onChange }) {
  return (
    <div>
      {METHOD_GROUPS.map((group) => (
        <div key={group}>
          <h4 className="pm-group-title">{group}</h4>
          <div className="pm-grid">
            {PAYMENT_METHODS.filter((m) => m.group === group).map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.value}
                  type="button"
                  className={`pm-tile ${value === m.value ? "active" : ""}`}
                  onClick={() => onChange(m.value)}
                >
                  <span className="pm-ico" style={{ color: m.color, background: m.bg }}>
                    {Icon ? <Icon size={18} /> : m.badge}
                  </span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// small coloured label for tables: <MethodBadge method="gpay" />
export function MethodBadge({ method }) {
  const m = methodInfo(method);
  return (
    <span className="pm-badge" style={{ color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}