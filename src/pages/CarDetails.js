import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAuth } from 'firebase/auth';
import useRazorpay from './useRazorpay';
import { FaCalendarAlt, FaRoad, FaCogs, FaGasPump, FaPalette, FaPhone, FaArrowLeft, FaShoppingCart, FaWhatsapp, FaCreditCard } from 'react-icons/fa';
import './CarDetails.css';

function CarDetails() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const displayRazorpay = useRazorpay();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        setLoading(true);
        // Try 'cars' collection first
        let carDoc = await getDoc(doc(db, 'cars', carId));
      
        if (!carDoc.exists()) {
          // Try 'rentals' collection
          carDoc = await getDoc(doc(db, 'rentals', carId));
        }

        if (carDoc.exists()) {
          const carData = {
            id: carDoc.id,
            ...carDoc.data()
          };
          // Normalize price for rental cars if needed
          if (!carData.price && carData.dailyRate) carData.price = carData.dailyRate;
        
          setCar(carData);
          if (carData.images && carData.images.length > 0) setSelectedImage(0);
        } else {
          console.error('Vehicle not found');
          navigate('/buy');
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [carId, navigate]);

  if (loading) {
    return (
      <div className="details-page"><div className="container"><div className="loading-state"><div className="spinner"></div><p>Fetching vehicle profile...</p></div></div></div>
    );
  }

  if (!car) return null;

  const images = car.images && car.images.length > 0 ? car.images : [car.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'];

  const handleBuyOrBook = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to proceed.');
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    const isRental = !!car.dailyRate;
    const amount = isRental ? car.dailyRate : car.price;
    const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;

    // --- ROBUSTNESS CHECKS ---
    if (!razorpayKey) {
      alert("⚠️ Payment gateway Key ID is missing. If you are the owner, please add REACT_APP_RAZORPAY_KEY_ID to your environment variables.");
      setIsProcessing(false);
      return;
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      alert("⚠️ Invalid amount for this vehicle. Please ensure the price is correctly listed.");
      setIsProcessing(false);
      return;
    }

    const description = isRental ? `1-Day booking for ${car.brand} ${car.model}` : `Purchase of ${car.brand} ${car.model}`;

    const options = {
      key: razorpayKey,
      amount: Math.round(amount * 100), // Ensure it's an integer
      currency: "INR",
      name: "RideMart",
      description: description,
      image: car.imageUrl || "/logo-brand.jpg",
      handler: async (response) => {
        try {
          let docRef;
          if (isRental) {
            // Handle Rental Booking
            docRef = await addDoc(collection(db, 'bookings'), {
              carId: car.id,
              carMake: car.brand,
              carModel: car.model,
              carImage: car.imageUrl || '',
              userEmail: user.email,
              userId: user.uid,
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 1 day rental
              totalPrice: amount,
              status: 'active',
              paymentStatus: 'paid',
              createdAt: serverTimestamp(),
              razorpayPaymentId: response.razorpay_payment_id,
            });
          } else {
            // Handle Car Purchase
            docRef = await addDoc(collection(db, 'orders'), {
              userId: user.uid,
              buyerInfo: { email: user.email, name: user.displayName },
              items: [{ ...car, carId: car.id }],
              totalAmount: amount,
              paymentStatus: 'success',
              orderStatus: 'processing',
              createdAt: serverTimestamp(),
              razorpayPaymentId: response.razorpay_payment_id,
            });
          }

          try {
            // Log payment for both cases in the 'payments' collection
            await addDoc(collection(db, 'payments'), {
              userId: user.uid,
              orderId: docRef.id, // This will be a booking or order ID
              carId: car.id,
              paymentId: response.razorpay_payment_id,
              amount: amount,
              paymentStatus: 'success',
              timestamp: serverTimestamp(),
            });
          } catch (postPayError) {
            console.error("Payment succeeded but logging failed:", postPayError);
          }

          navigate(`/payment-success?payment_id=${response.razorpay_payment_id}&order_id=${docRef.id}`);
        } catch (error) {
          console.error("Error processing payment:", error);
          navigate('/payment-failure');
        } finally {
          setIsProcessing(false);
        }
      },
      prefill: { name: user.displayName || '', email: user.email },
      theme: { color: "#c21807" }
    };

    try {
      displayRazorpay(options);
    } catch (error) {
      console.error("Error launching Razorpay:", error);
      setIsProcessing(false);
    } finally {
      // We set processing to false after the modal is triggered.
      // Note: This happens almost immediately as displayRazorpay is not async.
      setIsProcessing(false);
    }
  };

  return (
    <div className="details-page animate-fade-in">
      <div className="container">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back to Marketplace
        </button>

        <div className="details-container">
          {/* Gallery */}
          <div className="image-gallery-section">
            <div className="main-image">
              <img src={images[selectedImage]} alt={`${car.brand} ${car.model}`} />
              {images.length > 1 && (
                <>
                  <button className="nav-arrow prev-arrow" onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1)}>‹</button>
                  <button className="nav-arrow next-arrow" onClick={() => setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0)}>›</button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="thumbnail-gallery no-scrollbar">
                {images.map((img, idx) => (
                  <div key={idx} className={`thumbnail ${selectedImage === idx ? 'active' : ''}`} onClick={() => setSelectedImage(idx)}>
                    <img src={img} alt="Thumbnail" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="details-section">
            <div className="details-header">
              <p className="car-brand" style={{fontSize: '1.2rem', marginBottom: '0.5rem'}}>{car.brand}</p>
              <h1 className="car-title">{car.model}</h1>
              <div className="price-section">
                <span className="price">₹{car.price?.toLocaleString()}</span>
                {car.dailyRate && <span className="price-period" style={{fontSize: '1rem', color: 'var(--text-muted)'}}>/day</span>}
              </div>
            </div>

            <div className="key-specs">
              <div className="spec-item"><FaCalendarAlt className="spec-icon" /><div><span className="spec-label">Year</span><span className="spec-value">{car.year}</span></div></div>
              <div className="spec-item"><FaRoad className="spec-icon" /><div><span className="spec-label">Mileage</span><span className="spec-value">{car.mileage?.toLocaleString()} mi</span></div></div>
              <div className="spec-item"><FaCogs className="spec-icon" /><div><span className="spec-label">Trans</span><span className="spec-value">{car.transmission || 'Auto'}</span></div></div>
              <div className="spec-item"><FaGasPump className="spec-icon" /><div><span className="spec-label">Fuel</span><span className="spec-value">{car.fuelType || 'Petrol'}</span></div></div>
              <div className="spec-item"><FaPalette className="spec-icon" /><div><span className="spec-label">Color</span><span className="spec-value">{car.color || 'N/A'}</span></div></div>
            </div>

            <div className="action-buttons">
              <button className="btn btn-primary cart-btn-large" onClick={handleBuyOrBook} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : (car.dailyRate ? <><FaCreditCard /> Book Now</> : <><FaShoppingCart /> Buy Now</>)}
              </button>
              <button className="btn btn-secondary contact-btn-large" onClick={() => setShowContactModal(true)}>
                <FaPhone /> Contact Seller
              </button>
            </div>

            <div className="description-section">
              <h3>Vehicle Overview</h3>
              <p>{car.description}</p>
            </div>

            {car.features && car.features.length > 0 && (
              <div className="features-section" style={{marginTop: 'var(--space-xl)'}}>
                <h3>Key Features</h3>
                <ul className="features-list">
                  {car.features.map((f, i) => <li key={i}>✓ {f}</li>)}
                </ul>
              </div>
            )}

            <div className="seller-preview">
              <div className="seller-info-compact">
                <div className="seller-avatar">{car.sellerName?.charAt(0).toUpperCase()}</div>
                <div>
                  <h4 style={{fontSize: '1.1rem'}}>{car.sellerName}</h4>
                  <p style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Verified Individual Seller</p>
                </div>
                <button className="btn btn-secondary" onClick={() => setShowContactModal(true)} style={{marginLeft: 'auto'}}>View Profile</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowContactModal(false)}>×</button>
            <h2>Contact Information</h2>
            <div className="modal-seller-info" style={{marginTop: 'var(--space-xl)'}}>
              <div className="flex" style={{marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)'}}>
                <div className="seller-avatar">{car.sellerName?.charAt(0)}</div>
                <div>
                  <strong>{car.sellerName}</strong>
                  <p>{car.sellerEmail}</p>
                </div>
              </div>
              <div className="grid">
                <a href={`tel:${car.sellerPhone}`} className="btn btn-primary" style={{width: '100%'}}><FaPhone /> Call Seller</a>
                <a href={`https://wa.me/${car.sellerPhone}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{width: '100%', borderColor: '#25D366', color: '#25D366'}}><FaWhatsapp /> WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarDetails;