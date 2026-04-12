import React, { useState, useEffect, useRef } from 'react';
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

  // Handle Video Swapping and Loading
  useEffect(() => {
    if (videoRef.current) {
      // Force the browser to fetch the new video file immediately
      videoRef.current.load();

      // Set playback speed
      videoRef.current.playbackRate = isAnalyzing ? 0.08 : 1.0;

      // Attempt to play the new video
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Autoplay prevented or video format not supported by browser:", error);
        });
      }
    }
  }, [isAnalyzing]);

  // Handle Mock Logs and Timers
  useEffect(() => {
    if (isAnalyzing) {
      logMessage("🔍 SYSTEM: Traffic analysis started... Processing feed.");
    } else {
      logMessage("🛑 SYSTEM: Analysis stopped. Standby.");
    }
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
              // Toggling the key forces React to completely destroy and rebuild the video element
              key={isAnalyzing ? "analyzing-video" : "idle-video"}
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              className="cctv-video"
            >
              {/* Using <source> tags is much more reliable for React video swapping */}
              <source src={isAnalyzing ? "/helmet_output.mp4" : "/bike_1.mp4"} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
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
                <FaPlay style={{ marginRight: '8px' }} /> Analyse Traffic Violations
              </button>
            ) : (
              <button className="btn-stop" onClick={() => setIsAnalyzing(false)}>
                <FaStop style={{ marginRight: '8px' }} /> Stop Analysing
              </button>
            )}
          </div>

          <div className="cctv-logs">
            <h4>Live Command Feed</h4>
            <div className="cctv-log-box">
              {logs.map((l, i) => (
                <div key={i} className="cctv-log-entry">{l}</div>
              ))}
              {logs.length === 0 && <div className="text-muted" style={{ padding: '10px' }}>System idle. Please click analyse to connect to CCTV...</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCTVSimulation;