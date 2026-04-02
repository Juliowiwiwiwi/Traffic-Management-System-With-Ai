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
  import CCTVSimulation from './pages/CCTVSimulation';
  import AnimatedPage from './components/AnimatedPage';
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
            <Route path="/dashboard" element={<AdminRoute><AnimatedPage><Dashboard /></AnimatedPage></AdminRoute>} />
            <Route path="/vehicles" element={<AdminRoute><AnimatedPage><Vehicles /></AnimatedPage></AdminRoute>} />
            <Route path="/register-vehicle" element={<AdminRoute><AnimatedPage><RegisterVehicle /></AnimatedPage></AdminRoute>} />
            <Route path="/add-violation" element={<AdminRoute><AnimatedPage><AddViolation /></AnimatedPage></AdminRoute>} />
            <Route path="/autodetect" element={<AdminRoute><AnimatedPage><AutoDetect /></AnimatedPage></AdminRoute>} />
            <Route path="/simulation" element={<AdminRoute><AnimatedPage><Simulation3D /></AnimatedPage></AdminRoute>} />
            <Route path="/cctv-sim" element={<AdminRoute><AnimatedPage><CCTVSimulation /></AnimatedPage></AdminRoute>} />

            {/* Standard Authenticated Routes */}
            <Route path="/profile" element={<PrivateRoute><AnimatedPage><MyProfile /></AnimatedPage></PrivateRoute>} />
            <Route path="/violations" element={<PrivateRoute><AnimatedPage><Violations /></AnimatedPage></PrivateRoute>} />
            <Route path="/payments" element={<PrivateRoute><AnimatedPage><Payments /></AnimatedPage></PrivateRoute>} />
            
            {/* Catch-all unknown routes */}
            <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
          </Routes>
        </div>
      </Router>
    );
  }

  export default App;