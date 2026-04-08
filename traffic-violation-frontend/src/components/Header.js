import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css'; // We will replace this file next

const Header = ({ isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <header className="main-header">
      <div className="nav-container">
        {/* Left Side: Logo */}
        <div className="nav-logo">
          <img src="/gov-logo.png" alt="Logo" />
          <span>Traffic Hub</span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="nav-menu">
          {localStorage.getItem('role') === 'admin' && <Link to="/dashboard">Dashboard</Link>}
          {localStorage.getItem('role') === 'admin' && <Link to="/vehicles">Vehicles</Link>}
          <Link to="/violations">Violations</Link>
          <Link to="/payments">Payments</Link>
          {localStorage.getItem('role') === 'admin' && <Link to="/register-vehicle">Register Vehicle</Link>}
          {localStorage.getItem('role') === 'admin' && <Link to="/add-violation">Add Violation</Link>}
          {localStorage.getItem('role') === 'admin' && <Link to="/autodetect">Auto Detect</Link>}
          <Link to="/profile">My Profile</Link>
          {localStorage.getItem('role') === 'admin' && (
            <>
              <Link to="/simulation"> 3D Sim</Link>
              <Link to="/cctv-sim"> CCTV Sim</Link>
            </>
          )}
        </nav>

        {/* Right Side: Logout Button */}
        <div className="nav-actions">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;