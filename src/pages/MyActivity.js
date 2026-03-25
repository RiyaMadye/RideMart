import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAuth } from 'firebase/auth';
import { FaBox, FaCheckCircle, FaCarSide, FaShoppingCart, FaWallet, FaArrowRight, FaInbox } from 'react-icons/fa';
import './MyActivity.css';

function MyActivity() {
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [soldCars, setSoldCars] = useState([]);
  const [boughtCars, setBoughtCars] = useState([]);
  const [rentedCars, setRentedCars] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [stats, setStats] = useState({ totalSpent: 0 });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchSoldCars = async () => {
      if (!currentUser?.email) return;
      const q = query(collection(db, 'cars'), where('sellerEmail', '==', currentUser.email));
      const snapshot = await getDocs(q);
      setSoldCars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'sold' })));
    };

    const fetchBoughtCars = async () => {
      if (!currentUser?.email) return;
      const q = query(collection(db, 'orders'), where('buyerInfo.email', '==', currentUser.email));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => doc.data());
      let totalSpent = 0;
      const items = [];
      orders.forEach(o => {
        totalSpent += o.totalAmount || 0;
        if (o.items) o.items.forEach(i => items.push({ ...i, type: 'bought', orderDate: o.createdAt }));
      });
      setBoughtCars(items);
      setStats(prev => ({ ...prev, totalSpent }));
    };

    const fetchRentedCars = async () => {
      if (!currentUser?.email) return;
      const q = query(collection(db, 'bookings'), where('userEmail', '==', currentUser.email));
      const snapshot = await getDocs(q);
      setRentedCars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'rented' })));
    };

    const fetchCartItems = async () => {
      if (!currentUser?.uid) return;
      const q = query(collection(db, 'cart'), where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      setCartItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'cart' })));
    };

    const fetchAllActivities = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchSoldCars(),
          fetchBoughtCars(),
          fetchRentedCars(),
          fetchCartItems()
        ]);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllActivities();
  }, [currentUser, navigate]);

  const getFilteredActivities = () => {
    switch (activeTab) {
      case 'sold': return soldCars;
      case 'bought': return boughtCars;
      case 'rented': return rentedCars;
      case 'cart': return cartItems;
      default: return [...soldCars, ...boughtCars, ...rentedCars, ...cartItems].sort((a,b) => {
        const getTime = (obj) => {
          if (!obj) return 0;
          if (typeof obj.toMillis === 'function') return obj.toMillis();
          if (obj instanceof Date) return obj.getTime();
          if (typeof obj === 'number') return obj;
          return 0;
        };
        const timeA = getTime(a.addedAt || a.createdAt);
        const timeB = getTime(b.addedAt || b.createdAt);
        return timeB - timeA;
      });
    }
  };

  if (loading) return <div className="activity-page"><div className="container"><div className="loading-state"><div className="spinner"></div><p>Synchronizing your activity...</p></div></div></div>;

  const filteredActivities = getFilteredActivities();

  return (
    <div className="activity-page animate-fade-in">
      <div className="container">
        <header className="page-header">
          <h1>Dashboard Overview</h1>
          <p>Manage your listings, purchases, and rental activity</p>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon sold"><FaBox /></div>
            <div className="stat-info"><h3>{soldCars.length}</h3><p>Listed</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bought"><FaCheckCircle /></div>
            <div className="stat-info"><h3>{boughtCars.length}</h3><p>Bought</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon rented"><FaCarSide /></div>
            <div className="stat-info"><h3>{rentedCars.length}</h3><p>Rented</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cart"><FaShoppingCart /></div>
            <div className="stat-info"><h3>{cartItems.length}</h3><p>In Cart</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon spent"><FaWallet /></div>
            <div className="stat-info"><h3>₹{stats.totalSpent.toLocaleString()}</h3><p>Spent</p></div>
          </div>
        </div>

        <div className="tabs-container no-scrollbar">
          <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Overall activity</button>
          <button className={`tab ${activeTab === 'sold' ? 'active' : ''}`} onClick={() => setActiveTab('sold')}>Your Listings ({soldCars.length})</button>
          <button className={`tab ${activeTab === 'bought' ? 'active' : ''}`} onClick={() => setActiveTab('bought')}>Purchases ({boughtCars.length})</button>
          <button className={`tab ${activeTab === 'rented' ? 'active' : ''}`} onClick={() => setActiveTab('rented')}>Rentals ({rentedCars.length})</button>
          <button className={`tab ${activeTab === 'cart' ? 'active' : ''}`} onClick={() => setActiveTab('cart')}>Cart ({cartItems.length})</button>
        </div>

        <div className="activities-container">
          {filteredActivities.length === 0 ? (
            <div className="empty-state">
              <FaInbox className="empty-icon" />
              <h3>No activity recorded yet</h3>
              <p>Start exploring the marketplace to see data here.</p>
              <button onClick={() => navigate('/buy')} className="btn btn-primary" style={{marginTop: 'var(--space-lg)'}}>Browse Marketplace</button>
            </div>
          ) : (
            <div className="activities-list">
              {filteredActivities.map((item, idx) => (
                <div key={item.id || idx} className="activity-card" onClick={() => navigate(`/car/${item.carId || item.id}`)} style={{cursor: 'pointer'}}>
                  <div className="activity-image">
                    <img src={item.imageUrl || 'https://via.placeholder.com/200x150'} alt={item.model} />
                    {item.type === 'sold' && <span className="badge badge-sold">LISTED</span>}
                    {item.type === 'bought' && <span className="badge badge-bought">BOUGHT</span>}
                    {item.type === 'rented' && <span className="badge badge-rented">RENTED</span>}
                    {item.type === 'cart' && <span className="badge badge-cart">IN CART</span>}
                  </div>
                  <div className="activity-details">
                    <p style={{color: 'var(--primary)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase'}}>{item.brand}</p>
                    <h3>{item.model}</h3>
                    <div className="activity-info">
                      <span>{item.year}</span> • <span>{item.mileage?.toLocaleString()} mi</span>
                    </div>
                  </div>
                  <div className="activity-actions">
                    <p className="activity-price">₹{item.price?.toLocaleString()}</p>
                    {item.type === 'cart' && <button className="btn btn-primary" onClick={e => { e.stopPropagation(); navigate('/checkout'); }}>Checkout <FaArrowRight /></button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyActivity;