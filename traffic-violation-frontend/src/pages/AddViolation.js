import { useState, useEffect } from "react";
import { addViolation, getVehicles } from "../services/api";
import { useNavigate } from "react-router-dom";
import './AddViolation.css';

function AddViolation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    LicensePlate: "",
    ViolationType: "Speeding",
    FineAmount: "",
    Location: ""
  });
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoading(true);
        const response = await getVehicles();
        setVehicles(response.data);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError("Failed to load vehicles");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await addViolation(formData);
      setSuccess("Violation recorded successfully!");
      setTimeout(() => {
        navigate("/violations");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add violation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="violation-container">
      <h2 className="violation-title">Add New Violation</h2>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="violation-form">
        <div className="form-group">
          <label>License Plate</label>
          <select
            name="LicensePlate"
            value={formData.LicensePlate}
            onChange={handleChange}
            required
            disabled={isLoading}
          >
            <option value="">Select a vehicle</option>
            {vehicles.map(vehicle => (
              <option key={vehicle.VehicleID} value={vehicle.LicensePlate}>
                {vehicle.LicensePlate} - {vehicle.OwnerName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Violation Type</label>
          <select
            name="ViolationType"
            value={formData.ViolationType}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="Speeding">Speeding</option>
            <option value="Red Light Violation">Red Light Violation</option>
            <option value="Illegal Parking">Illegal Parking</option>
            <option value="Driving Without License">Driving Without License</option>
            <option value="Drunk Driving">Drunk Driving</option>
            <option value="No Helmet">No Helmet</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Fine Amount (₹)</label>
          <input
            type="number"
            name="FineAmount"
            value={formData.FineAmount}
            onChange={handleChange}
            min="100"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="Location"
            value={formData.Location}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          className={`violation-button ${isLoading ? 'disabled' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? "Recording..." : "Record Violation"}
        </button>
      </form>
    </div>
  );
}

export default AddViolation;