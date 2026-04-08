import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import axios from 'axios';
import './Simulation3D.css';

const Car = ({ speed }) => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {

      meshRef.current.position.z -= (speed * delta * 0.05);

      // loop it back continuously
      if (meshRef.current.position.z < -20) {
        meshRef.current.position.z = 20;
      }
    }
  });

  return (
    <group ref={meshRef} position={[0, 0.5, 20]}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial color={speed > 90 ? "crimson" : "#2196f3"} />
      </mesh>
      {/* Wheels */}
      <mesh position={[-1.1, -0.5, 1.2]}><cylinderGeometry args={[0.4, 0.4, 0.5]} rotation={[0, 0, Math.PI / 2]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[1.1, -0.5, 1.2]}><cylinderGeometry args={[0.4, 0.4, 0.5]} rotation={[0, 0, Math.PI / 2]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[-1.1, -0.5, -1.2]}><cylinderGeometry args={[0.4, 0.4, 0.5]} rotation={[0, 0, Math.PI / 2]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[1.1, -0.5, -1.2]}><cylinderGeometry args={[0.4, 0.4, 0.5]} rotation={[0, 0, Math.PI / 2]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
  );
};

// Road and Environment
const Scene = ({ speed }) => {
  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={0.5} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} />

      <Car speed={speed} />

      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 200]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#2d4c1e" />
      </mesh>
    </>
  );
};

const Simulation3D = () => {
  const [speed, setSpeed] = useState(60);
  const [flashing, setFlashing] = useState(false);
  const [logs, setLogs] = useState([]);

  const [licensePlate, setLicensePlate] = useState("RJ2026B");

  const handleSpeedChange = (e) => {
    setSpeed(Number(e.target.value));
  };

  const logMessage = (msg) => {
    setLogs(prev => {
      const newLogs = [...prev, msg];
      if (newLogs.length > 5) newLogs.shift();
      return newLogs;
    });
  };

  // We only want to report once so like wai before doin again
  const [canReport, setCanReport] = useState(true);

  useEffect(() => {
    const reportViolation = async (currentSpeed) => {
      setFlashing(true);
      setTimeout(() => setFlashing(false), 200); // flash effect

      try {
        const response = await axios.post('http://localhost:5000/iot/report-speeding', {
          LicensePlate: licensePlate,
          Speed: currentSpeed,
          IsSimulation: true
        }, {
          headers: {
            'X-API-Key': 'my-secret-iot-key'
          }
        });
        console.log('Violation reported:', response.data);
        logMessage(`📸 FLASH! ${currentSpeed} km/h recorded. Status: 201 Created`);
      } catch (err) {
        console.error('Failed to report:', err);
        logMessage(`📸 FLASH! ${currentSpeed} km/h. Error posting to server.`);
      }
    };

    if (speed > 90 && canReport) {
      reportViolation(speed);
      setCanReport(false);
      // Cooldown of 5 seconds before capturing again
      setTimeout(() => setCanReport(true), 5000);
    }
  }, [speed, canReport]);


  return (
    <div className="simulation-container page-content">
      <div className="sim-header">
        <h2>3D IoT Radar Simulator</h2>
        <p>Interactive environment: Adjust vehicle speed to simulate speeding violations. The local API triggers automatically when exceeding 90 km/h.</p>
      </div>

      <div className="sim-layout shadow-box">
        {/* Left side: Controls */}
        <div className="sim-controls">
          <h3>Radar Control Panel</h3>
          <div className="speedometer-display">
            <span className={speed > 90 ? 'speed-danger' : 'speed-safe'}>
              {speed} <small>km/h</small>
            </span>
          </div>

          <div className="plate-input-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <label htmlFor="sim-plate"><strong>Target License Plate:</strong></label>
            <input
              id="sim-plate"
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1.1rem' }}
            />
          </div>

          <div className="slider-wrapper">
            <input
              type="range"
              min="0"
              max="160"
              value={speed}
              onChange={handleSpeedChange}
              className={`speed-slider ${speed > 90 ? 'slider-danger' : ''}`}
            />
          </div>

          <div className="sim-logs">
            <h4>Live IoT Output</h4>
            <div className="log-box">
              {logs.length === 0 && <span className="text-muted">Waiting for events...</span>}
              {logs.map((L, i) => <div key={i} className="log-entry">{L}</div>)}
            </div>
          </div>
        </div>

        {/* Right side: 3D Canvas */}
        <div className="sim-canvas-wrapper">
          {flashing && <div className="camera-flash"></div>}
          <Canvas camera={{ position: [-5, 4, 15], fov: 50 }}>
            <Scene speed={speed} />
          </Canvas>
          <div className="canvas-overlay">
            Status: {speed > 90 ? 'VIOLATION DETECTED' : 'MONITORING...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation3D;
