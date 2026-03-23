import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import ProtectedRoute from '../components/ProtectedRoute';
import Home from './Home';
import BuyCars from './BuyCars';
import SellCar from './SellCar';
import RentCars from './RentCars';
import Reviews from './Reviews';
import Contact from './Contact';
import Login from './Login';
import Signup from './Signup';
import Profile from './Profile';
import Faq from './Faq';
import Terms from './Terms';
import HelpCenter from './HelpCenter';
import Cart from './Cart';
import CarDetails from './CarDetails';
import MyActivity from './MyActivity';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';
import ActivityMonitor from './ActivityMonitor';
import ListCar from './ListCar';
import PaymentSuccess from './payment/PaymentSuccess';
import PaymentFailure from './payment/PaymentFailure';

function App() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/buy" element={<BuyCars />} />
          <Route path="/sell" element={<SellCar />} />
          <Route path="/rent" element={<RentCars />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/car/:carId" element={<CarDetails />} />
          <Route path="/my-activity" element={<MyActivity />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="/activity-monitor" element={
            <ProtectedRoute adminOnly={true}>
              <ActivityMonitor />
            </ProtectedRoute>
          } />
          <Route path="/list-car" element={<ListCar />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;