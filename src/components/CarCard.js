import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAuth } from 'firebase/auth';
import { FaCalendarAlt, FaRoad, FaShoppingCart } from 'react-icons/fa';
import './CarCard.css';

function CarCard({ car }) {
  const navigate = useNavigate();
  const [addingToCart, setAddingToCart] = useState(false);

  const handleViewDetails = () => {
    navigate(`/car/${car.id}`);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert('Please log in to add items to your cart.');
      navigate('/login');
      return;
    }
    try {
      setAddingToCart(true);
      await addDoc(collection(db, "cart"), {
        carId: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        price: car.price,
        type: car.type,
        imageUrl: car.imageUrl || car.image,
        sellerEmail: car.sellerEmail,
        userId: user.uid, // Associate cart item with user
        addedAt: serverTimestamp()
      });
      alert(`✅ ${car.brand} ${car.model} added to your cart!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("❌ Failed to add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  // Fallback image by car body type — picks reliable Unsplash photo
  const getTypeFallbackImage = (type) => {
    const fallbacks = {
      SUV:       'https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?auto=format&fit=crop&w=640&q=80',
      Sedan:     'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=640&q=80',
      Hatchback: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=640&q=80',
      MPV:       'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=640&q=80',
      Pickup:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=640&q=80',
      Coupe:     'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=640&q=80',
    };
    return fallbacks[type] || fallbacks.SUV;
  };

  const displayPrice = car.purpose === 'rent' || car.availability === 'rent'
    ? car.dailyRate || car.price
    : car.price || car.dailyRate;

  const isRental = car.purpose === 'rent' || car.availability === 'rent';

  return (
    <div className="car-card animate-fade-in" onClick={handleViewDetails}>
      <div className="car-image-container">
        <img 
          src={car.imageUrl || car.image || car.images?.[0] || getTypeFallbackImage(car.type)}
          alt={`${car.brand} ${car.model}`}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null; // prevent infinite loop
            e.target.src = getTypeFallbackImage(car.type);
          }}
        />
        <span className="car-type-badge">{car.type}</span>
        
        {!isRental && car.purpose !== 'rent' && <span className="availability-badge sale-badge">FOR SALE</span>}
        {isRental && <span className="availability-badge rent-badge">FOR RENT</span>}
        {(car.availableForBoth || (car.availableForSale && car.availableForRent)) && (
          <span className="availability-badge both-badge">SALE & RENT</span>
        )}
      </div>

      <div className="car-content">
        <div className="car-title-wrapper">
          <p className="car-brand">{car.brand}</p>
          <h3 className="car-model">{car.model}</h3>
        </div>

        <div className="car-info">
          <div className="info-item">
            <FaCalendarAlt /> <span>{car.year}</span>
          </div>
          <div className="info-item">
            <FaRoad /> <span>{(car.kmDriven || car.mileage)?.toLocaleString()} {car.kmDriven ? 'km' : 'mi'}</span>
          </div>
        </div>

        <p className="car-description">{car.description}</p>

        <div className="car-footer">
          <div className="price-wrapper">
            <span className="car-price">₹{displayPrice?.toLocaleString()}</span>
            {isRental && <span className="price-period">/day</span>}
          </div>

          <div className="car-actions">
            <button 
              className={`action-btn ${addingToCart ? 'loading' : ''}`}
              onClick={handleAddToCart}
              title="Add to Cart"
              disabled={addingToCart}
            >
              <FaShoppingCart />
            </button>
            <button 
              className="btn-view"
              onClick={handleViewDetails}
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarCard;