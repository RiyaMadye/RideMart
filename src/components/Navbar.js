import { getAuth, signOut } from "firebase/auth";
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FaShoppingCart } from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Real-time cart count for current user
  useEffect(() => {
    if (!currentUser) {
      setCartCount(0);
      return;
    }
    const q = query(collection(db, 'cart'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCartCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      closeMenu();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="nav-wrapper">
          <Link to="/" className="logo" onClick={closeMenu}>
            <img src="/logo-brand.png" alt="RideMart Logo" className="logo-img" />
          </Link>

          <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
            <Link to="/" className={`nav-link ${isActive('/')}`} onClick={closeMenu}>Home</Link>
            <Link to="/buy" className={`nav-link ${isActive('/buy')}`} onClick={closeMenu}>Buy Cars</Link>
            <Link to="/rent" className={`nav-link ${isActive('/rent')}`} onClick={closeMenu}>Rent Cars</Link>
            <Link to="/list-car" className={`nav-link ${isActive('/list-car')}`} onClick={closeMenu}>List Your Car</Link>
            <Link to="/reviews" className={`nav-link ${isActive('/reviews')}`} onClick={closeMenu}>Reviews</Link>
            <Link to="/my-activity" className={`nav-link ${isActive('/my-activity')}`} onClick={closeMenu}>My Activity</Link>
            
            <Link to="/cart" className={`nav-link cart-link ${isActive('/cart')}`} onClick={closeMenu}>
              <FaShoppingCart /> Cart
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            <div className="nav-auth">
              {currentUser ? (
                <>
                  <Link to="/profile" className="user-greeting nav-link" onClick={closeMenu}>
                    Hi, {currentUser.displayName?.split(' ')[0] || 'User'}!
                  </Link>
                  <button onClick={handleLogout} className="logout-btn">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link nav-login" onClick={closeMenu}>Login</Link>
                  <Link to="/signup" className="nav-link nav-signup" onClick={closeMenu}>Sign Up</Link>
                </>
              )}
            </div>
          </div>

          <div className="hamburger" onClick={toggleMenu}>
            <span className={`bar ${isOpen ? 'active' : ''}`}></span>
            <span className={`bar ${isOpen ? 'active' : ''}`}></span>
            <span className={`bar ${isOpen ? 'active' : ''}`}></span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;