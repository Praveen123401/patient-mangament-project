import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { MENU } from "../../utils/roleMenu";

// bottom bar on phones: first 4 items for the role
export default function MobileNav() {
  const { user } = useAuth();
  const items = MENU.filter((m) => m.roles.includes(user.role)).slice(0, 4);
  return (
    <nav className="mobile-nav no-print">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `mn-link ${isActive ? "active" : ""}`}>
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}