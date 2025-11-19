import { useState } from "react";
import { registerVehicle } from "../services/api";
import { useNavigate } from "react-router-dom";
import './RegisterVehicle.css';

function RegisterVehicle() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    OwnerName: "",
    LicensePlate: "",
    VehicleType: "Car",
    Contact: "",
    Address: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
      await registerVehicle(formData);
      setSuccess("Vehicle registered successfully!");
      setTimeout(() => {
        navigate("/vehicles"); // Redirect to vehicles page after 2 seconds
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register vehicle");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Register New Vehicle</h2>
      
      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label>Owner Name</label>
          <input
            type="text"
            name="OwnerName"
            value={formData.OwnerName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>License Plate</label>
          <input
            type="text"
            name="LicensePlate"
            value={formData.LicensePlate}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Vehicle Type</label>
          <select
            name="VehicleType"
            value={formData.VehicleType}
            onChange={handleChange}
          >
            <option value="Car">Car</option>
            <option value="Motorcycle">Motorcycle</option>
            <option value="Truck">Truck</option>
            <option value="Bus">Bus</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Contact Number</label>
          <input
            type="tel"
            name="Contact"
            value={formData.Contact}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Address</label>
          <textarea
            name="Address"
            value={formData.Address}
            onChange={handleChange}
            rows="3"
            required
          />
        </div>
        
        <button
          type="submit"
          className={`register-button ${isLoading ? 'disabled' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register Vehicle"}
        </button>
      </form>
    </div>
  );
}

export default RegisterVehicle;