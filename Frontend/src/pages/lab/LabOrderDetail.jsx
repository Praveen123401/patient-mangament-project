
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getLabOrder,
  collectSample,
  enterResults,
  verifyLabOrder,
  cancelLabOrder,
} from "../../api/labApi";

export default function LabOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadOrder = async () => {
    try {
      const response = await getLabOrder(id);
      const data = response?.data || response;
      setOrder(data);

      const initialResults = {};
      (data.tests || []).forEach((item) => {
        const testId = item.test?._id || item.test;
        initialResults[testId] = {
          value: item.value || "",
          remarks: item.remarks || "",
        };
      });

      setResults(initialResults);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load lab order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const updateResult = (testId, field, value) => {
    setResults((previous) => ({
      ...previous,
      [testId]: {
        ...previous[testId],
        [field]: value,
      },
    }));
  };

  const performAction = async (action) => {
    try {
      setSaving(true);
      setError("");
      await action();
      await loadOrder();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResults = async () => {
    const resultList = Object.entries(results).map(([test, data]) => ({
      test,
      value: data.value,
      remarks: data.remarks,
    }));

    if (resultList.some((item) => !String(item.value).trim())) {
      setError("Enter a result for every test before saving.");
      return;
    }

    await performAction(() => enterResults(id, resultList));
  };

  if (loading) return <p style={{ padding: 24 }}>Loading lab order...</p>;

  if (!order) {
    return (
      <div style={{ padding: 24 }}>
        <p>{error || "Lab order not found."}</p>
        <button onClick={() => navigate("/lab/orders")}>Back to Orders</button>
      </div>
    );
  }

  const patientName =
    order.patient?.fullName ||
    order.patient?.name ||
    order.patient?.patientId ||
    "Patient";

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate("/lab/orders")}>← Back to Orders</button>

      <h1>Laboratory Order Details</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 18, margin: "20px 0" }}>
        <p><strong>Order Number:</strong> {order.orderNo}</p>
        <p><strong>Patient:</strong> {patientName}</p>
        <p><strong>Priority:</strong> {order.priority}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Total:</strong> ₹{order.totalAmount ?? 0}</p>
        <p><strong>Created:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</p>
      </div>

      <h2>Tests and Results</h2>

      <div style={{ display: "grid", gap: 14 }}>
        {(order.tests || []).map((item) => {
          const test = item.test || {};
          const testId = test._id || item.test;
          const current = results[testId] || { value: "", remarks: "" };

          return (
            <div key={testId} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
              <h3>{test.name || "Laboratory Test"}</h3>
              <p>Category: {test.category || "-"}</p>
              <p>Normal range: {test.normalRange?.min ?? "-"} to {test.normalRange?.max ?? "-"} {test.unit || ""}</p>

              <label>Result</label>
              <input
                value={current.value}
                disabled={!["collected", "processing"].includes(order.status)}
                onChange={(e) => updateResult(testId, "value", e.target.value)}
                placeholder="Enter result"
                style={{ display: "block", padding: 10, width: "100%", maxWidth: 400, margin: "6px 0 12px" }}
              />

              <label>Remarks</label>
              <input
                value={current.remarks}
                disabled={!["collected", "processing"].includes(order.status)}
                onChange={(e) => updateResult(testId, "remarks", e.target.value)}
                placeholder="Optional remarks"
                style={{ display: "block", padding: 10, width: "100%", maxWidth: 400, marginTop: 6 }}
              />

              {item.flag && <p>Result flag: <strong>{item.flag}</strong></p>}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
        {order.status === "ordered" && (
          <button disabled={saving} onClick={() => performAction(() => collectSample(id))}>
            Collect Sample
          </button>
        )}

        {["collected", "processing"].includes(order.status) && (
          <button disabled={saving} onClick={handleSaveResults}>
            Save Results
          </button>
        )}

        {order.status === "processing" && (
          <button
            disabled={saving}
            onClick={() => {
              if (window.confirm("Verify and complete this lab order?")) {
                performAction(() => verifyLabOrder(id));
              }
            }}
          >
            Verify & Complete
          </button>
        )}

        {!["processing", "completed", "cancelled"].includes(order.status) && (
          <button
            disabled={saving}
            onClick={() => {
              if (window.confirm("Cancel this laboratory order?")) {
                performAction(() => cancelLabOrder(id));
              }
            }}
          >
            Cancel Order
          </button>
        )}
      </div> 
      {order.status === "completed" && (
  <button
    onClick={() => navigate(`/lab/orders/${id}/report`)}
  >
    View / Download Lab Report
  </button>
)}

      {saving && <p>Processing...</p>}
    </div>
  );
}
