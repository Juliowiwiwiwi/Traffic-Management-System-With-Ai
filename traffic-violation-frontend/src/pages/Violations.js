import { useState, useEffect } from "react";
import { getViolations } from "../services/api";
import "./Violations.css";

function Violations() {
  const [licensePlate, setLicensePlate] = useState("");
  const [violations, setViolations] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchViolations = async () => {
    setError("");
    setIsLoading(true);

    if (!licensePlate.trim()) {
      setError("Please enter a license plate number");
      setIsLoading(false);
      return;
    }

    try {
      const response = await getViolations(licensePlate);
      setViolations(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "No violations found or an error occurred");
      setViolations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchViolations();
    }
  };

  return (
    <div className="violations-container">
      <div className="violations-header">
        <h2 className="section-title">Search Violations</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Enter License Plate (e.g. KA05MJ1234)"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="search-input"
          />
          <button 
            onClick={fetchViolations} 
            className="search-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              "Get Violations"
            )}
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>

      {violations.length > 0 ? (
        <div className="violations-table-container">
          <table className="violations-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Fine</th>
                <th>Status</th>
                <th>Location</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr key={v.ViolationID}>
                  <td>{v.ViolationID}</td>
                  <td>{new Date(v.DateTime).toLocaleString()}</td>
                  <td>{v.ViolationType}</td>
                  <td className={v.Status === 'Paid' ? 'paid' : 'unpaid'}>₹{v.FineAmount}</td>
                  <td>
                    <span className={`status-badge ${v.Status.toLowerCase()}`}>
                      {v.Status}
                    </span>
                  </td>
                  <td>{v.Location}</td>
                  <td>
                    {v.evidence_image ? (
                      <a href={`http://localhost:5000/evidence/${v.evidence_image}`} target="_blank" rel="noopener noreferrer">
                        View Image
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && !isLoading && (
          <div className="no-results">
            <p>No violations found for this vehicle</p>
          </div>
        )
      )}
    </div>
  );
}

export default Violations;