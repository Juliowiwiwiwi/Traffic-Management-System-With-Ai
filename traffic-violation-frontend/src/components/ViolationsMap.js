import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';
import { getAllViolations } from '../services/api';
import './ViolationsMap.css';

const warningIcon = new L.Icon({
  iconUrl: '/warning.png',
  iconSize: [64, 64],
  iconAnchor: [32, 64],
  popupAnchor: [0, -64],
});

const paidIcon = new L.Icon({
  iconUrl: '/paid.png',
  iconSize: [64, 64],
  iconAnchor: [32, 64],
  popupAnchor: [0, -64],
});

const ViolationsMap = () => {
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const fetchVios = async () => {
      try {
        const res = await getAllViolations();
        setViolations(res.data);
      } catch (e) {
        console.error("Failed to fetch violations for map", e);
      }
    };
    fetchVios();

    // Refresh every 10 seconds to show "Live" mapping
    const interval = setInterval(fetchVios, 10000);
    return () => clearInterval(interval);
  }, []);

  // Center around Jaipur / Rajasthan
  const defaultCenter = [26.9124, 75.7873];

  return (
    <div className="map-container">
      <h3 className="map-title">📍 Live Incident Map (Rajasthan)</h3>
      <MapContainer
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={false}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {violations.map(v => {
          // ensure coordinate exists and is in Rajasthan bounding box roughly
          if (v.Latitude && v.Longitude) {
            return (
              <Marker key={v.ViolationID} position={[v.Latitude, v.Longitude]} icon={v.Status === 'Paid' ? paidIcon : warningIcon}>
                <Popup>
                  <div className="map-popup">
                    <strong className="popup-plate">{v.LicensePlate}</strong><br />
                    <span className="popup-type">{v.ViolationType}</span><br />
                    <span className={`popup-status ${v.Status === 'Paid' ? 'paid' : 'unpaid'}`}>
                      Fine: ₹{v.FineAmount} ({v.Status})
                    </span><br />
                    <span className="popup-date">Date: {new Date(v.DateReported).toLocaleDateString()}</span>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default ViolationsMap;
