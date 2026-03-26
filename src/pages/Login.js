import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
  // No need for persistence imports, default is 'local'
} from 'firebase/auth';
import { doc, addDoc, collection, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { FaCar, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData]           = useState({ email: '', password: '' });
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]                 = useState('');
  const [passwordError, setPasswordError] = useState('');

  // On component load, check for a saved email to pre-fill the form
  useEffect(() => {
    const savedEmail = localStorage.getItem('rideMartSavedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []); // Empty dependency array ensures this runs only once on mount

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

  const handleSpaceKey = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      setPasswordError('Password cannot contain spaces');
    }
  };

  /* ── Friendly Firebase error messages ── */
  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/user-not-found':         return 'No account found with this email. Please sign up.';
      case 'auth/wrong-password':         return 'Incorrect password. Please try again.';
      case 'auth/invalid-email':          return 'Please enter a valid email address.';
      case 'auth/too-many-requests':      return 'Too many failed attempts. Please try again later.';
      case 'auth/user-disabled':          return 'This account has been disabled. Contact support.';
      case 'auth/invalid-credential':     return 'Invalid email or password. Please try again.';
      case 'auth/network-request-failed': return 'Network error. Please check your connection.';
      default:                            return 'Login failed. Please try again.';
    }
  };

  /* ── Auth Handlers ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // Log activity
      await addDoc(collection(db, 'activity_logs'), {
        type: 'auth', action: 'login', severity: 'normal',
        userId: userCred.user.uid, userEmail: userCred.user.email, timestamp: serverTimestamp(),
        details: { method: 'email_password' }
      });

      // On successful login, navigate to the home page.
      navigate('/');
    } catch (err) {
      // Log security event (failed login)
      addDoc(collection(db, 'activity_logs'), {
        type: 'security', action: 'login_failed', severity: 'medium',
        userEmail: formData.email, timestamp: serverTimestamp(),
        details: { error: err.code }
      });
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  /* ── Google Login ── */
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user doc exists in Firestore, create if not
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          fullName: user.displayName || 'User',
          email: user.email,
          phone: user.phoneNumber || '',
          createdAt: serverTimestamp(),
          role: 'user',
          photoURL: user.photoURL,
          status: 'active'
        });
      }

      // Log activity
      await addDoc(collection(db, 'activity_logs'), {
        type: 'auth', action: 'login', severity: 'normal',
        userId: user.uid, userEmail: user.email, timestamp: serverTimestamp(),
        details: { method: 'google' }
      });

      setGoogleLoading(false);
      // On successful login, navigate to the home page.
      navigate('/');
    } catch (err) {
      setGoogleLoading(false);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(getFriendlyError(err.code));
      }
    }
  };

  /* ── Forgot Password logic moved to separate page ── */

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
            <img src="/logo-brand.jpg" alt="RideMart Logo" style={{height: '50px', borderRadius: '8px'}} />
          </Link>
          <div className="panel-content">
            <div className="car-icon-big">
              <FaCar />
            </div>
            <h2>Welcome Back!</h2>
            <p>Sign in to access your account and explore thousands of cars available to buy, sell, and rent.</p>
            <div className="auth-stats">
              <div className="stat"><span className="stat-num">10K+</span><span className="stat-label">Cars Listed</span></div>
              <div className="stat"><span className="stat-num">5K+</span><span className="stat-label">Happy Buyers</span></div>
              <div className="stat"><span className="stat-num">2K+</span><span className="stat-label">Rentals</span></div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="auth-panel auth-right">
          <div className="auth-form-wrapper">
            <div className="auth-header">
              <h1>Sign In</h1>
              <p>Don't have an account? <Link to="/signup" className="auth-link">Create one</Link></p>
            </div>

            {error    && <div className="auth-error"><FaExclamationTriangle /> {error}</div>}

            <button className="google-btn" onClick={handleGoogleLogin} type="button" disabled={googleLoading}>
              {googleLoading ? <span className="spinner"></span> : (
                <>
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="divider"><span>or sign in with email</span></div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FaEnvelope /></span>
                  <input
                    type="email" id="email" name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required autoComplete="email"
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="password">
                  Password
                  <Link to="/forgot-password" title="Forgot password?" className="forgot-link">
                    Forgot password?
                  </Link>
                </label>
                <div className={`input-wrapper ${passwordError ? 'error-border' : ''}`}>
                  <span className="input-icon"><FaLock /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password" name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onKeyDown={handleSpaceKey}
                    required autoComplete="current-password"
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
              </div>

              <button type="submit" className={`auth-submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;   