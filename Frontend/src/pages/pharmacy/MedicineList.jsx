import { useMemo, useState } from "react";
import { AlertTriangle, Package, Pencil, Pill, Plus, Search, Trash2 } from "lucide-react";
import Modal from "../../components/common/Modal";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const EMPTY_FORM = {
  name: "",
  category: "",
  manufacturer: "",
  batchNumber: "",
  quantity: "",
  price: "",
  expiryDate: "",
};

const CATEGORIES = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Other"];
const LOW_STOCK = 10; // this many units or fewer counts as low stock

const toDate = (d) => new Date(`${d}T00:00:00`);
const showDate = (d) =>
  d ? toDate(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

// whole days from today until the expiry date (negative = already expired)
const daysLeft = (d) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((toDate(d) - today) / 86400000);
};

function Expiry({ date }) {
  if (!date) return "-";
  const n = daysLeft(date);
  return (
    <div>
      {showDate(date)}
      {n < 0 && <span className="badge badge-red med-exp">Expired</span>}
      {n >= 0 && n <= 30 && (
        <span className="badge badge-orange med-exp">{n === 0 ? "Expires today" : `${n} days left`}</span>
      )}
    </div>
  );
}

export default function MedicineList() {
  useDocumentTitle("Pharmacy");

  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filteredMedicines = useMemo(() => {
    const q = search.toLowerCase();
    return medicines.filter((m) =>
      [m.name, m.category, m.manufacturer, m.batchNumber].join(" ").toLowerCase().includes(q)
    );
  }, [medicines, search]);

  const lowStock = medicines.filter((m) => Number(m.quantity) <= LOW_STOCK).length;
  const totalUnits = medicines.reduce((total, m) => total + Number(m.quantity || 0), 0);

  const updateField = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setMedicines((prev) => prev.map((m) => (m.id === editingId ? { ...form, id: editingId } : m)));
    } else {
      setMedicines((prev) => [...prev, { ...form, id: Date.now() }]);
    }
    closeForm();
  };

  const handleEdit = (medicine) => {
    setForm({
      name: medicine.name,
      category: medicine.category,
      manufacturer: medicine.manufacturer,
      batchNumber: medicine.batchNumber,
      quantity: medicine.quantity,
      price: medicine.price,
      expiryDate: medicine.expiryDate,
    });
    setEditingId(medicine.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <>
      {/* header */}
      <div className="page-header">
        <div>
          <h1>Medicine management</h1>
          <p className="muted">Manage medicines, inventory, stock and expiry dates.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> Add medicine
          </button>
        </div>
      </div>

      {/* summary cards */}
      <div className="stats-grid">
        <div className="stat">
          <div className="stat-icon blue"><Pill size={24} /></div>
          <div>
            <p className="stat-label">Total medicines</p>
            <h2 className="stat-value">{medicines.length}</h2>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon green"><Package size={24} /></div>
          <div>
            <p className="stat-label">Total stock units</p>
            <h2 className="stat-value">{totalUnits}</h2>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon orange"><AlertTriangle size={24} /></div>
          <div>
            <p className="stat-label">Low stock medicines</p>
            <h2 className="stat-value">{lowStock}</h2>
          </div>
        </div>
      </div>

      {/* search */}
      <div className="search-box med-search">
        <Search size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicine by name, category, manufacturer or batch number..."
        />
      </div>

      {/* inventory table */}
      <div className="card">
        <div className="card-head">
          <h3>Medicine inventory</h3>
          <span className="med-count">{filteredMedicines.length} items</span>
        </div>

        <div className="table-wrap med-table">
          <table className="table">
            <thead>
              <tr>
                <th>Medicine name</th>
                <th>Category</th>
                <th>Manufacturer</th>
                <th>Batch number</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Expiry date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map((m) => {
                const low = Number(m.quantity) <= LOW_STOCK;
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="med-name">
                        <span className="med-ico"><Pill size={16} /></span>
                        {m.name}
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{m.category}</span></td>
                    <td>{m.manufacturer || "-"}</td>
                    <td>{m.batchNumber}</td>
                    <td>
                      <span className={`med-qty ${low ? "low" : "ok"}`}>{m.quantity}</span>
                      {low && <span className="badge badge-red med-exp">Low</span>}
                    </td>
                    <td>₹{Number(m.price).toFixed(2)}</td>
                    <td><Expiry date={m.expiryDate} /></td>
                    <td>
                      <div className="med-actions">
                        <button className="med-icon-btn edit" onClick={() => handleEdit(m)} title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button className="med-icon-btn delete" onClick={() => handleDelete(m.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMedicines.length === 0 && (
                <tr>
                  <td colSpan="8">
                    <div className="empty">
                      <Pill size={38} />
                      <h4>No medicines found</h4>
                      <p>Click “Add medicine” to add your first medicine.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* add and edit form */}
      <Modal
        open={showForm}
        title={editingId ? "Edit medicine" : "Add new medicine"}
        size="md"
        onClose={closeForm}
        footer={
          <>
            <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
            <button type="submit" form="medicine-form" className="btn btn-primary">
              {editingId ? "Update medicine" : "Save medicine"}
            </button>
          </>
        }
      >
        <form id="medicine-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label>Medicine name <span className="error">*</span></label>
              <input name="name" value={form.name} onChange={updateField} placeholder="e.g. Paracetamol 500mg" required />
            </div>

            <div className="field">
              <label>Category <span className="error">*</span></label>
              <select name="category" value={form.category} onChange={updateField} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Manufacturer</label>
              <input name="manufacturer" value={form.manufacturer} onChange={updateField} placeholder="Manufacturer name" />
            </div>

            <div className="field">
              <label>Batch number <span className="error">*</span></label>
              <input name="batchNumber" value={form.batchNumber} onChange={updateField} placeholder="Enter batch number" required />
            </div>

            <div className="field">
              <label>Quantity <span className="error">*</span></label>
              <input type="number" min="0" name="quantity" value={form.quantity} onChange={updateField} placeholder="Enter quantity" required />
            </div>

            <div className="field">
              <label>Price (₹) <span className="error">*</span></label>
              <input type="number" min="0" step="0.01" name="price" value={form.price} onChange={updateField} placeholder="Enter price" required />
            </div>

            <div className="field med-span">
              <label>Expiry date <span className="error">*</span></label>
              <input
                type="date"
                name="expiryDate"
                value={form.expiryDate}
                onChange={updateField}
                min={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}