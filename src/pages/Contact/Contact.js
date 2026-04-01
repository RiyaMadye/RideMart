import React, { useState } from "react";
import "./Contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message sent successfully!");
    setFormData({
      name: "",
      email: "",
      message: ""
    });
  };

  return (
    <div className="contact-page">
      <div className="contact-container">
        <h1>Contact Us</h1>
        <p className="contact-subtitle">
          Have questions? We'd love to hear from you.
        </p>

        <div className="contact-content">

          {/* Contact Form */}
          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <textarea
              name="message"
              placeholder="Your Message"
              rows="5"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>

            <button type="submit">Send Message</button>
          </form>

          {/* Contact Info */}
          <div className="contact-info">
            <h3>Our Information</h3>
            <p>📧 support@ridemart.com</p>
            <p>📞 +91 8591700623</p>
            <p>📍 Mumbai, India</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Contact;