import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';
import useRazorpay from './useRazorpay';
import { getCarImage } from '../utils/carImages';
import {
  FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaCar, FaUserTie,
  FaShieldAlt, FaChild, FaRoute, FaCheckCircle, FaLock,
  FaGasPump, FaCog, FaUserFriends, FaCreditCard, FaTag,
  FaChevronRight, FaChevronLeft
} from 'react-icons/fa';
import './RentalBooking.css';

// ── Add-on catalogue ─────────────────────────────────────────
const ADDONS = [
  { id: 'gps',       label: 'GPS Navigation',    pricePerDay: 200, icon: <FaRoute />,    desc: 'Never get lost in a new city' },
  { id: 'insurance', label: 'Basic Insurance',   pricePerDay: 300, icon: <FaShieldAlt />, desc: 'Accident & theft coverage' },
  { id: 'child_seat',label: 'Child Seat',         pricePerDay: 150, icon: <FaChild />,    desc: 'Safety-certified child restraint' },
  { id: 'chauffeur', label: 'Driver Service',     pricePerDay: 800, icon: <FaUserTie />,  desc: 'Professional driver included' },
];

// ── Helpers ───────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

function daysBetween(start, end) {
  if (!start || !end) return 0;
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.ceil(ms / 86400000));
}

function fmt(n) { return n.toLocaleString('en-IN'); }

