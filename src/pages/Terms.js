import React from "react";
import "./Terms.css";

function Terms() {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <h1 className="terms-title">Terms of Service</h1>

        <p>
          Welcome to RideMart. By using our platform, you agree to the following
          terms and conditions. Please read them carefully.
        </p>

        <h2>1. Use of Our Services</h2>
        <p>
          RideMart provides a platform to buy, sell, and rent vehicles. Users
          must provide accurate and truthful information when listing or
          purchasing vehicles.
        </p>

        <h2>2. User Responsibilities</h2>
        <p>
          Users are responsible for maintaining the confidentiality of their
          account and password. Any activity under your account is your
          responsibility.
        </p>

        <h2>3. Payments & Transactions</h2>
        <p>
          RideMart ensures secure transactions. However, we are not responsible
          for disputes between buyers and sellers.
        </p>

        <h2>4. Prohibited Activities</h2>
        <p>
          Users must not post false listings, fraudulent content, or misuse the
          platform in any way.
        </p>

        <h2>5. Termination</h2>
        <p>
          RideMart reserves the right to suspend or terminate accounts that
          violate these terms.
        </p>

        <h2>6. Changes to Terms</h2>
        <p>
          We may update these Terms of Service at any time. Continued use of
          the platform means you accept the updated terms.
        </p>

        <p className="terms-footer">
          © 2024 RideMart. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Terms;