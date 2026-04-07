import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { FaEnvelope, FaExclamationTriangle, FaCheckCircle, FaArrowLeft, FaKey, FaLock, FaEye, FaEyeSlash, FaPaperPlane } from 'react-icons/fa';
import '../Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMethod, setResetMethod] = useState('email'); // 'email' or 'manual'
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSpaceKey = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      setPasswordError('Password cannot contain spaces');
    }
  };

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData('text');
    if (/\s/.test(pasteData)) {
      setPasswordError('Pasted password contained spaces which were removed');
    }
  };

  const handleEmailReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset link sent! Please check your email inbox and spam folder.');
      setEmail('');
    } catch (err) {
      console.error('Email reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError('Failed to send reset email. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // 1. Check if user exists in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No account found with this email.');
        setLoading(false);
        return;
      }

      // 2. Log the manual reset request for the backend (Cloud Function / Admin)
      await addDoc(collection(db, 'password_reset_requests'), {
        email: email,
        newPassword: newPassword,
        status: 'pending',
        requestedAt: serverTimestamp(),
        type: 'manual_reset'
      });

      // 3. Log activity
      await addDoc(collection(db, 'activity_logs'), {
        type: 'auth',
        action: 'manual_password_reset_request',
        severity: 'high',
        userEmail: email,
        timestamp: serverTimestamp(),
        details: { method: 'manual_form' }
      });

      setMessage('Your password reset request has been submitted. An administrator will review and update your password shortly.');

      // Clear form
      setEmail('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err) {
      console.error('Reset error:', err);
      setError(`Error: ${err.message || 'Failed to process request'}`);
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
        <div className="road-lines">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="road-line" style={{ '--delay': `${i * 0.4}s` }}></div>
          ))}
        </div>
      </div>

      <div className="auth-container">
        {/* ── Left Panel ── */}
        <div className="auth-panel auth-left">
          <Link to="/" className="auth-logo">
            <span className="logo-ride">Ride</span><span className="logo-mart">Mart</span>
          </Link>
          <div className="panel-content">
            <div className="car-icon-big">
              <FaKey />
            </div>
            <h2>Password Reset</h2>
            <p>Choose your preferred way to regain access to your account.</p>
            <div className="reset-options-checklist">
              <div className="check-item"><FaCheckCircle /> Instant via Email</div>
              <div className="check-item"><FaCheckCircle /> Manual Admin Review</div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="auth-panel auth-right">
          <div className="auth-form-wrapper">
            <div className="auth-header">
              <h1>Reset Password</h1>
              <p>Get back into your account</p>
            </div>

            <div className="method-selector">
              <button
                className={`method-btn ${resetMethod === 'email' ? 'active' : ''}`}
                onClick={() => { setResetMethod('email'); setError(''); setMessage(''); }}
              >
                <FaEnvelope /> Email Link
              </button>
              <button
                className={`method-btn ${resetMethod === 'manual' ? 'active' : ''}`}
                onClick={() => { setResetMethod('manual'); setError(''); setMessage(''); }}
              >
                <FaLock /> Manual Form
              </button>
            </div>

            {error && <div className="auth-error"><FaExclamationTriangle /> {error}</div>}
            {message && <div className="auth-success"><FaCheckCircle /> {message}</div>}

            {resetMethod === 'email' ? (
              <form onSubmit={handleEmailReset} className="auth-form">
                <div className="field-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><FaEnvelope /></span>
                    <input
                      type="email" id="email" name="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? <span className="spinner"></span> : <><FaPaperPlane /> Send Reset Link</>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleManualReset} className="auth-form">
                <div className="field-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><FaEnvelope /></span>
                    <input
                      type="email" id="email" name="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className={`input-wrapper ${passwordError ? 'error-border' : ''}`}>
                  <span className="input-icon"><FaLock /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/\s/.test(val)) {
                        setPasswordError('Password cannot contain spaces');
                        setNewPassword(val.replace(/\s/g, ''));
                      } else {
                        setPasswordError('');
                        setNewPassword(val);
                      }
                    }}
                    onKeyDown={handleSpaceKey}
                    onPaste={handlePaste}
                    required
                  />
                  <button type="button" className="toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {passwordError && (
                  <div className="password-error-text">
                    <FaExclamationTriangle size={12} /> {passwordError}
                  </div>
                )}

                <div className="field-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className={`input-wrapper ${passwordError ? 'error-border' : ''}`}>
                    <span className="input-icon"><FaLock /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/\s/.test(val)) {
                          setPasswordError('Password cannot contain spaces');
                          setConfirmPassword(val.replace(/\s/g, ''));
                        } else {
                          setPasswordError('');
                          setConfirmPassword(val);
                        }
                      }}
                      onKeyDown={handleSpaceKey}
                      onPaste={handlePaste}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? <span className="spinner"></span> : 'Submit Reset Request'}
                </button>
              </form>
            )}

            <div className="divider"><span>or back to sign in</span></div>

            <Link to="/login" className="back-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <FaArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
