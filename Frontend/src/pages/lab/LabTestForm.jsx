
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createLabTest,
  getLabTests,
  updateLabTest,
} from "../../api/labApi";

const categories = [
  { value: "blood", label: "Blood" },
  { value: "blood_sugar", label: "Blood Sugar" },
  { value: "kidney", label: "Kidney" },
  { value: "liver", label: "Liver" },
  { value: "thyroid", label: "Thyroid" },
  { value: "urine", label: "Urine" },
  { value: "lipid", label: "Lipid Profile" },
  { value: "other", label: "Other" },
];

const initialForm = {
  name: "",
  category: "blood",
  price: "",
  unit: "",
  normalMin: "",
  normalMax: "",
  criticalLow: "",
  criticalHigh: "",
  sampleType: "",
  fastingRequired: false,
};

const getList = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
};

export default function LabTestForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;

    const loadTest = async () => {
      try {
        const result = await getLabTests();
        const test = getList(result).find((item) => item._id === id);

        if (!test) {
          setError("Test not found.");
          return;
        }

        setForm({
          name: test.name || "",
          category: test.category || "blood",
          price: test.price ?? "",
          unit: test.unit || "",
          normalMin: test.normalRange?.min ?? "",
          normalMax: test.normalRange?.max ?? "",
          criticalLow: test.criticalLow ?? "",
          criticalHigh: test.criticalHigh ?? "",
          sampleType: test.sampleType || "",
          fastingRequired: Boolean(test.fastingRequired),
        });
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load test.");
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [id, editing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Number(form.price) < 0 || form.price === "") {
      setError("Please enter a valid test price.");
      return;
    }

    const body = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      unit: form.unit.trim(),
      normalRange: {
        min: form.normalMin === "" ? undefined : Number(form.normalMin),
        max: form.normalMax === "" ? undefined : Number(form.normalMax),
      },
      criticalLow:
        form.criticalLow === "" ? undefined : Number(form.criticalLow),
      criticalHigh:
        form.criticalHigh === "" ? undefined : Number(form.criticalHigh),
      sampleType: form.sampleType.trim(),
      fastingRequired: form.fastingRequired,
    };

    try {
      setSaving(true);

      if (editing) {
        await updateLabTest(id, body);
      } else {
        await createLabTest(body);
      }

      navigate("/lab/tests");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save test.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ padding: 24 }}>Loading test...</p>;
  }

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: 10,
    marginTop: 6,
    marginBottom: 16,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    boxSizing: "border-box",
  };

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1>{editing ? "Edit Laboratory Test" : "Add Laboratory Test"}</h1>

      <p>Enter the laboratory test information below.</p>

      {error && (
        <p style={{ color: "red", background: "#fee2e2", padding: 10 }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <label>Test Name *</label>
        <input
          style={inputStyle}
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. CBC, Hemoglobin, FBS"
          required
        />

        <label>Test Category *</label>
        <select
          style={inputStyle}
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        <label>Test Price (₹) *</label>
        <input
          style={inputStyle}
          type="number"
          min="0"
          step="0.01"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="Enter test price"
          required
        />

        <label>Measurement Unit</label>
        <input
          style={inputStyle}
          name="unit"
          value={form.unit}
          onChange={handleChange}
          placeholder="e.g. mg/dL, g/dL, cells/mcL"
        />

        <h3>Normal Reference Range</h3>

        <label>Minimum Value</label>
        <input
          style={inputStyle}
          type="number"
          step="any"
          name="normalMin"
          value={form.normalMin}
          onChange={handleChange}
        />

        <label>Maximum Value</label>
        <input
          style={inputStyle}
          type="number"
          step="any"
          name="normalMax"
          value={form.normalMax}
          onChange={handleChange}
        />

        <h3>Critical Values</h3>

        <label>Critical Low</label>
        <input
          style={inputStyle}
          type="number"
          step="any"
          name="criticalLow"
          value={form.criticalLow}
          onChange={handleChange}
        />

        <label>Critical High</label>
        <input
          style={inputStyle}
          type="number"
          step="any"
          name="criticalHigh"
          value={form.criticalHigh}
          onChange={handleChange}
        />

        <label>Sample Type</label>
        <input
          style={inputStyle}
          name="sampleType"
          value={form.sampleType}
          onChange={handleChange}
          placeholder="e.g. Blood, Urine, Serum"
        />

        <label style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            type="checkbox"
            name="fastingRequired"
            checked={form.fastingRequired}
            onChange={handleChange}
          />
          Fasting required
        </label>

        <button type="submit" disabled={saving}>
          {saving
            ? "Saving..."
            : editing
              ? "Update Test"
              : "Create Test"}
        </button>{" "}

        <button
          type="button"
          onClick={() => navigate("/lab/tests")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
