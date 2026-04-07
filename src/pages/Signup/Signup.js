import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { FaRocket, FaCheckCircle, FaUser, FaEnvelope, FaPhone, FaLock, FaKey, FaEye, FaEyeSlash, FaExclamationTriangle } from 'react-icons/fa';
import '../Auth.css';
import SaveLoginPopup from '../Login/SaveLoginPopup'; // Import the new popup component

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]                 = useState('');
  const [step, setStep]                   = useState(1);

  // State for the "Save Login" popup
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e) => {
    let { name, value } = e.target;
    // Restrict spaces in password fields
    if (name === 'password' || name === 'confirmPassword') {
      if (/\s/.test(value)) {
        setPasswordError('Password cannot contain spaces');
        value = value.replace(/\s/g, '');
      } else {
        // Only clear if no other field has a space error (though only one field is changed at a time)
        setPasswordError('');
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePaste = (e) => {
    const name = e.target.name;
    if (name === 'password' || name === 'confirmPassword') {
      const pasteData = e.clipboardData.getData('text');
      if (/\s/.test(pasteData)) {
        setPasswordError('Pasted password contained spaces which were removed');
        // The value will be cleaned in handleChange as well, but this provides immediate feedback
      }
    }
  };

  const handleSpaceKey = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      setPasswordError('Password cannot contain spaces');
    }
  };

  /* ── Password strength ── */
  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8)           score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/[0-9]/.test(pw))         score++;
    if (/[^A-Za-z0-9]/.test(pw))  score++;
    return score;
  };
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthClass = ['', 'weak', 'fair', 'good', 'strong'];
  const pwStrength    = getStrength(formData.password);

  const getFriendlyError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':   return 'This email is already registered. Please sign in instead.';
      case 'auth/invalid-email':          return 'Please enter a valid email address.';
      case 'auth/weak-password':          return 'Password is too weak. Use at least 6 characters.';
      case 'auth/network-request-failed': return 'Network error. Please check your connection.';
      case 'auth/too-many-requests':      return 'Too many attempts. Please try again later.';
      default:                            return 'Signup failed. Please try again.';
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setStep(2);
  };

  // This function is called on any successful signup to decide if we show the popup
  const handleAuthSuccess = (userCredential) => {
    const additionalInfo = getAdditionalUserInfo(userCredential);
    const hasBeenPrompted = localStorage.getItem('rideMartSaveLoginPrompted');

    // Show popup only for brand new users who haven't been prompted before
    if (additionalInfo?.isNewUser && !hasBeenPrompted) {
      setNewUserEmail(userCredential.user.email);
      setShowSavePopup(true);
    } else {
      // For existing users (e.g. Google sign-in) or if already prompted, just navigate
      navigate('/');
    }
  };

  // Handlers for the SaveLoginPopup
  const handleSaveLoginInfo = () => {
    if (newUserEmail) {
      localStorage.setItem('rideMartSavedEmail', newUserEmail);
    }
    localStorage.setItem('rideMartSaveLoginPrompted', 'true');
    setShowSavePopup(false);
    navigate('/'); // Redirect after choice
  };

  const handleDeclineSave = () => {
    localStorage.setItem('rideMartSaveLoginPrompted', 'true');
    setShowSavePopup(false);
    navigate('/'); // Redirect after choice
  };

  /* ── Email / Password Signup ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (pwStrength < 2) {
      setError('Please choose a stronger password (mix letters, numbers, symbols).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create account in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2. Set display name in Firebase Auth
      await updateProfile(userCred.user, {
        displayName: formData.fullName
      });

      // 3. Save user profile to Firestore 'users' collection
      await setDoc(doc(db, 'users', userCred.user.uid), {
        fullName:  formData.fullName,
        email:     formData.email,
        phone:     formData.phone || '',
        createdAt: serverTimestamp(),
        role:      'user'
      });

      // Log activity
      await addDoc(collection(db, 'activity_logs'), {
        type: 'auth', action: 'signup', severity: 'normal',
        userId: userCred.user.uid, userEmail: userCred.user.email, timestamp: serverTimestamp(),
        details: { method: 'email_password', name: formData.fullName }
      });

      // 4. Handle success (shows popup if new user)
      handleAuthSuccess(userCred);

    } catch (err) {
      setError(getFriendlyError(err.code));
      // If email taken, go back to step 1 so user can change it
      if (err.code === 'auth/email-already-in-use') {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Google Signup ── */
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Save to Firestore if this is a brand new Google user
      const isNewUser = getAdditionalUserInfo(userCredential)?.isNewUser;
      if (isNewUser) {
        await setDoc(doc(db, 'users', user.uid), {
          fullName:  user.displayName || '',
          email:     user.email,
          phone:     user.phoneNumber || '',
          createdAt: serverTimestamp(),
          role:      'user'
        });

        // Log activity
        await addDoc(collection(db, 'activity_logs'), {
          type: 'auth', action: 'signup', severity: 'normal',
          userId: user.uid, userEmail: user.email, timestamp: serverTimestamp(),
          details: { method: 'google' }
        });
      }

      // Handle success (shows popup if new user)
      handleAuthSuccess(userCredential);

    } catch (err) {
      // Don't show error if user just closed the popup
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(getFriendlyError(err.code));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <div className="auth-page">
      {/* Animated background */}
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

      <div className="auth-container signup-container">

        {/* ── Left Panel ── */}
        <div className="auth-panel auth-left signup-left">
          <Link to="/" className="auth-logo">
            <span className="logo-ride">Ride</span><span className="logo-mart">Mart</span>
          </Link>
          <div className="panel-content">
            <div className="car-icon-big"><FaRocket /></div>
            <h2>Join RideMart</h2>
            <p>Create your free account and unlock access to thousands of cars for buying, selling, and renting.</p>
            <ul className="perks-list">
              <li><FaCheckCircle color="#ff6b6b" /> List your car for free</li>
              <li><FaCheckCircle color="#ff6b6b" /> Browse verified listings</li>
              <li><FaCheckCircle color="#ff6b6b" /> Secure rental bookings</li>
              <li><FaCheckCircle color="#ff6b6b" /> 24/7 customer support</li>
            </ul>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="auth-panel auth-right">
          <div className="auth-form-wrapper">

            {/* Step indicator */}
            <div className="step-indicator">
              <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
              <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
              <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
            </div>

            <div className="auth-header">
              <h1>{step === 1 ? 'Create Account' : 'Set Password'}</h1>
              <p>
                {step === 1
                  ? <>Already have an account? <Link to="/login" className="auth-link">Sign in</Link> | <Link to="/forgot-password" title="Forgot password?" className="auth-link">Forgot Password?</Link></>
                  : <button type="button" className="back-btn" onClick={() => setStep(1)}>← Back</button>
                }
              </p>
            </div>

            {error && <div className="auth-error"><FaExclamationTriangle /> {error}</div>}

            {/* ════════════ STEP 1 ════════════ */}
            {step === 1 && (
              <>
                <button
                  className="google-btn"
                  onClick={handleGoogleSignup}
                  type="button"
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <span className="spinner"></span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      Sign up with Google
                    </>
                  )}
                </button>

                <div className="divider"><span>or fill in your details</span></div>

                <form onSubmit={handleNextStep} className="auth-form">
                  <div className="field-group">
                    <label htmlFor="fullName">Full Name</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FaUser /></span>
                      <input
                        type="text" id="fullName" name="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="email">Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FaEnvelope /></span>
                      <input
                        type="email" id="email" name="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="phone">
                      Phone Number <span className="optional">(Optional)</span>
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FaPhone /></span>
                      <input
                        type="tel" id="phone" name="phone"
                        placeholder="+1 234 567 8900"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-submit-btn">
                    Continue →
                  </button>
                </form>
              </>
            )}

            {/* ════════════ STEP 2 ════════════ */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="field-group">
                  <label htmlFor="password">Create Password</label>
                  <div className={`input-wrapper ${passwordError ? 'error-border' : ''}`}>
                    <span className="input-icon"><FaLock /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password" name="password"
                      placeholder="Min 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      onKeyDown={handleSpaceKey}
                      onPaste={handlePaste}
                      required minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {passwordError && (
                    <div className="password-error-text">
                      <FaExclamationTriangle size={12} /> {passwordError}
                    </div>
                  )}

                  {/* Password strength bar */}
                  {formData.password && (
                    <div className="pw-strength">
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map(n => (
                          <div
                            key={n}
                            className={`strength-bar ${pwStrength >= n ? strengthClass[pwStrength] : ''}`}
                          ></div>
                        ))}
                      </div>
                      <span className={`strength-text ${strengthClass[pwStrength]}`}>
                        {strengthLabel[pwStrength]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className={`input-wrapper ${passwordError ? 'error-border' : ''}`}>
                    <span className="input-icon"><FaKey /></span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      id="confirmPassword" name="confirmPassword"
                      placeholder="Repeat your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onKeyDown={handleSpaceKey}
                      onPaste={handlePaste}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-pw"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <span className={`match-hint ${formData.password === formData.confirmPassword ? 'match' : 'no-match'}`}>
                      {formData.password === formData.confirmPassword
                        ? '✓ Passwords match'
                        : '✗ Passwords do not match'}
                    </span>
                  )}
                </div>

                <p className="terms-text">
                  By creating an account, you agree to our{' '}
                  <a href="#terms" className="auth-link">Terms of Service</a> and{' '}
                  <a href="#privacy" className="auth-link">Privacy Policy</a>.
                </p>

                <button
                  type="submit"
                  className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? <span className="spinner"></span> : 'Create My Account 🎉'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
      </div>

      {showSavePopup && (
        <SaveLoginPopup
          onSave={handleSaveLoginInfo}
          onDecline={handleDeclineSave}
        />
      )}
    </>
  );
}

export default Signup;