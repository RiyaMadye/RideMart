import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FaShieldAlt, FaExclamationTriangle, FaDownload, FaSearch } from 'react-icons/fa';
import './ActivityMonitor.css';

function ActivityMonitor() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Real-time subscription to logs
    const q = query(
      collection(db, 'activity_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLogs(logData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error.message);
      setLoading(false);
      setError("Permission denied. You may not have access to view logs.");
    });

    return () => unsubscribe();
  }, []);

  const exportLogs = () => {
    const headers = ['Timestamp', 'Type', 'Action', 'User Email', 'Details', 'Severity'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.timestamp?.toDate().toISOString() || '',
        log.type,
        log.action,
        log.userEmail,
        `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
        log.severity || 'normal'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `system_logs_${new Date().toISOString()}.csv`;
    link.click();
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return '#ef4444'; // Red
      case 'medium': return '#f59e0b'; // Amber
      default: return '#10b981'; // Green
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.type === filter;
    const matchesSearch = 
      (log.userEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.action?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (log.id || '').includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  if (error) {
    return (
      <div className="monitor-page" style={{padding: '2rem', textAlign: 'center'}}>
        <FaExclamationTriangle style={{fontSize: '3rem', color: '#ef4444', marginBottom: '1rem'}} />
        <h2>Access Denied</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="monitor-page animate-fade-in">
      <div className="container">
        <div className="monitor-header">
          <div>
            <h1><FaShieldAlt /> System Activity Monitor</h1>
            <p>Real-time tracking of user actions, security events, and system logs.</p>
          </div>
          <button className="btn btn-secondary" onClick={exportLogs}>
            <FaDownload /> Export Logs
          </button>
        </div>

        <div className="controls-bar">
          <div className="filter-tabs">
            <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Activity</button>
            <button className={`tab ${filter === 'auth' ? 'active' : ''}`} onClick={() => setFilter('auth')}>Login/Auth</button>
            <button className={`tab ${filter === 'listing' ? 'active' : ''}`} onClick={() => setFilter('listing')}>Listings</button>
            <button className={`tab ${filter === 'booking' ? 'active' : ''}`} onClick={() => setFilter('booking')}>Bookings</button>
            <button className={`tab ${filter === 'security' ? 'active' : ''}`} onClick={() => setFilter('security')}>Security</button>
          </div>
          
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by user or action ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner"></div><p>Connecting to system stream...</p></div>
        ) : (
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan="5" className="no-logs">No logs found matching criteria</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} style={{borderLeft: `4px solid ${getSeverityColor(log.severity)}`}}>
                      <td className="log-time">
                        {log.timestamp && typeof log.timestamp.toDate === 'function' ? log.timestamp.toDate().toLocaleString() : 'Pending...'}
                      </td>
                      <td>
                        <span className={`badge badge-${log.type}`}>{log.type?.toUpperCase()}</span>
                      </td>
                      <td className="log-user">
                        {log.userEmail || 'Anonymous'}
                        {log.userId && <span className="id-tooltip">{log.userId}</span>}
                      </td>
                      <td className="log-action">{log.action}</td>
                      <td className="log-details">
                        {log.severity === 'high' && <FaExclamationTriangle className="alert-icon" />}
                        {Object.entries(log.details || {}).map(([k, v]) => (
                          <span key={k} className="detail-pill">{k}: {v}</span>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityMonitor;