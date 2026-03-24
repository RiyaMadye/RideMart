import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BuyCars from './pages/BuyCars';
/* import SellCar from './pages/SellCar'; */
import RentCars from './pages/RentCars';
import Reviews from "./pages/Reviews";
import Footer from './components/Footer';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HelpCenter from "./pages/HelpCenter";
import Faq from "./pages/Faq";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Cart from './pages/Cart';
import CarDetails from './pages/CarDetails';
import MyActivity from './pages/MyActivity';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import ListCar from './pages/ListCar';
import Profile from './pages/Profile';
import ActivityMonitor from './pages/ActivityMonitor';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import RentalBooking from './pages/RentalBooking';
import ForgotPassword from './pages/ForgotPassword';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

function AppContent() {
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
          
    
     { /*    <Route 
  path="/sell" 
  element={
    <ProtectedRoute>
      <SellCar />
    </ProtectedRoute>
  } 
/> */}
          
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