import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// Tab bar shared by Wards, Bed map and Departments
export default function WardTabs() {
  const { hasRole } = useAuth();
  const tabs = [
    { to: "/wards", label: "Wards", end: true },
    { to: "/wards/beds", label: "Bed map" },
    ...(hasRole("admin") ? [{ to: "/departments", label: "Departments" }] : []),
  ];
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tab ${isActive ? "active" : ""}`}>
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}