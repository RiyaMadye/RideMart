import React from 'react';
import { FiSave } from 'react-icons/fi';

const SaveLoginPopup = ({ onSave, onDecline }) => {
  return (
    <div className="save-login-overlay">
      <div className="save-login-card">
        <div className="save-login-icon">
          <FiSave />
        </div>
        <h2>Save Login Info?</h2>
        <p>
          Would you like to save your email on this device for a faster
          sign-in next time?
        </p>
        <div className="save-login-actions">
          <button className="btn-save" onClick={onSave}>
            Save for Next Time
          </button>
          <button className="btn-not-now" onClick={onDecline}>
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveLoginPopup;