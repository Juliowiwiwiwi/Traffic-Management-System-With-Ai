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
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/vehicles">Vehicles</Link>
          <Link to="/violations">Violations</Link>
          <Link to="/payments">Payments</Link>
          <Link to="/register-vehicle">Register Vehicle</Link>
          <Link to="/add-violation">Add Violation</Link>
          <Link to="/autodetect">Auto Detect</Link>
          <Link to="/profile">My Profile</Link>
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