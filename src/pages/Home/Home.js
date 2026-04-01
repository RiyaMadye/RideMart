import React from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaTag, FaKey, FaArrowRight, FaClock, FaShieldAlt, FaUserTie, FaHeadset } from 'react-icons/fa';
import Reviews from '../Reviews/Reviews';
import './Home.css';

function Home() {
  const services = [
    {
      title: 'Buy Your Dream Car',
      description: 'Explore the finest selection of quality pre-owned and new vehicles tailored for you.',
      icon: <FaCar />,
      link: '/buy',
      color: '#c21807' /* Crimson */
    },
    {
      title: 'Sell with Confidence',
      description: 'List your vehicle on our premium marketplace and reach thousands of verified buyers.',
      icon: <FaTag />,
      link: '/list-car',
      color: '#0a0a0a' /* Carbon */
    },
    {
      title: 'Premium Car Rentals',
      description: 'Find the perfect ride for any occasion with our flexible and luxury rental options.',
      icon: <FaKey />,
      link: '/rent',
      color: '#475569' /* Slate-ish secondary */
    }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <span className="hero-tagline">Premium Automotive Marketplace</span>
            <h1 className="hero-title">
              Driving Your <span className="highlight">Aspirations Forward</span>
            </h1>
            <p className="hero-subtitle">
              Experience the future of car buying, selling, and renting with RideMart's state-of-the-art platform.
            </p>
            <div className="hero-buttons">
              <Link to="/buy" className="btn btn-primary hero-btn-primary">
                Explore Inventory
              </Link>
              <Link to="/list-car" className="btn btn-secondary hero-btn-secondary">
                List Your Vehicle
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="container">
        <div className="stats-bar">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>2.5k+</h3>
              <p>Cars for Sale</p>
            </div>
            <div className="stat-item">
              <h3>1.2k+</h3>
              <p>Active Rentals</p>
            </div>
            <div className="stat-item">
              <h3>15k+</h3>
              <p>Happy Customers</p>
            </div>
            <div className="stat-item">
              <h3>4.9/5</h3>
              <p>User Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section className="services">
        <div className="container">
          <h2 className="section-title">Exclusive Services</h2>
          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon-wrapper" style={{ backgroundColor: service.color }}>
                  {service.icon}
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <Link to={service.link} className="service-link">
                  Learn More <FaArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">The RideMart Edge</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-number">01</div>
              <FaShieldAlt className="stat-icon" style={{color: 'var(--primary)', fontSize: '2rem', marginBottom: '1rem'}} />
              <h3>Secure Deals</h3>
              <p>Every transaction is protected by our advanced security protocols.</p>
            </div>
            <div className="feature-item">
              <div className="feature-number">02</div>
              <FaClock className="stat-icon" style={{color: 'var(--primary)', fontSize: '2rem', marginBottom: '1rem'}} />
              <h3>Instant Process</h3>
              <p>Get listed or approved for a rental in just a few simple steps.</p>
            </div>
            <div className="feature-item">
              <div className="feature-number">03</div>
              <FaUserTie className="stat-icon" style={{color: 'var(--primary)', fontSize: '2rem', marginBottom: '1rem'}} />
              <h3>Expert Support</h3>
              <p>Our automotive experts are available 24/7 to guide you.</p>
            </div>
            <div className="feature-item">
              <div className="feature-number">04</div>
              <FaHeadset className="stat-icon" style={{color: 'var(--primary)', fontSize: '2rem', marginBottom: '1rem'}} />
              <h3>Premium Care</h3>
              <p>Priority customer service for all our registered marketplace users.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <Reviews />

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-content">
              <h2>Ready to find your next ride?</h2>
              <p>Join thousands of users who trust RideMart for their automotive needs.</p>
            </div>
            <Link to="/buy" className="btn btn-cta">
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;