import React, { useState, useEffect } from 'react';
import '../pages/Dashboard.css'; 
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaReceipt, FaCar } from 'react-icons/fa';

const MyProfile = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('http://localhost:5000/my-profile-stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch profile stats');
                }

                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    if (isLoading) {
        return <div className="vehicles-container loading-state">Loading Profile...</div>;
    }

    if (error) {
        return <div className="vehicles-container error-state">{error}</div>;
    }

    if (!stats) {
        return null;
    }

    return (
        <div className="vehicles-container"> 
            <div className="vehicles-header"> 
                <h2 className="vehicles-title">My Profile</h2> 
            </div>

            <div className="stat-grid">
                {/* Stat Box for Username */}
                <div className="stat-box">
                    <div className="stat-icon vehicle"> 
                        <FaUserCircle />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.username}</h3>
                        <p style={{ fontSize: '2rem', textTransform: 'capitalize' }}>{stats.role}</p>
                    </div>
                </div>
                {/* Stat Box for Violations */}
                <div className="stat-box">
                    <div className="stat-icon violation"> 
                        <FaReceipt />
                    </div>
                    <div className="stat-info">
                        <h3>Violations Reported</h3>
                        <p>{stats.violations_reported}</p>
                    </div>
                </div>
                <div className="stat-box">
                    <div className="stat-icon top-violation"> 
                        <FaCar />
                    </div>
                    <div className="stat-info">
                        <h3>Vehicles Registered</h3>
                        <p>{stats.vehicles_registered}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;