import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';
import './PaymentStatus.css';

function PaymentSuccess() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const paymentId = queryParams.get('payment_id');
  const orderId = queryParams.get('order_id');

  return (
    <div className="payment-status-page">
      <div className="status-card success">
        <FaCheckCircle className="status-icon" />
        <h1>Payment Successful!</h1>
        <p>Thank you for your purchase. Your transaction has been completed.</p>
        {paymentId && <p className="detail">Payment ID: <span>{paymentId}</span></p>}
        {orderId && <p className="detail">Order ID: <span>{orderId}</span></p>}
        <div className="actions">
          <Link to="/my-activity" className="btn btn-primary">View My Activity</Link>
          <Link to="/" className="btn btn-secondary">Go to Homepage</Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;