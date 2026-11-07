
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLabOrders } from "../../api/labApi";

const getList = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
};

export default function LabOrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const params = status ? { status } : {};
        const result = await getLabOrders(params);
        setOrders(getList(result));
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load lab orders.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [status]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Laboratory Orders</h1>

      <div style={{ display: "flex", gap: 12, margin: "20px 0" }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: 10 }}
        >
          <option value="">All Orders</option>
          <option value="ordered">Ordered</option>
          <option value="collected">Collected</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button onClick={() => navigate("/lab/orders/new")}>
          + Create Order
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No laboratory orders found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table width="100%" cellPadding="12" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                <th>Order No.</th>
                <th>Patient</th>
                <th>Tests</th>
                <th>Priority</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td>{order.orderNo || "-"}</td>
                  <td>
                    {order.patient?.fullName ||
                      order.patient?.name ||
                      order.patient?.patientId ||
                      "Patient"}
                  </td>
                  <td>
                    {order.tests?.map((item) => item.test?.name || "Test").join(", ")}
                  </td>
                  <td>{order.priority || "routine"}</td>
                  <td>₹{order.totalAmount ?? 0}</td>
                  <td>{order.status}</td>
                  <td>
                    <button onClick={() => navigate(`/lab/orders/${order._id}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
