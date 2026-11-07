
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLabOrder } from "../../api/labApi";

export default function LabReportView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const LabReportView = page("lab/LabReportView");
  useEffect(() => {
    const loadReport = async () => {
      try {
        const response = await getLabOrder(id);
        const data = response?.data || response;

        setOrder(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load laboratory report."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <p style={{ padding: 30 }}>Loading laboratory report...</p>;
  }

  if (error || !order) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Report unavailable</h2>
        <p>{error || "Laboratory order not found."}</p>
        <button onClick={() => navigate("/lab/orders")}>
          Back to Orders
        </button>
      </div>
    );
  }

  const patient = order.patient || {};
  const tests = order.tests || [];

  const patientName =
    patient.fullName ||
    patient.name ||
    [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
    "Not available";

  const calculateAge = () => {
    if (patient.age != null) return patient.age;
    if (!patient.dateOfBirth) return "Not available";

    const dob = new Date(patient.dateOfBirth);
    if (Number.isNaN(dob.getTime())) return "Not available";

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();

    if (
      today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() &&
        today.getDate() < dob.getDate())
    ) {
      age--;
    }

    return age;
  };

  const dateFormat = (date) =>
    date ? new Date(date).toLocaleString() : "Not available";

  const formatRange = (test) => {
    const min = test?.normalRange?.min;
    const max = test?.normalRange?.max;

    if (min == null && max == null) return "Not specified";
    if (min == null) return `Up to ${max}`;
    if (max == null) return `From ${min}`;

    return `${min} - ${max}`;
  };

  const isVerified = order.status === "completed";

  return (
    <>
      <style>{`
        .lab-report {
          max-width: 900px;
          margin: 25px auto;
          padding: 35px;
          background: white;
          color: #222;
          font-family: Arial, sans-serif;
          border: 1px solid #ddd;
        }

        .report-header {
          text-align: center;
          border-bottom: 2px solid #222;
          padding-bottom: 18px;
        }

        .report-header h1 {
          margin-bottom: 5px;
          font-size: 26px;
        }

        .report-section {
          margin-top: 25px;
        }

        .report-section h3 {
          background: #f0f2f5;
          padding: 10px;
          font-size: 16px;
        }

        .report-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }

        .report-table th,
        .report-table td {
          border: 1px solid #ccc;
          padding: 11px;
          text-align: left;
          font-size: 13px;
        }

        .report-table th {
          background: #f0f2f5;
        }

        .report-footer {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .report-actions {
          max-width: 900px;
          margin: 20px auto;
          display: flex;
          gap: 12px;
        }

        .report-actions button {
          padding: 11px 18px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          background: #2563eb;
          color: white;
        }

        .critical {
          color: #b91c1c;
          font-weight: bold;
        }

        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .lab-report {
            max-width: none;
            margin: 0;
            padding: 0;
            border: none;
          }

          .report-section {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="report-actions no-print">
        <button onClick={() => navigate(`/lab/orders/${id}`)}>
          Back to Order
        </button>

        <button onClick={handlePrint}>
          Print / Download PDF
        </button>
      </div>

      <div className="lab-report">
        <header className="report-header">
          <h1>HOSPITAL LABORATORY</h1>
          <p>Laboratory Investigation Report</p>
          <h3>DIAGNOSTIC TEST REPORT</h3>
        </header>

        <section className="report-section">
          <h3>Patient Information</h3>

          <div className="report-grid">
            <p><strong>Patient Name:</strong> {patientName}</p>
            <p><strong>Patient ID:</strong> {patient.patientId || patient._id || "-"}</p>
            <p><strong>Age:</strong> {calculateAge()}</p>
            <p><strong>Gender:</strong> {patient.gender || "-"}</p>
            <p><strong>Order Number:</strong> {order.orderNo || "-"}</p>
            <p><strong>Priority:</strong> {order.priority || "-"}</p>
            <p><strong>Order Date:</strong> {dateFormat(order.createdAt)}</p>
            <p><strong>Sample Collected:</strong> {dateFormat(order.sampleCollectedAt)}</p>
          </div>
        </section>

        <section className="report-section">
          <h3>Laboratory Test Results</h3>

          <table className="report-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference Range</th>
                <th>Flag</th>
              </tr>
            </thead>

            <tbody>
              {tests.map((item, index) => {
                const test = item.test || {};

                return (
                  <tr key={item._id || index}>
                    <td>{test.name || "Laboratory Test"}</td>
                    <td>{item.value ?? "Not entered"}</td>
                    <td>{item.unit || test.unit || "-"}</td>
                    <td>{formatRange(test)}</td>
                    <td className={item.flag === "critical" ? "critical" : ""}>
                      {item.flag || "Not assessed"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="report-section">
          <h3>Report Status</h3>
          <p>
            <strong>Status:</strong>{" "}
            {isVerified ? "Verified" : "Not Verified"}
          </p>

          {isVerified ? (
            <>
              <p><strong>Verified Date:</strong> {dateFormat(order.completedAt)}</p>
              <p><strong>Verified By:</strong> {order.verifiedBy?.name || order.verifiedBy?.fullName || (typeof order.verifiedBy === "object" ? "Authorized laboratory staff" : order.verifiedBy || "Not available")}</p>
            </>
          ) : (
            <p className="critical">
              This is a preliminary report. It is not a verified final medical report.
            </p>
          )}
        </section>

        <footer className="report-footer">
          <div>
            <p>________________________</p>
            <strong>Laboratory Technician</strong>
          </div>

          <div>
            <p>________________________</p>
            <strong>Authorized Verifier</strong>
          </div>
        </footer>

        <p style={{
          textAlign: "center",
          marginTop: 40,
          fontSize: 11,
          color: "#666",
        }}>
          Computer-generated laboratory report. Clinical interpretation
          should be made by an authorized healthcare professional.
        </p>
      </div>
    </>
  );
}
