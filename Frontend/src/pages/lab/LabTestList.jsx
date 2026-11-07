
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLabTests, deleteLabTest } from "../../api/labApi";

const getList = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
};

export default function LabTestList() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTests = async () => {
    try {
      setLoading(true);
      const result = await getLabTests({ search });
      setTests(getList(result));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load tests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this laboratory test?")) return;

    try {
      await deleteLabTest(id);
      await loadTests();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to deactivate test.");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Laboratory Tests</h1>

      <div style={{ display: "flex", gap: 12, margin: "20px 0" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tests..."
          style={{ padding: 10, flex: 1, maxWidth: 400 }}
        />

        <button onClick={() => navigate("/lab/tests/new")}>
          + Add Test
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Loading tests...</p>
      ) : tests.length === 0 ? (
        <p>No laboratory tests found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table width="100%" cellPadding="12" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td>{test.name}</td>
                  <td>{test.category}</td>
                  <td>₹{test.price}</td>
                  <td>{test.unit || "-"}</td>
                  <td>
                    <button onClick={() => navigate(`/lab/tests/${test._id}/edit`)}>
                      Edit
                    </button>{" "}
                    <button onClick={() => handleDelete(test._id)}>
                      Deactivate
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
