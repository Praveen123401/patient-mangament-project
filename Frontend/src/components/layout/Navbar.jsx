import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Menu, Search } from "lucide-react";
import { useAuth } from "../../context/useAuth.js";
import { HOSPITAL_NAME } from "../../utils/constants";
import ProfileMenu from "./ProfileMenu";
import "./Navbar.css";

export default function Navbar({ onMenu }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/patients?search=${encodeURIComponent(q.trim())}`);
      setQ("");
    }
  };

  const isPatient = user?.role === "patient";

  return (
    <header className="navbar no-print">
      {/* left: menu button (mobile) + brand */}
      <div className="nav-left">
        <button className="icon-btn nav-menu-btn" onClick={onMenu} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <Link to="/" className="nav-brand">
          <Activity size={20} />
          <span>{HOSPITAL_NAME}</span>
        </Link>
      </div>

      {/* middle: patient search (staff only) */}
      {!isPatient && (
        <form className="search-box nav-search" onSubmit={submit}>
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patient by name, ID or phone"
          />
        </form>
      )}

      {/* right: bell + profile */}
      <div className="nav-right">
        <ProfileMenu />
      </div>
    </header>
  );
}