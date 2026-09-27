import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function ManagerDashboard() {
  const [pending, setPending] = useState([]);
  const [all, setAll] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadData = async () => {
    try {
      const [pendingRes, allRes] = await Promise.all([
        api.get("/leave/pending"),
        api.get("/leave/all"),
      ]);
      setPending(pendingRes.data);
      setAll(allRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const act = async (id, action) => {
    setError("");
    setBusyId(id);
    try {
      await api.patch(`/leave/${id}/${action}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="page">
        <div className="card">
          <h2>Pending Requests</h2>
          {error && <div className="alert alert-error">{error}</div>}
          {pending.length === 0 && <p className="muted">No pending requests. 🎉</p>}
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Working Days</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => (
                <tr key={r._id}>
                  <td>{r.employee?.name}</td>
                  <td>{r.leaveType}</td>
                  <td>{new Date(r.startDate).toLocaleDateString()}</td>
                  <td>{new Date(r.endDate).toLocaleDateString()}</td>
                  <td>{r.workingDays}</td>
                  <td>{r.reason}</td>
                  <td className="actions">
                    <button
                      className="btn btn-approve"
                      disabled={busyId === r._id}
                      onClick={() => act(r._id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-reject"
                      disabled={busyId === r._id}
                      onClick={() => act(r._id, "reject")}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>All Requests (History)</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {all.map((r) => (
                <tr key={r._id}>
                  <td>{r.employee?.name}</td>
                  <td>{r.leaveType}</td>
                  <td>{new Date(r.startDate).toLocaleDateString()}</td>
                  <td>{new Date(r.endDate).toLocaleDateString()}</td>
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
