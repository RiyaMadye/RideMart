import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile, sendPasswordResetEmail, onAuthStateChanged, deleteUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaSave, FaTimes, FaCamera, FaKey, FaBell, FaTrash, FaIdCard, FaMapMarkerAlt } from 'react-icons/fa';
import './Profile.css';

function Profile() {
  const auth = getAuth();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    photoURL: '',
    address: '',
    drivingLicense: ''
  });
  const [message, setMessage] = useState({ type: '', content: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user);
      } else {
        // No user is signed in.
        setCurrentUser(null);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  const fetchUserData = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setFormData({
          fullName: data.fullName || user.displayName || '',
          phone: data.phone || '',
          photoURL: data.photoURL || user.photoURL || '',
          address: data.address || '',
          drivingLicense: data.drivingLicense || ''
        });
      } else {
        // Fallback for users without a Firestore doc
        const data = {
          fullName: user.displayName,
          email: user.email,
          phone: user.phoneNumber,
          createdAt: { toDate: () => new Date() } 
        };
        setUserData(data);
        setFormData({
          fullName: user.displayName || '',
          phone: user.phoneNumber || '',
          photoURL: user.photoURL || '',
          address: '',
          drivingLicense: ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', content: 'Please upload an image file.' });
      return;
    }

    try {
      setLoading(true);
      const storageRef = ref(storage, `profile_photos/${currentUser.uid}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update local state
      setFormData(prev => ({ ...prev, photoURL: downloadURL }));
      
      // Update Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: downloadURL
      });

      // Update Firebase Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }

      setUserData(prev => ({ ...prev, photoURL: downloadURL }));
      setMessage({ type: 'success', content: 'Profile picture updated!' });
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', content: 'Failed to upload image: ' + error.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', content: '' }), 3000);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Update Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        fullName: formData.fullName,
        phone: formData.phone,
        photoURL: formData.photoURL,
        address: formData.address,
        drivingLicense: formData.drivingLicense
      }, { merge: true });

      // Update Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: formData.fullName,
          photoURL: formData.photoURL
        });
      }

      setUserData(prev => ({ ...prev, ...formData }));
      setMessage({ type: 'success', content: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', content: 'Failed to update profile: ' + error.message });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: '', content: '' }), 3000);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setMessage({ type: 'success', content: 'Password reset link has been sent to your email.' });
    } catch (error) {
      setMessage({ type: 'error', content: 'Error sending reset email: ' + error.message });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.");
    if (confirmDelete) {
      try {
        setLoading(true);
        await deleteUser(currentUser);
        navigate('/');
      } catch (error) {
        console.error("Error deleting account:", error);
        setMessage({ type: 'error', content: 'Failed to delete account. You may need to sign out and sign in again to perform this action.' });
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div className="profile-page"><div className="container"><div className="loading-state"><div className="spinner"></div><p>Loading profile...</p></div></div></div>;
  }
  
  if (!currentUser) {
    return <div className="profile-page"><div className="container" style={{textAlign:'center', padding:'2rem'}}><h2>Please log in to view your profile.</h2></div></div>;
  }

  // Get first name for friendly greeting
  const firstName = (userData?.fullName || currentUser.displayName || 'User').split(' ')[0];

  return (
    <div className="profile-page animate-fade-in">
      <div className="container">
        <div className="profile-card glass-dark">
          <div className="profile-header">
            <div className="top-actions">
              {isEditing ? (
                <div className="edit-buttons">
                  <button className="btn btn-save-mini" onClick={handleSave} disabled={loading} title="Save Changes"><FaSave /></button>
                  <button className="btn btn-cancel-mini" onClick={() => { setIsEditing(false); setFormData({ ...formData, fullName: userData.fullName || '', phone: userData.phone || '' }); }} title="Cancel"><FaTimes /></button>
                </div>
              ) : (
                <button className="btn btn-edit-mini" onClick={() => setIsEditing(true)} title="Edit Profile"><FaEdit /> Edit</button>
              )}
            </div>
            <div className="profile-avatar-container" onClick={() => document.getElementById('avatar-upload').click()}>
              <div className="profile-avatar">
                {formData.photoURL ? <img src={formData.photoURL} alt="Profile" /> : <FaUser />}
              </div>
              <div className="avatar-edit-hint"><FaCamera /></div>
              <input 
                type="file" 
                id="avatar-upload" 
                hidden 
                accept="image/*" 
                onChange={handleImageUpload} 
                disabled={loading}
              />
            </div>
            
            <h1>Hi, {firstName}!</h1>
            <p className="user-email">{currentUser.email}</p>
          </div>

          {message.content && <div className={`message-alert ${message.type}`}>{message.content}</div>}

          <div className="profile-details">
            <h3>Account Details</h3>
            <div className="detail-group">
              <label><FaUser /> Full Name</label>
              {isEditing ? (
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="edit-input" placeholder="Enter your full name" />
              ) : (
                <div className="detail-value">{userData?.fullName || 'Not provided'}</div>
              )}
            </div>

            <div className="detail-group">
              <label><FaEnvelope /> Email Address</label>
              <div className="detail-value" style={{border: 'none', color: 'var(--text-muted)'}}>{currentUser.email}</div>
            </div>

            <div className="detail-group">
              <label><FaPhone /> Phone Number</label>
               {isEditing ? (
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="edit-input" placeholder="Enter phone number" />
              ) : (
                <div className="detail-value">{userData?.phone || 'Not provided'}</div>
              )}
            </div>

            <div className="detail-group">
              <label><FaMapMarkerAlt /> Address</label>
              {isEditing ? (
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="edit-input" placeholder="Enter your address" />
              ) : (
                <div className="detail-value">{userData?.address || 'Not provided'}</div>
              )}
            </div>

            <div className="documents-section">
              <h3>My Documents</h3>
              <div className="detail-group">
                <label><FaIdCard /> Driving License Number</label>
                {isEditing ? (
                  <input type="text" name="drivingLicense" value={formData.drivingLicense} onChange={handleInputChange} className="edit-input" placeholder="Enter DL Number" />
                ) : (
                  <div className="detail-value">{userData?.drivingLicense || 'Not uploaded'}</div>
                )}
              </div>
              <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>* Valid driving license is required for rentals.</p>
            </div>

            {!isEditing && (
              <div style={{ marginTop: '2rem', textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button className="btn btn-primary" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setIsEditing(true); }} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
                  <FaEdit /> Edit Profile Details
                </button>
              </div>
            )}

            <div className="security-section">
              <h3>Security</h3>
              <div className="detail-group">
                <label><FaKey /> Password</label>
                <div className="password-reset-row">
                  <span>Manage your password securely</span>
                  <button className="btn btn-secondary" onClick={handlePasswordReset}>Reset Password</button>
                </div>
              </div>
            </div>

            <div className="security-section">
              <h3>App Settings</h3>
              <div className="detail-group">
                <label><FaBell /> Notifications</label>
                <div className="password-reset-row">
                  <span>Receive email updates about your activity</span>
                  <input type="checkbox" defaultChecked={true} style={{width: '20px', height: '20px', accentColor: 'var(--primary)'}} />
                </div>
              </div>
            </div>

            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <div className="detail-group">
                <label style={{color: 'var(--danger)'}}><FaTrash /> Delete Account</label>
                <div className="password-reset-row" style={{background: 'transparent', border: 'none', padding: 0}}>
                  <span>Permanently delete your account</span>
                  <button className="btn btn-outline-danger" onClick={handleDeleteAccount}>Delete Account</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




export default Profile;