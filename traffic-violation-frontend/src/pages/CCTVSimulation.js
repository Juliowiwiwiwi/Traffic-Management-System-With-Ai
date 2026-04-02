import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlay, FaStop } from 'react-icons/fa';
import './CCTVSimulation.css';

const CCTVSimulation = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const videoRef = useRef(null);

  const logMessage = (msg) => {
    setLogs(prev => {
      const newLogs = [...prev, msg];
      if (newLogs.length > 8) newLogs.shift();
      return newLogs;
    });
  };

  useEffect(() => {
    let timeoutId;
    
    if (isAnalyzing) {
      logMessage("🔍 SYSTEM: Traffic analysis started...");
      
      const triggerDetection = () => {
        if (!isAnalyzing || !videoRef.current) return;

        const video = videoRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            // video not loaded yet
            timeoutId = setTimeout(triggerDetection, 2000);
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          
          const formData = new FormData();
          formData.append('image_file', blob, 'cctv_frame.jpg');

          try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/autodetect', formData, {
              headers: { 
                 'Content-Type': 'multipart/form-data',
                 'Authorization': `Bearer ${token}`
              }
            });

            if (res.status === 201) {
               // Real Violation found!
               setFlashing(true);
               setTimeout(() => setFlashing(false), 200);
               logMessage(`📸 AI DETECTED: [${res.data.violation_type}] Plate: ${res.data.license_plate}`);
            } else {
               // No violation or unreadable
               logMessage(`👁️ Scan result: ${res.data.message}`);
            }
          } catch (err) {
             console.error(err);
             logMessage(`❌ Scanning error: Backend AI disconnected.`);
          }

          // Loop next detection
          if (isAnalyzing) {
             const nextDelay = 5000; // scan every 5 seconds
             timeoutId = setTimeout(triggerDetection, nextDelay);
          }
        }, 'image/jpeg', 0.8);
      };

      // wait 2 seconds before first trigger
      timeoutId = setTimeout(triggerDetection, 2000); 
    } else {
      logMessage("🛑 SYSTEM: Analysis stopped. Standby.");
    }

    return () => clearTimeout(timeoutId);
  }, [isAnalyzing]);

  return (
    <div className="cctv-container page-content">
      <div className="cctv-header">
        <h2>🎥 Live CCTV Analytics</h2>
        <p>Real-time AI intersection monitoring. Press "Analyse" to activate YOLO bounding-box detection.</p>
      </div>
      
      <div className="cctv-layout">
        <div className="cctv-video-wrapper">
          {flashing && <div className="camera-flash"></div>}
          <div className="video-container">
            <video 
              ref={videoRef}
              src="/bike_1.mp4" 
              autoPlay 
              loop 
              muted 
              className="cctv-video"
            />
            <div className="cctv-overlay">
              <span className="live-badge">● REC <span className="timestamp">{new Date().toLocaleTimeString()}</span></span>
            </div>
          </div>
        </div>

        <div className="cctv-sidebar shadow-box">
          <h3>Control Panel</h3>
          <div className="cctv-actions">
            {!isAnalyzing ? (
              <button className="btn-analyse" onClick={() => setIsAnalyzing(true)}>
                <FaPlay style={{marginRight: '8px'}}/> Analyse Traffic Violations
              </button>
            ) : (
              <button className="btn-stop" onClick={() => setIsAnalyzing(false)}>
                <FaStop style={{marginRight: '8px'}}/> Stop Analysing
              </button>
            )}
          </div>

          <div className="cctv-logs">
            <h4>Live Command Feed</h4>
            <div className="cctv-log-box">
              {logs.map((l, i) => (
                <div key={i} className="cctv-log-entry">{l}</div>
              ))}
              {logs.length === 0 && <div className="text-muted" style={{padding:'10px'}}>System idle. Please click analyse to connect to CCTV...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCTVSimulation;
