import React, { useState, useEffect } from 'react';
import './Dashboard.css'; 
import { useNavigate } from 'react-router-dom';
import { 
    FaCar, 
    FaExclamationTriangle, 
    FaChartBar, 
    FaCheckCircle, 
    FaMoneyBillWave 
} from 'react-icons/fa';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import ViolationsMap from '../components/ViolationsMap';

const COLORS = ['#f4a400', '#f06a11', '#2a64a3', '#dc3545', '#28a745', '#9c27b0'];

const Dashboard = () => {
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

                const response = await fetch('http://localhost:5000/dashboard-stats', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard stats');
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
        return <div className="vehicles-container loading-state">Loading Dashboard...</div>;
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
                <h2 className="vehicles-title">System Dashboard</h2> 
            </div>

            <div className="stat-grid">
                <div className="stat-box">
                    <div className="stat-icon vehicle">
                        <FaCar />
                    </div>
                    <div className="stat-info">
                        <h3>Total Vehicles</h3>
                        <p>{stats.total_vehicles}</p>
                    </div>
                </div>
                <div className="stat-box">
                    <div className="stat-icon violation">
                        <FaExclamationTriangle />
                    </div>
                    <div className="stat-info">
                        <h3>Total Violations</h3>
                        <p>{stats.total_violations}</p>
                    </div>
                </div>
                <div className="stat-box">
                    <div className="stat-icon top-violation">
                        <FaChartBar />
                    </div>
                    <div className="stat-info">
                        <h3>Most Common Violation</h3>
                        <p>{stats.top_violation}</p>
                    </div>
                </div>
                <div className="stat-box">
                    <div className="stat-icon revenue">
                        <FaCheckCircle />
                    </div>
                    <div className="stat-info">
                        <h3>Total Revenue</h3>
                        <p className="revenue">₹{stats.total_paid.toFixed(2)}</p>
                    </div>
                </div>
                <div className="stat-box">
                    <div className="stat-icon outstanding">
                        <FaMoneyBillWave />
                    </div>
                    <div className="stat-info">
                        <h3>Outstanding Fines</h3>
                        <p className="outstanding">₹{stats.total_unpaid.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            {stats.recent_activity && stats.violation_breakdown && (
                <div className="charts-grid">
                    <div className="chart-box">
                        <h3>Incident Activity (Last 7 Days)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.recent_activity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Line type="monotone" dataKey="incidents" stroke="#f4a400" strokeWidth={3} dot={{ fill: '#f4a400', r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-box">
                        <h3>Violation Breakdown</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                  data={stats.violation_breakdown} 
                                  cx="50%" cy="50%" 
                                  innerRadius={60} outerRadius={100} 
                                  paddingAngle={5} dataKey="value"
                                >
                                    {stats.violation_breakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Legend wrapperStyle={{ color: '#94a3b8' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <ViolationsMap />

        </div>
    );
};

export default Dashboard;