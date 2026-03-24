import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAuth } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import useRazorpay from './useRazorpay';
import { FaShoppingCart, FaCalendarAlt, FaRoad, FaCogs, FaUser, FaEnvelope, FaTrash } from 'react-icons/fa';
import './Cart.css';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const navigate = useNavigate();
  const displayRazorpay = useRazorpay();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      fetchCart();
    } else {
      // If no user, show message and stop loading
      setLoading(false);
      setCartItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      // Query cart items only for the current logged-in user
      const q = query(collection(db, 'cart'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCartItems(items);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    if (window.confirm('Remove this car from cart?')) {
      try {
        await deleteDoc(doc(db, 'cart', itemId));
        setCartItems(cartItems.filter(item => item.id !== itemId));
        alert('✅ Removed from cart');
      } catch (error) {
        console.error('Error removing from cart:', error);
        alert('❌ Failed to remove from cart');
      }
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      alert('Please log in to proceed with checkout.');
      navigate('/login');
      return;
    }

    const totalAmount = calculateTotal();
    const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;

    if (!razorpayKey) {
      alert("⚠️ Payment gateway Key ID is missing. Please add it to your environment variables.");
      return;
    }

    if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
      alert("⚠️ Your cart total is zero or invalid. Add items to your cart before proceeding.");
      return;
    }

    const options = {
      key: razorpayKey,
      amount: Math.round(totalAmount * 100), // Amount in the smallest currency unit (paise)
      currency: "INR",
      name: "RideMart",
      description: `Payment for ${cartItems.length} car(s)`,
      image: "/logo-brand.jpg",
      handler: async (response) => {
        // This function is called on successful payment
        try {
          // 1. Create a new order document in Firestore
          const orderRef = await addDoc(collection(db, 'orders'), {
            userId: currentUser.uid,
            buyerInfo: {
              email: currentUser.email,
              name: currentUser.displayName,
            },
            items: cartItems,
            totalAmount: totalAmount,
            paymentStatus: 'success',
            orderStatus: 'processing',
            createdAt: serverTimestamp(),
            razorpayPaymentId: response.razorpay_payment_id,
          });

          // 2. Create a payment document for logging
          await addDoc(collection(db, 'payments'), {
            userId: currentUser.uid,
            orderId: orderRef.id,
            paymentId: response.razorpay_payment_id,
            amount: totalAmount,
            paymentStatus: 'success',
            timestamp: serverTimestamp(),
          });

          // 3. Clear the user's cart
          const deletePromises = cartItems.map(item => deleteDoc(doc(db, 'cart', item.id)));
          await Promise.all(deletePromises);

          // 4. Redirect to success page
          navigate(`/payment-success?payment_id=${response.razorpay_payment_id}&order_id=${orderRef.id}`);
        } catch (error) {
          console.error("Error processing order:", error);
          navigate('/payment-failure');
        }
      },
      prefill: {
        name: currentUser.displayName || '',
        email: currentUser.email,
        contact: currentUser.phoneNumber || ''
      },
      theme: { color: "#c21807" }
    };

    displayRazorpay(options);
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
        <div className="cart-page">
            <div className="container">
                <div className="empty-cart">
                    <h2>Please log in to view your cart.</h2>
                    <Link to="/login" className="browse-btn">Login</Link>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1><FaShoppingCart /> My Cart</h1>
          <p>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon"><FaShoppingCart /></div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any cars to your cart yet.</p>
            <a href="/buy" className="browse-btn">Browse Cars</a>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    <img 
                      src={item.imageUrl || 'https://via.placeholder.com/150x100?text=No+Image'} 
                      alt={`${item.brand} ${item.model}`}
                    />
                  </div>

                  <div className="item-details">
                    <h3>{item.brand} {item.model}</h3>
                    <div className="item-specs">
                      <span><FaCalendarAlt /> {item.year}</span>
                      <span><FaRoad /> {item.mileage?.toLocaleString()} mi</span>
                      <span><FaCogs /> {item.type}</span>
                    </div>
                    <p className="item-description">{item.description}</p>
                    <div className="seller-info-mini">
                      <span><FaUser /> {item.sellerName}</span>
                      <span><FaEnvelope /> {item.sellerEmail}</span>
                    </div>
                  </div>

                  <div className="item-actions">
                    <div className="item-price">
                      Rs.{item.price?.toLocaleString()}
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <FaTrash /> Remove
                    </button>
                    <a 
                      href={`mailto:${item.sellerEmail}?subject=Interested in ${item.brand} ${item.model}`}
                      className="contact-mini-btn"
                    >
                      <FaEnvelope /> Contact
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Cart Summary</h2>
              
              <div className="summary-row">
                <span>Total Items:</span>
                <strong>{cartItems.length}</strong>
              </div>

              <div className="summary-row total-row">
                <span>Total Value:</span>
                <strong>Rs.{calculateTotal().toLocaleString()}</strong>
              </div>

              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Payment
              </button>

              <button className="clear-cart-btn" onClick={async () => {
                if (window.confirm('Clear all items from cart?')) {
                  const deletePromises = cartItems.map(item => deleteDoc(doc(db, 'cart', item.id)));
                  await Promise.all(deletePromises);
                  setCartItems([]);
                }
              }}>
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;