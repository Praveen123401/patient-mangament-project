import { useRef, useState } from "react";
import useClickOutside from "../../hooks/useClickOutside.js";

export default function Dropdown({ items, trigger }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="dd" ref={ref}>
      <span onClick={() => setOpen((current) => !current)}>{trigger}</span>
      {open && (
        <div className="dd-menu dd-right">
          {items.map(({ label, icon, onClick, danger }) => (
            <button
              key={label}
              type="button"
              className={`dd-item ${danger ? "danger" : ""}`}
              onClick={() => {
                setOpen(false);
                onClick();
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
