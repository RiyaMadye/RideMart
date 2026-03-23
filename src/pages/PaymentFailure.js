import React from 'react';
import { Link } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';
import './PaymentStatus.css';

function PaymentFailure() {
  return (
    <div className="payment-status-page">
      <div className="status-card failure">
        <FaTimesCircle className="status-icon" />
        <h1>Payment Failed</h1>
        <p>Unfortunately, we were unable to process your payment. Please try again.</p>
        <div className="actions">
          <Link to="/cart" className="btn btn-primary">Try Again</Link>
          <Link to="/" className="btn btn-secondary">Go to Homepage</Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailure;