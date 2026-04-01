import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { FaUserShield, FaLock, FaEnvelope, FaExclamationTriangle, FaDatabase, FaShieldAlt, FaKey } from 'react-icons/fa';
import './Auth.css';

function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'password') {
      if (/\s/.test(value)) {
        setPasswordError('Password cannot contain spaces');
        value = value.replace(/\s/g, '');
      } else {
        setPasswordError('');
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePaste = (e) => {
    const name = e.target.name;
    if (name === 'password') {
      const pasteData = e.clipboardData.getData('text');
      if (/\s/.test(pasteData)) {
        setPasswordError('Pasted password contained spaces which were removed');
      }
    }
  };

  const handleSpaceKey = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      setPasswordError('Password cannot contain spaces');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // For final implementation, logic would check for custom claims
      // For now, we use a simple admin identifier check
      if (formData.email === 'ridemart@admin.com') {
        navigate('/admin');
      } else {
        setError('Access denied. Administrative privileges required.');
      }
    } catch (err) {
      setError('Invalid admin credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
      </div>

      <div className="auth-container">
        {/* ── Left Panel ── */}
        <div className="auth-panel auth-left">
          <Link to="/" className="auth-logo">
            <img src="/logo-brand.png" alt="RideMart Logo" style={{height: '40px', borderRadius: '4px'}} />
          </Link>
          <div className="panel-content">
            <div className="car-icon-big">
              <FaUserShield />
            </div>
            <h2>Admin Command</h2>
            <p>Access the secure management portal to oversee marketplace operations and data integrity.</p>
            <div className="auth-stats">
              <div className="stat"><span className="stat-num"><FaDatabase /></span><span className="stat-label">Marketplace</span></div>
              <div className="stat"><span className="stat-num"><FaShieldAlt /></span><span className="stat-label">Secure</span></div>
              <div className="stat"><span className="stat-num"><FaKey /></span><span className="stat-label">Portal</span></div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="auth-panel auth-right">
          <div className="auth-form-wrapper">
            <div className="auth-header">
              <h1>Admin Access</h1>
              <p>Authorize your session to continue</p>
            </div>

            {error && <div className="auth-error"><FaExclamationTriangle /> {error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field-group">
                <label htmlFor="email">Administrative Email</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FaEnvelope /></span>
                  <input
                    type="email" id="email" name="email"
                    placeholder="ridemart@admin.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                {passwordError && (
                  <div className="password-error-text">
                    <FaExclamationTriangle size={12} /> {passwordError}
                  </div>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="password">Security Password</label>
                <div className={`input-wrapper ${passwordError ? 'error-border' : ''}`}>
                  <span className="input-icon"><FaLock /></span>
                  <input
                    type="password" id="password" name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    onKeyDown={handleSpaceKey}
                    onPaste={handlePaste}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={`auth-submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Authorize Access'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
