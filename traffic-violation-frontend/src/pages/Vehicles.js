import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Vehicles.css";

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/get-vehicles', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setVehicles(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to fetch vehicles. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [navigate]);





  const handleDelete = async (licensePlate) => {
    // Show a confirmation dialog before deleting
    if (!window.confirm(`Are you sure you want to delete vehicle ${licensePlate}? This action cannot be undone.`)) {
      return; 
    }

    try {

      const response = await fetch(`http://localhost:5000/delete-vehicle/${licensePlate}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,

        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete vehicle');
      }

      // If successful, update the UI by removing the deleted vehicle from the state
      setVehicles(prevVehicles => 
        prevVehicles.filter(vehicle => vehicle.LicensePlate !== licensePlate)
      );
      

      console.log(data.message); 

    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Failed to delete vehicle.");
    }
  };




  if (loading) {
    return <div className="vehicles-container loading-state">Loading vehicles...</div>;
  }

  if (error) {
    return (
      <div className="vehicles-container">
        <div className="error-state">
          <h2 className="vehicles-title">Registered Vehicles</h2>
          <div>{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicles-container">
      <div className="vehicles-header">
        <h2 className="vehicles-title">Registered Vehicles</h2>
      </div>
      
      <div className="vehicles-list">
        <table className="vehicles-table">
          <thead>
            <tr>
              <th>Owner</th>
              <th>License Plate</th>
              <th>Vehicle Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                  No vehicles found.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.VehicleID}>
                  <td>{v.OwnerName}</td>
                  <td>{v.LicensePlate}</td>
                  <td>{v.VehicleType}</td>
                  <td>
                    {localStorage.getItem('role') === 'admin' && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(v.LicensePlate)}
                    >
                      🗑️
                    </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Vehicles;