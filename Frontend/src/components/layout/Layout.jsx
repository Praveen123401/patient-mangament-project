import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNav from "./MobileNav";
import Footer from "./Footer";
import ErrorBoundary from "../common/ErrorBoundary";
import "./Layout.css";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="app-main">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="app-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
      <MobileNav />
    </div>
  );
}