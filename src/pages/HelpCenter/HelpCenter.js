import React from "react";
import "./HelpCenter.css";

function HelpCenter() {
  return (
    <div className="help-container">
      <h1 className="help-title">Help Center</h1>
      <p className="help-subtitle">
        Welcome to RideMart Support. How can we help you today?
      </p>

      {/* Account Section */}
      <div className="help-section">
        <h2>Account & Login</h2>
        <ul>
          <li>How to create a RideMart account?</li>
          <li>How to reset your password?</li>
          <li>How to update profile details?</li>
        </ul>
      </div>

      {/* Booking Section */}
      <div className="help-section">
        <h2>Booking & Rentals</h2>
        <ul>
          <li>How to rent a car?</li>
          <li>How to cancel a booking?</li>
          <li>How to extend rental duration?</li>
        </ul>
      </div>

      {/* Payment Section */}
      <div className="help-section">
        <h2>Payments & Refunds</h2>
        <ul>
          <li>What payment methods are accepted?</li>
          <li>How long do refunds take?</li>
          <li>Is there a cancellation fee?</li>
        </ul>
      </div>

      {/* Safety Section */}
      <div className="help-section">
        <h2>Safety & Policies</h2>
        <ul>
          <li>Rental terms and conditions</li>
          <li>Driver eligibility requirements</li>
          <li>Insurance and damage policy</li>
        </ul>
      </div>

      {/* Contact Section */}
      <div className="help-contact">
        <h2>Still Need Help?</h2>
        <p>Email: <a href="mailto:support@ridemart.com">support@ridemart.com</a></p>
        <p>Phone: <a href="tel:+918591700623">+91 8591700623</a></p>
      </div>
    </div>
  );
}

export default HelpCenter;
