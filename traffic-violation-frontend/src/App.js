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
  import './App.css';

  function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
      return Boolean(localStorage.getItem('token'));
    });

    return (
      <Router>
        {/* Conditionally render header: Not on landing page */}
        {isAuthenticated && <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />}

        <div className={isAuthenticated ? "main-content" : "landing-main"}>
          <Routes>
            <Route path="/" element={
              !isAuthenticated ? <LandingPage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />
            } />
            <Route path="/login" element={
              !isAuthenticated ? <LandingPage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />
            } />
            <Route path="/dashboard" element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
            } />
            <Route path="/profile" element={
              isAuthenticated ? <MyProfile /> : <Navigate to="/login" />
            } />
            <Route path="/vehicles" element={
              isAuthenticated ? <Vehicles /> : <Navigate to="/login" />
            } />
            <Route path="/violations" element={
              isAuthenticated ? <Violations /> : <Navigate to="/login" />
            } />
            <Route path="/payments" element={
              isAuthenticated ? <Payments /> : <Navigate to="/login" />
            } />
            <Route path="/register-vehicle" element={
              isAuthenticated ? <RegisterVehicle /> : <Navigate to="/login" />
            } />
            <Route path="/add-violation" element={
              isAuthenticated ? <AddViolation /> : <Navigate to="/login" />
            } />
            <Route path="/autodetect" element={
              isAuthenticated ? <AutoDetect /> : <Navigate to="/login" />
            } />
          </Routes>
        </div>
      </Router>
    );
  }

  export default App;