// ── Step indicator ────────────────────────────────────────────
function StepBar({ step }) {
  const steps = ['Trip Details', 'Add-ons & Review', 'Rental Agreement', 'Payment'];
  return (
    <div className="rb-step-bar">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className={`rb-step ${i + 1 <= step ? 'rb-step--active' : ''} ${i + 1 < step ? 'rb-step--done' : ''}`}>
            <div className="rb-step-circle">
              {i + 1 < step ? <FaCheckCircle /> : i + 1}
            </div>
            <span className="rb-step-label">{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`rb-step-line ${i + 1 < step ? 'rb-step-line--done' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Car summary sidebar card ──────────────────────────────────
function CarSummaryCard({ car }) {
  const imgSrc = car.imageUrl || car.images?.[0] || getCarImage(car.model, car.type);
  return (
    <div className="rb-car-card">
      <div className="rb-car-img-wrap">
        <img
          src={imgSrc}
          alt={`${car.brand} ${car.model}`}
          onError={e => { e.target.onerror = null; e.target.src = getCarImage(car.model, car.type); }}
        />
        <span className="rb-premium-tag">Premium Rental</span>
      </div>
      <div className="rb-car-info">
        <p className="rb-car-brand">{car.brand}</p>
        <h2 className="rb-car-model">{car.model} <span className="rb-car-year">{car.year}</span></h2>
        <div className="rb-car-specs">
          <span><FaUserFriends /> {car.seats || 5} Seats</span>
          <span><FaCog /> {car.transmission || 'Auto'}</span>
          <span><FaGasPump /> {car.fuelType || 'Petrol'}</span>
        </div>
        {car.location && (
          <p className="rb-car-location"><FaMapMarkerAlt /> {car.location}</p>
        )}
        <div className="rb-car-rate">
          <span className="rb-rate-amount">₹{fmt(car.dailyRate || car.price || 0)}</span>
          <span className="rb-rate-label">/day</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function RentalBooking() {
  const { carId } = useParams();
  const location  = useLocation();
  const navigate  = useNavigate();
  const displayRazorpay = useRazorpay();
  const auth = getAuth();

  const [step, setStep]       = useState(1);
  const [car, setCar]         = useState(location.state?.car || null);
  const [loading, setLoading] = useState(!car);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError]     = useState('');

  // Step 1 — trip details
  const [pickupDate, setPickupDate]   = useState(today());
  const [returnDate, setReturnDate]   = useState('');
  const [pickupCity, setPickupCity]   = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  // Step 2 — add-ons & driver details
  const [activeAddons, setActiveAddons] = useState({});
  const [driverName, setDriverName]   = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  // Step 3 — contract
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [signatureName, setSignatureName] = useState('');

  // ─── Fetch car from Firestore if not passed via state
  useEffect(() => {
    if (!car && carId) {
      setLoading(true);
      getDoc(doc(db, 'cars', carId))
        .then(snap => {
          if (snap.exists()) setCar({ id: snap.id, ...snap.data() });
          else navigate('/rent');
        })
        .catch(() => navigate('/rent'))
        .finally(() => setLoading(false));
    }
  }, [carId, car, navigate]);

  // Pre-fill city from car location
  useEffect(() => {
    if (car?.location) setPickupCity(car.location);
  }, [car]);

  // Auth guard — redirect to login if not signed in
  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login', { state: { from: `/rent/book/${carId}` } });
    }
  }, [auth.currentUser, carId, navigate]);

  // ─── Computed values
  const days         = daysBetween(pickupDate, returnDate);
  const baseTotal    = (car?.dailyRate || car?.price || 0) * days;
  const addonTotal   = Object.entries(activeAddons)
    .filter(([, on]) => on)
    .reduce((sum, [id]) => {
      const a = ADDONS.find(x => x.id === id);
      return sum + (a ? a.pricePerDay * days : 0);
    }, 0);
  const grandTotal   = baseTotal + addonTotal;

  // ─── Step 1 validation
  const step1Valid = pickupDate && returnDate && returnDate > pickupDate && ageConfirmed;

  // ─── Step navigation
  const goNext = () => {
    setError('');
    if (step === 1 && !step1Valid) {
      setError('Please fill pick-up & return dates, and confirm your age.');
      return;
    }
    if (step === 2 && (!driverName.trim() || !driverPhone.trim())) {
      setError('Please enter driver name and phone number.');
      return;
    }
    if (step === 3 && (!agreementSigned || !signatureName.trim())) {
      setError('Please read the agreement, check the box, and sign your name.');
      return;
    }
    setStep(s => s + 1);
  };

  const goPrev = () => setStep(s => s - 1);

  const handlePayment = async () => {
    const user = auth.currentUser;
    if (!user) { navigate('/login'); return; }

    setIsProcessing(true);
    setError('');

    try {
      // Purely client-side integration (Works on Spark/Free plan for test mode)
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: Math.round(grandTotal * 100), // amount in paise
        currency: 'INR',
        name: 'RideMart Rentals',
        description: `${car.brand} ${car.model} — ${days} day${days > 1 ? 's' : ''}`,
        image: car.imageUrl || '/logo-brand.jpg',
        prefill: {
          name: driverName || user.displayName || '',
          email: user.email,
          contact: driverPhone,
        },
        theme: { color: '#c21807' },
        handler: async (response) => {
          await handleBookingAfterPayment(response);
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      };

      displayRazorpay(options);
    } catch (err) {
      console.error('Payment initialization error:', err);
      setError('Payment initialization failed. Please check your internet connection.');
      setIsProcessing(false);
    }
  };

  // Restructured booking logic for cleaner code
  const handleBookingAfterPayment = async (response) => {
    const user = auth.currentUser;
    try {
      const enabledAddons = Object.entries(activeAddons)
        .filter(([, on]) => on)
        .map(([id]) => ADDONS.find(a => a.id === id)?.label);

      const bookingRef = await addDoc(collection(db, 'bookings'), {
        carId:            car.id,
        carBrand:         car.brand,
        carMake:          car.brand,
        carModel:         car.model,
        carImage:         car.imageUrl || '',
        carType:          car.type,
        userId:           user.uid,
        userEmail:        user.email,
        driverName,
        driverPhone,
        pickupCity,
        startDate:        pickupDate,
        endDate:          returnDate,
        days,
        dailyRate:        car.dailyRate || car.price || 0,
        addons:           enabledAddons,
        addonTotal,
        totalPrice:       grandTotal,
        status:           'active',
        paymentStatus:    'paid',
        contractSigned:   true,
        signedByName:     signatureName,
        signedAt:         serverTimestamp(),
        contractRef:      `RM-CNT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId:   response.razorpay_order_id,
        createdAt:        serverTimestamp(),
      });

      try {
        // Update car status to 'rented'
        await updateDoc(doc(db, 'cars', car.id), { status: 'rented' });

        await addDoc(collection(db, 'payments'), {
          userId:        user.uid,
          bookingId:     bookingRef.id,
          carId:         car.id,
          paymentId:     response.razorpay_payment_id,
          orderId:       response.razorpay_order_id,
          amount:        grandTotal,
          paymentStatus: 'success',
          timestamp:     serverTimestamp(),
        });
      } catch (postPayError) {
        console.error("Booking payment succeeded but background updates failed:", postPayError);
      }

      navigate(
        `/payment-success?payment_id=${response.razorpay_payment_id}&order_id=${bookingRef.id}`
      );
    } catch (err) {
      console.error('Critical error creating booking after payment:', err);
      if (err.code === 'permission-denied') {
        alert("❌ Database Error: Permission Denied. Please ensure your Firestore Security Rules are updated.");
      } else {
        alert("❌ Error saving your booking: " + err.message);
      }
      navigate('/payment-failure');
    }
  };

  // ─── Loading state
  if (loading) {
    return (
      <div className="rb-page rb-loading">
        <div className="rb-spinner" />
        <p>Loading car details...</p>
      </div>
    );
  }

  if (!car) return null;

  // ─── Render
  return (
    <div className="rb-page animate-fade-in">
      <div className="rb-container">

        {/* Back button */}
        <button className="rb-back-btn" onClick={() => navigate('/rent')}>
          <FaArrowLeft /> Back to Rentals
        </button>

        <div className="rb-layout">
          {/* Left — sidebar car card */}
          <aside className="rb-sidebar">
            <CarSummaryCard car={car} />

            {/* Price summary while not on step 1 */}
            {step >= 1 && returnDate && (
              <div className="rb-price-summary">
                <h4>Trip Summary</h4>
                <div className="rb-price-row">
                  <span>₹{fmt(car.dailyRate || car.price || 0)} × {days} day{days > 1 ? 's' : ''}</span>
                  <span>₹{fmt(baseTotal)}</span>
                </div>
                {addonTotal > 0 && (
                  <div className="rb-price-row">
                    <span>Add-ons</span>
                    <span>₹{fmt(addonTotal)}</span>
                  </div>
                )}
                <div className="rb-price-row rb-price-total">
                  <span>Total</span>
                  <span>₹{fmt(grandTotal)}</span>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="rb-trust">
              <div className="rb-trust-item"><FaShieldAlt /> Secure Payments</div>
              <div className="rb-trust-item"><FaLock /> Data Encrypted</div>
              <div className="rb-trust-item"><FaCheckCircle /> Instant Confirmation</div>
            </div>
          </aside>

          {/* Right — wizard */}
          <main className="rb-main">
            <StepBar step={step} />

            {error && <div className="rb-error">{error}</div>}

            {/* ── STEP 1: Trip Details ── */}
            {step === 1 && (
              <div className="rb-form-section animate-fade-in">
                <h2 className="rb-section-title"><FaCalendarAlt /> Trip Details</h2>

                <div className="rb-form-row">
                  <div className="rb-form-group">
                    <label>Pick-up Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      min={today()}
                      onChange={e => {
                        setPickupDate(e.target.value);
                        if (returnDate && returnDate <= e.target.value) setReturnDate('');
                      }}
                    />
                  </div>
                  <div className="rb-form-group">
                    <label>Return Date</label>
                    <input
                      type="date"
                      value={returnDate}
                      min={pickupDate || today()}
                      onChange={e => setReturnDate(e.target.value)}
                    />
                  </div>
                </div>

                {returnDate && (
                  <div className="rb-duration-pill">
                    <FaCalendarAlt /> {days} day{days > 1 ? 's' : ''} &nbsp;·&nbsp; ₹{fmt(baseTotal)} base total
                  </div>
                )}

                <div className="rb-form-group">
                  <label><FaMapMarkerAlt /> Pickup City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={pickupCity}
                    onChange={e => setPickupCity(e.target.value)}
                  />
                </div>

                <div className="rb-checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={ageConfirmed}
                      onChange={e => setAgeConfirmed(e.target.checked)}
                    />
                    I confirm I am 18+ years old and hold a valid driving licence
                  </label>
                </div>
              </div>
            )}

            {/* ── STEP 2: Add-ons & Driver Details ── */}
            {step === 2 && (
              <div className="rb-form-section animate-fade-in">
                <h2 className="rb-section-title"><FaTag /> Add-ons & Review</h2>

                <p className="rb-section-sub">Enhance your trip with optional extras</p>

                <div className="rb-addons-grid">
                  {ADDONS.map(addon => (
                    <div
                      key={addon.id}
                      className={`rb-addon-card ${activeAddons[addon.id] ? 'rb-addon-card--active' : ''}`}
                      onClick={() => setActiveAddons(prev => ({
                        ...prev, [addon.id]: !prev[addon.id]
                      }))}
                    >
                      <div className="rb-addon-icon">{addon.icon}</div>
                      <div className="rb-addon-text">
                        <strong>{addon.label}</strong>
                        <p>{addon.desc}</p>
                      </div>
                      <div className="rb-addon-price">
                        +₹{addon.pricePerDay}/day
                        {activeAddons[addon.id] && <FaCheckCircle className="rb-addon-check" />}
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="rb-section-title" style={{ marginTop: '2rem' }}><FaUserTie /> Driver Details</h3>

                <div className="rb-form-row">
                  <div className="rb-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="Name on driving licence"
                      value={driverName}
                      onChange={e => setDriverName(e.target.value)}
                    />
                  </div>
                  <div className="rb-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={driverPhone}
                      onChange={e => setDriverPhone(e.target.value)}
                    />
                  </div>
                </div>
                {/* Booking summary */}
                <div className="rb-booking-summary">
                  <h4>Booking Review</h4>
                  <div className="rb-summary-row"><span>Vehicle</span><strong>{car.brand} {car.model}</strong></div>
                  <div className="rb-summary-row"><span>Pick-up</span><strong>{pickupDate}</strong></div>
                  <div className="rb-summary-row"><span>Return</span><strong>{returnDate}</strong></div>
                  <div className="rb-summary-row"><span>Duration</span><strong>{days} day{days > 1 ? 's' : ''}</strong></div>
                  <div className="rb-summary-row"><span>City</span><strong>{pickupCity}</strong></div>
                  <div className="rb-summary-divider" />
                  <div className="rb-summary-row"><span>Base ({days}d × ₹{fmt(car.dailyRate || car.price || 0)})</span><strong>₹{fmt(baseTotal)}</strong></div>
                  {addonTotal > 0 && <div className="rb-summary-row"><span>Add-ons</span><strong>₹{fmt(addonTotal)}</strong></div>}
                  <div className="rb-summary-row rb-summary-total">
                    <span>Grand Total</span><strong>₹{fmt(grandTotal)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Rental Agreement ── */}
            {step === 3 && (
              <div className="rb-form-section animate-fade-in">
                <h2 className="rb-section-title"><FaShieldAlt /> Digital Rental Contract</h2>
                <p className="rb-section-sub">Please review and sign the agreement below</p>

                <div className="rb-contract-document">
                  <div className="rb-contract-header">
                    <img src="/logo-brand.jpg" alt="RideMart" className="rb-contract-logo" onError={e => e.target.style.display='none'} />
                    <div className="rb-contract-meta">
                      <h3>RENTAL AGREEMENT</h3>
                      <p>Ref: RM-CNT-${Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="rb-contract-body">
                    <pre className="rb-contract-text">{getContractText()}</pre>
                  </div>

                  <div className="rb-contract-footer">
                    <div className="rb-signature-box">
                      <label>Digital Signature (Type your full name)</label>
                      <input 
                        type="text" 
                        placeholder="John Doe" 
                        value={signatureName}
                        onChange={e => setSignatureName(e.target.value)}
                        className="rb-signature-input"
                      />
                      <div className="rb-signature-line"></div>
                      <p className="rb-signature-label">Signature of Renter</p>
                    </div>
                    
                    <div className="rb-owner-signature">
                      <div className="rb-stamp">RideMart Verified</div>
                      <p className="rb-signature-label">Authorized Signatory (Owner)</p>
                    </div>
                  </div>
                </div>

                <div className="rb-checkbox-group contract-check">
                  <label>
                    <input
                      type="checkbox"
                      checked={agreementSigned}
                      onChange={e => setAgreementSigned(e.target.checked)}
                    />
                    I have read, understood and agree to the terms and conditions of this rental contract.
                  </label>
                </div>

                <button className="rb-print-btn" onClick={() => window.print()}>
                  <FaRoute /> Print/Save as PDF
                </button>
              </div>
            )}

            {/* ── STEP 4: Payment ── */}
            {step === 4 && (
              <div className="rb-form-section animate-fade-in">
                <h2 className="rb-section-title"><FaCreditCard /> Secure Payment</h2>
                <p className="rb-section-sub">Your booking will be confirmed immediately after payment</p>

                {/* Final receipt */}
                <div className="rb-receipt">
                  <div className="rb-receipt-header">
                    <FaCar /> Booking Receipt
                  </div>
                  <div className="rb-receipt-row"><span>Car</span><strong>{car.brand} {car.model} ({car.year})</strong></div>
                  <div className="rb-receipt-row"><span>Period</span><strong>{pickupDate} → {returnDate}</strong></div>
                  <div className="rb-receipt-row"><span>Duration</span><strong>{days} day{days > 1 ? 's' : ''}</strong></div>
                  <div className="rb-receipt-row"><span>Pickup</span><strong>{pickupCity}</strong></div>
                  <div className="rb-receipt-row"><span>Driver</span><strong>{driverName}</strong></div>
                  {Object.entries(activeAddons).filter(([, on]) => on).length > 0 && (
                    <div className="rb-receipt-row">
                      <span>Add-ons</span>
                      <strong>
                        {Object.entries(activeAddons)
                          .filter(([, on]) => on)
                          .map(([id]) => ADDONS.find(a => a.id === id)?.label)
                          .join(', ')}
                      </strong>
                    </div>
                  )}
                  <div className="rb-receipt-divider" />
                  <div className="rb-receipt-row rb-receipt-total">
                    <span>Total Payable</span>
                    <strong>₹{fmt(grandTotal)}</strong>
                  </div>
                </div>

                <div className="rb-payment-note">
                  <FaLock /> Payment is secured by Razorpay. Your card details are never shared.
                </div>

                <button
                  className="rb-pay-btn"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <><span className="rb-btn-spinner" /> Processing...</>
                  ) : (
                    <><FaCreditCard /> Pay ₹{fmt(grandTotal)} Now</>
                  )}
                </button>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="rb-nav-buttons">
              {step > 1 && (
                <button className="rb-btn-back" onClick={goPrev}>
                  <FaChevronLeft /> Back
                </button>
              )}
              {step < 4 && (
                <button className="rb-btn-next" onClick={goNext}>
                  {step === 3 ? 'Proceed to Payment' : 'Continue'} <FaChevronRight />
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
