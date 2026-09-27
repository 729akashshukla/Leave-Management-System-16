import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const emptyForm = { leaveType: "Casual", startDate: "", endDate: "", reason: "" };

export default function EmployeeDashboard() {
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [balRes, reqRes] = await Promise.all([
        api.get("/leave/balance"),
        api.get("/leave/my-requests"),
      ]);
      setBalance(balRes.data.leaveBalance);
      setRequests(reqRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/leave/apply", form);
      setSuccess("Leave request submitted successfully.");
      setForm(emptyForm);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="page">
        <div className="grid">
          <div className="card">
            <h2>Apply for Leave</h2>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit}>
              <label>Leave Type</label>
              <select
                value={form.leaveType}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
              >
                <option value="Casual">Casual</option>
                <option value="Sick">Sick</option>
              </select>
              <label>Start Date</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <label>End Date</label>
              <input
                type="date"
                required
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              <label>Reason</label>
              <textarea
                required
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Leave Balance</h2>
            {balance && (
              <div className="balance-grid">
                <div className="balance-item">
                  <span className="balance-num">{balance.Casual}</span>
                  <span className="muted">Casual days left</span>
                </div>
                <div className="balance-item">
                  <span className="balance-num">{balance.Sick}</span>
                  <span className="muted">Sick days left</span>
                </div>
              </div>
            )}
            <p className="muted small">
              Weekends inside a date range don't count against your balance.
            </p>
          </div>
        </div>

        <div className="card">
          <h2>My Requests</h2>
          {requests.length === 0 && <p className="muted">No requests yet.</p>}
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Working Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.leaveType}</td>
                  <td>{new Date(r.startDate).toLocaleDateString()}</td>
                  <td>{new Date(r.endDate).toLocaleDateString()}</td>
                  <td>{r.workingDays}</td>
                  <td>{r.reason}</td>
                  <td>
                    <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
