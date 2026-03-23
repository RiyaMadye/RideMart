import React from 'react';
import { Link } from 'react-router-dom';
import { FaInstagram, FaLinkedin, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-column brand-column">
            <Link to="/" className="footer-logo">
              <img src="/logo-brand.jpg" alt="RideMart Logo" className="footer-logo-img" />
            </Link>
            <p className="footer-description">
              The most trusted car marketplace for buying, selling, and renting premium vehicles with ease and security.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-column">
            <h3>Explore</h3>
            <ul className="footer-links">
              <li><Link to="/buy">Buy Cars</Link></li>
              <li><Link to="/rent">Rent Cars</Link></li>
              <li><Link to="/list-car">Sell Your Car</Link></li>
              <li><Link to="/reviews">Customer Reviews</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="footer-column">
            <h3>Support</h3>
            <ul className="footer-links">
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/faq">FAQs</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/terms">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="footer-column">
            <h3>Contact Us</h3>
            <div className="footer-contact">
              <div className="contact-item">
                <FaMapMarkerAlt className="contact-icon" />
                <span>123 RideMall Estate, Mumbai, India</span>
              </div>
              <div className="contact-item">
                <FaPhoneAlt className="contact-icon" />
                <span>+91 98765 43210</span>
              </div>
              <div className="contact-item">
                <FaEnvelope className="contact-icon" />
                <span>support@ridemart.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} RideMart. All rights reserved.</p>
          <div className="social-links">
        {/*    <a href="#" className="social-link"><FaFacebook /></a>  */}
            <a href="https://wa.me/918591700623" className="social-link"><FaWhatsapp /></a>
            <a href="https://www.instagram.com/riyu_27_v/" className="social-link"><FaInstagram /></a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-link"><FaLinkedin /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;