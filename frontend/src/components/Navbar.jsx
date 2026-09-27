import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <span className="navbar-brand">🗓️ Leave Manager</span>
      {user && (
        <div className="navbar-user">
          <span>
            {user.name} <em>({user.role})</em>
          </span>
          <button onClick={handleLogout} className="btn btn-ghost">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
