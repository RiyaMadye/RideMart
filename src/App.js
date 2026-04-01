import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import BuyCars from './pages/BuyCars/BuyCars';
import RentCars from './pages/RentCars/RentCars';
import Reviews from "./pages/Reviews/Reviews";
import Footer from './components/Footer/Footer';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import HelpCenter from "./pages/HelpCenter/HelpCenter";
import Faq from "./pages/Faq/Faq";
import Terms from "./pages/Terms/Terms";
import Contact from "./pages/Contact/Contact";
import Cart from './pages/Cart/Cart';
import CarDetails from './pages/CarDetails/CarDetails';
import MyActivity from './pages/MyActivity/MyActivity';
import AdminPanel from './pages/AdminPanel/AdminPanel';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import ListCar from './pages/ListCar/ListCar';
import Profile from './pages/Profile/Profile';
import ActivityMonitor from './pages/ActivityMonitor/ActivityMonitor';
import PaymentSuccess from './pages/PaymentStatus/PaymentSuccess';
import PaymentFailure from './pages/PaymentStatus/PaymentFailure';
import RentalBooking from './pages/RentalBooking/RentalBooking';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import { useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

function AppContent() {
  const location = useLocation();

  // Global cleanup: Ensure scrolling is NEVER locked on route change
  React.useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  }, [location.pathname]);

  return (
    <div className="App">
      <ScrollToTop />
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<BuyCars />} />
          <Route path="/list-car" element={
            <ProtectedRoute>
            <ListCar />
            </ProtectedRoute> 
          }
            />
          
    
          
          <Route path="/rent" element={<RentCars />} />
          <Route
            path="/rent/book/:carId"
            element={
              <ProtectedRoute>
                <RentalBooking />
              </ProtectedRoute>
            }
          />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
         <Route path="/car/:carId" element={<CarDetails />} />
          <Route 
  path="/my-activity" 
  element={
    <ProtectedRoute>
      <MyActivity />
    </ProtectedRoute>
  } 
/>
<Route path="/admin-login" element={<AdminLogin />} />
<Route 
  path="/admin" 
  element={
    <ProtectedRoute adminOnly={true}>
      <AdminPanel />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/profile" 
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/activity-monitor" 
  element={
    <ProtectedRoute adminOnly={true}>
      <ActivityMonitor />
    </ProtectedRoute>
  } 
/>
<Route path="/payment-success" element={<PaymentSuccess />} />
<Route path="/payment-failure" element={<PaymentFailure />} />


        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;