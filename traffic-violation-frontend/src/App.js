  import { useState } from 'react';
  import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
  import Vehicles from './pages/Vehicles';
  import Violations from './pages/Violations';
  import Payments from './pages/Payments';
  import Header from './components/Header';
  import RegisterVehicle from './pages/RegisterVehicle';
  import AddViolation from './pages/AddViolation';
  import AutoDetect from './pages/AutoDetect';
  import Dashboard from './pages/Dashboard';
  import LandingPage from './pages/LandingPage';
  import MyProfile from './pages/MyProfile';
  import Simulation3D from './pages/Simulation3D';
  import './App.css';

  function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
      return Boolean(localStorage.getItem('token'));
    });

    const getUserRole = () => localStorage.getItem('role') || 'user';
    const getDefaultRoute = () => getUserRole() === 'admin' ? "/dashboard" : "/profile";

    // Strict Admin check wrapper
    const AdminRoute = ({ children }) => {
      if (!isAuthenticated) return <Navigate to="/login" replace />;
      if (getUserRole() !== 'admin') return <Navigate to="/profile" replace />;
      return children;
    };
    
    // Looser Private Route wrapper
    const PrivateRoute = ({ children }) => {
      if (!isAuthenticated) return <Navigate to="/login" replace />;
      return children;
    };

    return (
      <Router>
        {/* Conditionally render header: Not on landing page */}
        {isAuthenticated && <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />}

        <div className={isAuthenticated ? "main-content" : "landing-main"}>
          <Routes>
            <Route path="/" element={
              !isAuthenticated ? <LandingPage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to={getDefaultRoute()} />
            } />
            <Route path="/login" element={
              !isAuthenticated ? <LandingPage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to={getDefaultRoute()} />
            } />
            
            {/* Admin-only Routes */}
            <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/vehicles" element={<AdminRoute><Vehicles /></AdminRoute>} />
            <Route path="/register-vehicle" element={<AdminRoute><RegisterVehicle /></AdminRoute>} />
            <Route path="/add-violation" element={<AdminRoute><AddViolation /></AdminRoute>} />
            <Route path="/autodetect" element={<AdminRoute><AutoDetect /></AdminRoute>} />
            <Route path="/simulation" element={<AdminRoute><Simulation3D /></AdminRoute>} />

            {/* Standard Authenticated Routes */}
            <Route path="/profile" element={<PrivateRoute><MyProfile /></PrivateRoute>} />
            <Route path="/violations" element={<PrivateRoute><Violations /></PrivateRoute>} />
            <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
            
            {/* Catch-all unknown routes */}
            <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
          </Routes>
        </div>
      </Router>
    );
  }

  export default App;