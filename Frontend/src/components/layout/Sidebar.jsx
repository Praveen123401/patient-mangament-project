import { NavLink } from "react-router-dom";
import { Activity, X } from "lucide-react";
import { useAuth } from "../../context/useAuth.js";
import { MENU } from "../../utils/roleMenu";
import { HOSPITAL_NAME } from "../../utils/constants";

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const items = MENU.filter((m) => m.roles.includes(user.role));

  return (
    <>
      {open && <div className="sb-backdrop no-print" onClick={onClose} />}
      <aside className={`sidebar no-print ${open ? "open" : ""}`}>
        <div className="sb-brand">
          <Activity size={22} />
          <span>{HOSPITAL_NAME}</span>
          <button className="sb-close icon-btn" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav>
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) => `sb-link ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}