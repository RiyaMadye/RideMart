import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import './Reviews.css';

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rating: 5,
    title: '',
    review: ''
  });

  // Fetch reviews from Firebase
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Add review to Firebase
      await addDoc(collection(db, 'reviews'), {
        userName: formData.name,
        userEmail: formData.email,
        rating: parseInt(formData.rating),
        title: formData.title,
        review: formData.review,
        userId: 'anonymous',
        approved: true,
        createdAt: serverTimestamp()
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        rating: 5,
        title: '',
        review: ''
      });

      // Close form and refresh reviews
      setShowWriteForm(false);
      alert('Thank you! Your review has been submitted successfully.');
      fetchReviews();

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Recently';
    }
  };

  return (
    <div className="reviews-page">
      <div className="container">
        {/* Header Section */}
        <div className="reviews-header">
          <div className="header-content">
            <h1>Customer Reviews</h1>
            <p>See what our customers are saying about RideMart</p>
          </div>
          <button 
            className="write-review-btn"
            onClick={() => setShowWriteForm(!showWriteForm)}
          >
            {showWriteForm ? '✕ Cancel' : '✍️ Write a Review'}
          </button>
        </div>

        {/* Write Review Form */}
        {showWriteForm && (
          <div className="write-review-section">
            <div className="write-review-card">
              <h2>Share Your Experience</h2>
              <p className="form-subtitle">Your feedback helps others make informed decisions</p>

              <form onSubmit={handleSubmit} className="review-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Your Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="rating">Your Rating *</label>
                  <select
                    id="rating"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    required
                    disabled={submitting}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                    <option value="4">⭐⭐⭐⭐ Good</option>
                    <option value="3">⭐⭐⭐ Average</option>
                    <option value="2">⭐⭐ Poor</option>
                    <option value="1">⭐ Very Poor</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="title">Review Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Summarize your experience"
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="review">Your Review *</label>
                  <textarea
                    id="review"
                    name="review"
                    value={formData.review}
                    onChange={handleChange}
                    required
                    rows="5"
                    placeholder="Tell us about your experience with RideMart..."
                    disabled={submitting}
                  />
                </div>

                <button 
                  type="submit" 
                  className="submit-review-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Reviews Display Section */}
        <div className="reviews-section">
          <div className="reviews-stats">
            <div className="stat-card">
              <h3>{reviews.length}</h3>
              <p>Total Reviews</p>
            </div>
            <div className="stat-card">
              <h3>{reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0'}</h3>
              <p>Average Rating</p>
            </div>
            <div className="stat-card">
              <h3>{reviews.filter(r => r.rating === 5).length}</h3>
              <p>5-Star Reviews</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No Reviews Yet</h3>
              <p>Be the first to share your experience with RideMart!</p>
              <button 
                className="write-first-review-btn"
                onClick={() => setShowWriteForm(true)}
              >
                Write First Review
              </button>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {review.userName ? review.userName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <h4 className="reviewer-name">{review.userName || 'Anonymous'}</h4>
                        <p className="review-date">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  <h3 className="review-title">{review.title}</h3>
                  <p className="review-text">{review.review}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reviews;