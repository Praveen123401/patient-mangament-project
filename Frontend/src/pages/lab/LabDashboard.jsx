import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FlaskConical,
  ClipboardList,
  Clock,
  CheckCircle2,
  Settings2,
  PlusCircle,
  ListChecks,
  FilePlus2,
} from "lucide-react";
import "./LabDashboard.css";

const statCards = [
  { key: "totalTests", label: "Total Tests", icon: FlaskConical, tone: "blue" },
  { key: "totalOrders", label: "Total Orders", icon: ClipboardList, tone: "purple" },
  { key: "pendingOrders", label: "Pending Orders", icon: Clock, tone: "amber" },
  { key: "completedOrders", label: "Completed Orders", icon: CheckCircle2, tone: "green" },
];

const actions = [
  { to: "/lab/tests", label: "Manage Lab Tests", desc: "Edit or remove tests", icon: Settings2 },
  { to: "/lab/tests/new", label: "Add New Test", desc: "Blood, urine, hormone...", icon: PlusCircle },
  { to: "/lab/orders", label: "View Lab Orders", desc: "Track all orders", icon: ListChecks },
  { to: "/lab/orders/new", label: "Create Lab Order", desc: "Order tests for a patient", icon: FilePlus2 },
];

export default function LabDashboard() {
  const [stats, setStats] = useState({
    totalTests: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // TODO: replace with your existing API calls / service functions
    // e.g. labService.getStats().then(setStats);
    //      labService.getOrders().then((o) => setRecentOrders(o.slice(0, 5)));
  }, []);

  return (
    <div className="lab-page">
      <div className="lab-header">
        <div>
          <h1>Laboratory Dashboard</h1>
          <p>Manage laboratory tests, orders, samples and results.</p>
        </div>
        <Link to="/lab/orders/new" className="lab-primary-btn">
          <FilePlus2 size={18} /> New Order
        </Link>
      </div>

      <div className="lab-stats">
        {statCards.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="lab-stat">
            <div className={`lab-stat-icon ${tone}`}>
              <Icon size={22} />
            </div>
            <div>
              <span className="lab-stat-label">{label}</span>
              <strong className="lab-stat-value">{stats[key]}</strong>
            </div>
          </div>
        ))}
      </div>

      <h2 className="lab-section-title">Quick Actions</h2>
      <div className="lab-actions">
        {actions.map(({ to, label, desc, icon: Icon }) => (
          <Link key={to} to={to} className="lab-action">
            <Icon size={22} />
            <div>
              <strong>{label}</strong>
              <span>{desc}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="lab-card">
        <div className="lab-card-head">
          <h2 className="lab-section-title">Recent Orders</h2>
          <Link to="/lab/orders">View all</Link>
        </div>
        <table className="lab-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Patient</th>
              <th>Test</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan="4" className="lab-empty">No orders yet</td>
              </tr>
            ) : (
              recentOrders.map((o) => (
                <tr key={o._id}>
                  <td>#{o._id.slice(-6)}</td>
                  <td>{o.patient?.name}</td>
                  <td>{o.tests?.map((t) => t.name).join(", ")}</td>
                  <td>
                    <span className={`lab-badge ${o.status?.toLowerCase()}`}>{o.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}