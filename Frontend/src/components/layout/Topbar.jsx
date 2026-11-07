import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { useAuth } from "../../context/useAuth.js";
import ThemeSwitcher from "../../context/layout/ThemeSwitcher";
import ProfileMenu from "./ProfileMenu";

export default function Topbar({ onMenu }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/patients?search=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="topbar no-print">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>

      {user.role !== "patient" ? (
        <form className="search-box top-search" onSubmit={submit}>
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patient by name, ID or phone" />
        </form>
      ) : (
        <div />
      )}

      <div className="top-right">
        <ThemeSwitcher />
        <ProfileMenu />
      </div>
    </header>
  );
}