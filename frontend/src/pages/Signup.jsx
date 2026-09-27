import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "employee" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", form);
      login(data.token, data.user);
      navigate(data.user.role === "manager" ? "/manager" : "/employee");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        <p className="muted">
          Sign up as an employee to apply for leave, or as a manager to review requests
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <label>Full name</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <label>Email</label>
        <input
          type="email"
          required
          pattern="^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$"
          title="Please provide a valid email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <label>Password</label>
        <input
          type="password"
          required
          minLength={6}
          maxLength={100}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <label>Role</label>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
        </select>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
        <p className="muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
