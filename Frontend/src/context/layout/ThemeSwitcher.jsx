import { useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import useClickOutside from "../../hooks/useClickOutside";
import { ACCENTS, useTheme } from "../../context/ThemeContext";

const MODES = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
];

export default function ThemeSwitcher() {
  const { mode, setMode, resolved, accent, setAccent, reset } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const Icon = resolved === "dark" ? Moon : Sun;

  return (
    <div className="dd" ref={ref}>
      <button
        type="button"
        className="icon-btn theme-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        title="Theme"
      >
        <Icon size={20} />
      </button>

      {open && (
        <div className="dd-menu dd-right theme-pop">
          <h4>Appearance</h4>
          <div className="theme-modes">
            {MODES.map(({ key, label, icon: ModeIcon }) => (
              <button
                key={key}
                type="button"
                className={`theme-mode ${mode === key ? "active" : ""}`}
                onClick={() => setMode(key)}
              >
                <ModeIcon size={20} />
                {label}
              </button>
            ))}
          </div>

          <h4>Accent colour</h4>
          <div className="theme-accents">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                type="button"
                title={a.label}
                aria-label={a.label}
                className={`theme-swatch ${accent.key === a.key ? "active" : ""}`}
                style={{ background: a.hex }}
                onClick={() => setAccent(a.key)}
              >
                {accent.key === a.key && <Check size={15} />}
              </button>
            ))}
          </div>
          <p className="theme-hint">
            {accent.label} · {mode === "system" ? `System (${resolved})` : mode === "dark" ? "Dark" : "Light"}
          </p>

          <button type="button" className="link-btn" onClick={reset}>
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}