import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import './LandingPage.css'; // We will replace this

const LandingPage = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  //mouse stuff
  useEffect(() => {
    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      const x = (clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const y = (clientY / window.innerHeight - 0.5) * 2; // -1 to 1
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Apply the parallax effect
  const parallaxStyle = {
    transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`,
  };


  return (
    <div className="landing-container">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div
        className="landing-hero-grid"
        style={parallaxStyle} 
      >
        <div className="hero-left">
          <img src="/gov-logo.png" alt="Emblem" className="hero-logo" />
          <h1 className="hero-title">
            Traffic Control Hub
          </h1>
          <h2 className="hero-subtitle">The City's Log-Book</h2>
          <p className="hero-slogan">
            Efficient. Transparent. Secure. Towards a Safer City!
          </p>
          <p className="hero-credit">
            A PBL Project
            <br />
            - Devanarayan C S
          </p>
        </div>

        <div className="hero-right">
          <Login setIsAuthenticated={setIsAuthenticated} />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;