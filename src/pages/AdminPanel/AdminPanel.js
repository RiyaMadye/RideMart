import React, { useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { collection, deleteDoc, doc, getDoc, onSnapshot, query, orderBy, limit, addDoc, updateDoc, setDoc, writeBatch, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { generateSeedData } from '../../data/seedData';
import { searchCarsAPI, mapApiSpecToFormFields } from '../../utils/carsApi';
import { getCarImages } from '../../utils/carImages';
import {
  FaCar, FaUsers, FaShoppingCart, FaChartLine, FaTrash, FaEdit, FaPoll,
  FaCheck, FaPlus, FaArrowUp, FaArrowDown, FaHistory, FaWallet,
  FaClipboardList, FaStar, FaHeadset, FaBullhorn, FaPaperPlane, FaCog, FaKey, FaCreditCard, FaFileAlt
} from 'react-icons/fa';
import './AdminPanel.css';
const AnalyticsDashboard = React.lazy(() => import('../AnalyticsDashboard/AnalyticsDashboard'));

function AdminPanel() {
  const [view, setView] = useState('overview');
  const [stats, setStats] = useState({
    users: 0,
    cars: 0,
    rentals: 0,
    sales: 0,
    orders: 0,
    revenue: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // User Management State
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    fullName: '',
    email: '',
    role: 'buyer',
    isVerified: false,
    status: 'active'
  });

  // Fleet Management State
  const [fleetList, setFleetList] = useState([]);
  const [carSearchQuery, setCarSearchQuery] = useState('');
  const [carFilterType, setCarFilterType] = useState('all');
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [carFormData, setCarFormData] = useState({
    brand: '', make: '', model: '', year: '', price: '', dailyRate: '',
    purpose: 'sale', status: 'pending', isFeatured: false,
    ownerEmail: 'admin@ridemart.com', images: [], imageUrl: '',
    fuelType: 'Petrol', transmission: 'Manual', type: 'SUV',
    kmDriven: '', condition: 'Good', location: '', description: '', features: []
  });

  // Seed state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState('');

  // Booking Management State
  const [bookingsList, setBookingsList] = useState([]);
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('all');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [bookingFormData, setBookingFormData] = useState({
    carMake: '',
    carModel: '',
    renterEmail: '',
    startDate: '',
    endDate: '',
    totalPrice: '',
    status: 'pending',
    paymentStatus: 'pending'
  });

  // Transaction Management State
  const [transactionsList, setTransactionsList] = useState([]);
  const [transSearchQuery, setTransSearchQuery] = useState('');
  const [transFilterStatus, setTransFilterStatus] = useState('all');
  const [isTransModalOpen, setIsTransModalOpen] = useState(false);
  const [editingTrans, setEditingTrans] = useState(null);
  const [transFormData, setTransFormData] = useState({
    customerEmail: '',
    carDetails: '',
    amount: '',
    commission: '',
    status: 'completed',
    paymentMethod: 'card'
  });

  // Reviews Management State
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({
    userName: '', rating: 5, title: '', review: '', approved: true
  });

  // Platform Settings State
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'RideMart',
    supportEmail: 'admin@ridemart.com',
    commissionSale: 5,
    commissionRent: 15,
    currency: 'INR',
    maintenanceMode: false,
    allowRegistrations: true,
    requireVerification: false,
    stripeKey: 'pk_test_sample_key',
    bannerMessage: 'Welcome to the #1 Marketplace'
  });

  // Support & Notifications State
  const [ticketsList, setTicketsList] = useState([]);
  const [ticketFilter, setTicketFilter] = useState('open');
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState({ title: '', message: '', target: 'all', type: 'info' });
  const [selectedTicket, setSelectedTicket] = useState(null); // For viewing/replying
  const [ticketReply, setTicketReply] = useState('');

  // Password Reset Requests State
  const [resetRequests, setResetRequests] = useState([]);
  const [resetSearchQuery, setResetSearchQuery] = useState('');
  const [resetFilterStatus, setResetFilterStatus] = useState('pending');

  // Payments State
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentsSearchQuery, setPaymentsSearchQuery] = useState('');

  // Document Viewer State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [activeDocs, setActiveDocs] = useState(null); // { title: '', docs: { name: url } }

  // Helper to find a user's name by ID or Email
  const getUserName = (userId, userEmail) => {
    const user = usersList.find(u =>
      (userId && u.id === userId) ||
      (userEmail && u.email?.toLowerCase() === userEmail.toLowerCase())
    );
    if (!user) return userEmail || (userId ? `ID: ${userId.slice(0, 8)}` : 'Unknown');
    return user.fullName || user.displayName || user.email;
  };

  const handleSyncNames = async () => {
    if (!window.confirm("This will retroactively update 'payments', 'bookings', and 'orders' documents with current user names from the Users database. Proceed?")) return;
    setIsSeeding(true);
    setSeedStatus("🔄 Syncing names across database...");
    let updatedCount = 0;

    try {
      const collectionsToSync = ['payments', 'bookings', 'orders'];

      for (const colName of collectionsToSync) {
        const snapshot = await getDocs(collection(db, colName));
        const batch = writeBatch(db);
        let batchCount = 0;

        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          const userId = data.userId;
          const userEmail = data.userEmail || data.customerEmail || data.renterEmail || data.buyerInfo?.email;

          const user = usersList.find(u =>
            (userId && u.id === userId) ||
            (userEmail && u.email?.toLowerCase() === userEmail.toLowerCase())
          );

          if (user) {
            const name = user.fullName || user.displayName;
            if (name && (data.userName !== name || data.fullName !== name)) {
              const updateData = {};
              if (colName === 'orders') {
                updateData.userName = name;
                updateData.buyerInfo = { ...data.buyerInfo, name: name };
              } else {
                updateData.userName = name;
              }
              batch.update(doc(db, colName, docSnap.id), updateData);
              batchCount++;
              updatedCount++;
            }
          }
        });

        if (batchCount > 0) {
          await batch.commit();
        }
      }

      setSeedStatus(`✅ Successfully synced names in ${updatedCount} records.`);
      setTimeout(() => setSeedStatus(''), 5000);
    } catch (err) {
      console.error("Sync Error:", err);
      setSeedStatus(`❌ Sync Error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    // Fetch Settings (one-time fetch is fine for this)
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'platform');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setPlatformSettings(settingsSnap.data());
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();

    // 1. Listen for Recent Activity (Combined Orders & Bookings)
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
    const bookingsActQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(10));

    let ordersData = [];
    let bookingsActData = [];

    const updateUnifiedActivity = () => {
      const combined = [
        ...ordersData.map(d => ({
          id: d.id, type: 'Order', title: `Sale: ${d.items?.[0]?.brand || 'Vehicle'}`,
          subtitle: `₹${parseInt(d.totalAmount || d.amount || 0).toLocaleString()}`,
          timestamp: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
          icon: <FaShoppingCart />
        })),
        ...bookingsActData.map(d => ({
          id: d.id, type: 'Booking', title: `Rental: ${d.carModel || 'Vehicle'}`,
          subtitle: `₹${parseInt(d.totalPrice || 0).toLocaleString()}`,
          timestamp: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
          icon: <FaClipboardList />
        }))
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
      setRecentActivity(combined);
    };

    const unsubscribeOrdersAct = onSnapshot(ordersQuery, (snapshot) => {
      ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateUnifiedActivity();
    });

    const unsubscribeBookingsAct = onSnapshot(bookingsActQuery, (snapshot) => {
      bookingsActData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateUnifiedActivity();
    });

    // 2. User Management & Stats Listener
    const usersQuery = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      users.sort((a, b) => {
        const timeA = a.createdAt && typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt && typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setUsersList(users);
      setStats(prev => ({ ...prev, users: users.length }));
    }, (error) => {
      console.error("Error fetching users:", error);
    });

    // 3. Fleet Management & Stats Listener
    const fleetQuery = query(collection(db, 'cars'), orderBy('createdAt', 'desc'));
    const unsubscribeFleet = onSnapshot(fleetQuery, (snapshot) => {
      const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFleetList(vehicles);
      const totalCars = vehicles.length;
      const rentalCars = vehicles.filter(d => d.purpose === 'rent').length;
      const saleCars = vehicles.filter(d => d.purpose === 'sale').length;
      setStats(prev => ({ ...prev, cars: totalCars, rentals: rentalCars, sales: saleCars }));
    }, (error) => {
      console.error("Error fetching fleet:", error);
    });

    // 4. Booking Management Listener
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBookingsList(bookings);
    }, (error) => {
      console.error("Error fetching bookings:", error);
    });

    // 5. Transaction, Orders & Revenue Stats Listener
    const transQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeTrans = onSnapshot(transQuery, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactionsList(trans);
      const totalRevenue = trans.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
      setStats(prev => ({ ...prev, orders: trans.length, revenue: totalRevenue }));
    }, (error) => {
      console.error("Error fetching transactions:", error);
    });

    // 6. Reviews Management Listener
    const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviewsList(reviews);
    }, (error) => {
      console.error("Error fetching reviews:", error);
    });

    // 7. Support Tickets Listener
    const ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      setTicketsList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching tickets:", error);
    });

    // 8. Password Reset Requests Listener
    const resetRequestsQuery = query(collection(db, 'password_reset_requests'), orderBy('requestedAt', 'desc'));
    const unsubscribeResetRequests = onSnapshot(resetRequestsQuery, (snapshot) => {
      setResetRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching reset requests:", error);
    });

    // 9. Payments Collection Listener & Unified Revenue
    const paymentsQuery = query(collection(db, 'payments'), orderBy('timestamp', 'desc'));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPaymentsList(payments);

      const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
      setStats(prev => ({ ...prev, revenue: totalRevenue }));
    }, (error) => {
      console.error("Error fetching payments:", error);
    });

    return () => {
      unsubscribeOrdersAct();
      unsubscribeBookingsAct();
      unsubscribeUsers();
      unsubscribeFleet();
      unsubscribeBookings();
      unsubscribeTrans();
      unsubscribeReviews();
      unsubscribeTickets();
      unsubscribeResetRequests();
      unsubscribePayments();
    };
  }, []);

  const handleTransAction = async (transId, action, value) => {
    try {
      const transRef = doc(db, 'orders', transId);
      if (action === 'delete') {
        if (window.confirm("Delete this transaction record?")) {
          await deleteDoc(transRef);
        }
      } else if (action === 'status') {
        await updateDoc(transRef, { status: value });
      }
    } catch (err) {
      console.error("Trans Action Error:", err);
    }
  };

  const handleSaveTrans = async (e) => {
    e.preventDefault();
    try {
      if (editingTrans) {
        await updateDoc(doc(db, 'orders', editingTrans.id), transFormData);
      } else {
        await addDoc(collection(db, 'orders'), {
          ...transFormData,
          createdAt: new Date()
        });
      }
      setIsTransModalOpen(false);
      setEditingTrans(null);
    } catch (err) {
      console.error("Save Trans Error:", err);
    }
  };

  const openTransModal = (trans = null) => {
    if (trans) {
      setEditingTrans(trans);
      setTransFormData({
        customerEmail: trans.customerEmail || '',
        carDetails: trans.carDetails || '',
        amount: trans.amount || '',
        commission: trans.commission || (trans.amount * 0.05).toFixed(0),
        status: trans.status || 'completed',
        paymentMethod: trans.paymentMethod || 'card'
      });
    } else {
      setEditingTrans(null);
      setTransFormData({ customerEmail: '', carDetails: '', amount: '', commission: '', status: 'completed', paymentMethod: 'card' });
    }
    setIsTransModalOpen(true);
  };

  const handleBookingAction = async (bookingId, action, value) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      if (action === 'delete') {
        if (window.confirm("Cancel and delete this booking permanently?")) {
          await deleteDoc(bookingRef);
        }
      } else if (action === 'status') {
        await updateDoc(bookingRef, { status: value });
      } else if (action === 'payment') {
        await updateDoc(bookingRef, { paymentStatus: value });
      }
    } catch (err) {
      console.error("Booking Action Error:", err);
    }
  };

  const handleSaveBooking = async (e) => {
    e.preventDefault();
    try {
      if (editingBooking) {
        await updateDoc(doc(db, 'bookings', editingBooking.id), bookingFormData);
      } else {
        await addDoc(collection(db, 'bookings'), {
          ...bookingFormData,
          createdAt: new Date()
        });
      }
      setIsBookingModalOpen(false);
      setEditingBooking(null);
    } catch (err) {
      console.error("Save Booking Error:", err);
    }
  };

  const openBookingModal = (booking = null) => {
    if (booking) {
      setEditingBooking(booking);
      setBookingFormData({
        carMake: booking.carMake || '',
        carModel: booking.carModel || '',
        renterEmail: booking.renterEmail || '',
        startDate: booking.startDate || '',
        endDate: booking.endDate || '',
        totalPrice: booking.totalPrice || '',
        status: booking.status || 'pending',
        paymentStatus: booking.paymentStatus || 'pending'
      });
    } else {
      setEditingBooking(null);
      setBookingFormData({ carMake: '', carModel: '', renterEmail: '', startDate: '', endDate: '', totalPrice: '', status: 'pending', paymentStatus: 'pending' });
    }
    setIsBookingModalOpen(true);
  };

  const handleCarAction = async (carId, action, value) => {
    try {
      const carRef = doc(db, 'cars', carId);
      if (action === 'delete') {
        if (window.confirm("Delete this vehicle listing permanently?")) {
          await deleteDoc(carRef);
        }
      } else if (action === 'toggleFeatured') {
        await updateDoc(carRef, { isFeatured: value });
      } else if (action === 'status') {
        await updateDoc(carRef, { status: value });
      }
    } catch (err) {
      console.error("Car Action Error:", err);
    }
  };

  const handleSaveCar = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...carFormData,
        // Keep both brand and make in sync for backwards compat
        brand: carFormData.brand || carFormData.make,
        make: carFormData.make || carFormData.brand,
        imageUrl: carFormData.imageUrl || carFormData.images?.[0] || '',
        images: carFormData.imageUrl
          ? [carFormData.imageUrl, ...(carFormData.images || [])].slice(0, 5)
          : (carFormData.images?.length > 0 ? carFormData.images : ['https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Car_silhouette.svg/640px-Car_silhouette.svg']),
      };
      if (editingCar) {
        await updateDoc(doc(db, 'cars', editingCar.id), payload);
      } else {
        await addDoc(collection(db, 'cars'), { ...payload, createdAt: new Date() });
      }
      setIsCarModalOpen(false);
      setEditingCar(null);
    } catch (err) {
      console.error("Save Car Error:", err);
    }
  };

  const openCarModal = (car = null) => {
    if (car) {
      setEditingCar(car);
      setCarFormData({
        brand: car.brand || car.make || '',
        make: car.make || car.brand || '',
        model: car.model || '',
        year: car.year || '',
        price: car.price || '',
        dailyRate: car.dailyRate || '',
        purpose: car.purpose || 'sale',
        status: car.status || 'pending',
        isFeatured: car.isFeatured || false,
        ownerEmail: car.ownerEmail || 'admin@ridemart.com',
        images: car.images || [],
        imageUrl: car.imageUrl || car.images?.[0] || '',
        fuelType: car.fuelType || 'Petrol',
        transmission: car.transmission || 'Manual',
        type: car.type || 'SUV',
        kmDriven: car.kmDriven || '',
        condition: car.condition || 'Good',
        location: car.location || '',
        description: car.description || '',
        features: car.features || []
      });
    } else {
      setEditingCar(null);
      setCarFormData({
        brand: '', make: '', model: '', year: '', price: '', dailyRate: '',
        purpose: 'sale', status: 'pending', isFeatured: false,
        ownerEmail: 'admin@ridemart.com', images: [], imageUrl: '',
        fuelType: 'Petrol', transmission: 'Manual', type: 'SUV',
        kmDriven: '', condition: 'Good', location: '', description: '', features: []
      });
    }
    setIsCarModalOpen(true);
  };

  const handleUserAction = async (userId, action, value) => {
    try {
      const userRef = doc(db, 'users', userId);
      if (action === 'delete') {
        if (window.confirm("Are you sure you want to delete this user?")) {
          await deleteDoc(userRef);
        }
      } else if (action === 'toggleVerify') {
        await updateDoc(userRef, { isVerified: value });
      } else if (action === 'status') {
        await updateDoc(userRef, { status: value });
      }
    } catch (err) {
      console.error("User Action Error:", err);
      alert(`Failed to perform action: ${err.message}. Check your Firestore rules or internet connection.`);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), userFormData);
        alert("User updated successfully!");
      } else {
        await addDoc(collection(db, 'users'), {
          ...userFormData,
          createdAt: serverTimestamp(),
          photoURL: `https://ui-avatars.com/api/?name=${userFormData.fullName}&background=random`
        });
        alert("New user created successfully!");
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      setUserFormData({ fullName: '', email: '', role: 'buyer', isVerified: false, status: 'active' });
    } catch (err) {
      console.error("Save User Error:", err);
      alert(`Error saving user: ${err.message}. Practical fix: Ensure your Firestore Rules allow the Admin to update other users.`);
    }
  };

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserFormData({
        fullName: user.fullName || user.displayName || '',
        email: user.email || '',
        role: user.role || 'buyer',
        isVerified: user.isVerified || false,
        status: user.status || 'active'
      });
    } else {
      setEditingUser(null);
      setUserFormData({ fullName: '', email: '', role: 'buyer', isVerified: false, status: 'active' });
    }
    setIsUserModalOpen(true);
  };

  const renderBookings = () => {
    const filteredBookings = bookingsList.filter(b =>
      (b.renterEmail?.toLowerCase().includes(bookingSearchQuery.toLowerCase()) ||
        b.carModel?.toLowerCase().includes(bookingSearchQuery.toLowerCase())) &&
      (bookingFilterStatus === 'all' || b.status === bookingFilterStatus)
    );

    return (
      <div className="management-view">
        <div className="controls-row">
          <div className="search-box-v5">
            <input type="text" placeholder="Search bookings..." value={bookingSearchQuery} onChange={(e) => setBookingSearchQuery(e.target.value)} />
          </div>
          <div className="filters-group-v5">
            <select value={bookingFilterStatus} onChange={(e) => setBookingFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="add-btn-v5" onClick={() => openBookingModal()}><FaPlus /> New Booking</button>
          </div>
        </div>
        <div className="data-table-container">
          <table className="v5-p-table">
            <thead><tr><th>Renter</th><th>Vehicle</th><th>Dates</th><th>Total</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b.id}>
                  <td>
                    <div className="user-cell">
                      <div>
                        <p className="u-name">{getUserName(b.userId, b.renterEmail)}</p>
                        <p className="u-email">{b.renterEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td>{b.carMake} {b.carModel}</td>
                  <td>{b.startDate} to {b.endDate}</td>
                  <td>₹{parseInt(b.totalPrice || 0).toLocaleString()}</td>
                  <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                  <td>
                    <span className={`status-badge ${b.paymentStatus === 'paid' ? 'active' : 'pending'}`}>{b.paymentStatus}</span>
                    {b.razorpayPaymentId && <p style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.7 }}>{b.razorpayPaymentId}</p>}
                  </td>
                  <td><div className="table-actions"><button className="action-icn edit" onClick={() => openBookingModal(b)}><FaEdit /></button><button className="action-icn delete" onClick={() => handleBookingAction(b.id, 'delete')}><FaTrash /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isBookingModalOpen && (
          <div className="modal-overlay-v5">
            <div className="modal-v5">
              <div className="modal-header-v5"><h2>{editingBooking ? 'Edit Booking' : 'Manual Booking'}</h2><button className="close-btn" onClick={() => setIsBookingModalOpen(false)}>×</button></div>
              <form onSubmit={handleSaveBooking} className="modal-form-v5">
                <div className="form-group-v5"><label>Renter Email</label><input type="email" required value={bookingFormData.renterEmail} onChange={(e) => setBookingFormData({ ...bookingFormData, renterEmail: e.target.value })} /></div>
                <div className="form-row-v5">
                  <div className="form-group-v5"><label>Car Make</label><input type="text" required value={bookingFormData.carMake} onChange={(e) => setBookingFormData({ ...bookingFormData, carMake: e.target.value })} /></div>
                  <div className="form-group-v5"><label>Car Model</label><input type="text" required value={bookingFormData.carModel} onChange={(e) => setBookingFormData({ ...bookingFormData, carModel: e.target.value })} /></div>
                </div>
                <div className="form-row-v5">
                  <div className="form-group-v5"><label>Start Date</label><input type="date" required value={bookingFormData.startDate} onChange={(e) => setBookingFormData({ ...bookingFormData, startDate: e.target.value })} /></div>
                  <div className="form-group-v5"><label>End Date</label><input type="date" required value={bookingFormData.endDate} onChange={(e) => setBookingFormData({ ...bookingFormData, endDate: e.target.value })} /></div>
                </div>
                <div className="form-row-v5">
                  <div className="form-group-v5"><label>Total Price</label><input type="number" required value={bookingFormData.totalPrice} onChange={(e) => setBookingFormData({ ...bookingFormData, totalPrice: e.target.value })} /></div>
                  <div className="form-group-v5"><label>Status</label>
                    <select value={bookingFormData.status} onChange={(e) => setBookingFormData({ ...bookingFormData, status: e.target.value })}>
                      <option value="pending">Pending</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer-v5"><button type="button" className="cancel-btn-v5" onClick={() => setIsBookingModalOpen(false)}>Cancel</button><button type="submit" className="save-btn-v5">Save Booking</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTransactions = () => {
    const filteredTrans = transactionsList.filter(t =>
      (t.customerEmail?.toLowerCase().includes(transSearchQuery.toLowerCase()) ||
        t.id?.toLowerCase().includes(transSearchQuery.toLowerCase())) &&
      (transFilterStatus === 'all' || t.status === transFilterStatus)
    );

    return (
      <div className="management-view">
        <div className="controls-row">
          <div className="search-box-v5">
            <input type="text" placeholder="Search transactions..." value={transSearchQuery} onChange={(e) => setTransSearchQuery(e.target.value)} />
          </div>
          <div className="filters-group-v5">
            <select value={transFilterStatus} onChange={(e) => setTransFilterStatus(e.target.value)}>
              <option value="all">All Status</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option>
            </select>
            <button className="add-btn-v5" onClick={() => openTransModal()}><FaPlus /> Record Sale</button>
          </div>
        </div>
        <div className="data-table-container">
          <table className="v5-p-table">
            <thead><tr><th>Transaction ID</th><th>Customer</th><th>Details</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredTrans.map(t => (
                <tr key={t.id}>
                  <td className="u-email">{t.id.slice(0, 10)}...</td>
                  <td>
                    <p className="u-name" style={{ fontWeight: 600 }}>{getUserName(t.userId, t.customerEmail)}</p>
                    <p className="u-email">{t.customerEmail}</p>
                  </td>
                  <td>{t.carDetails || 'N/A'}</td>
                  <td>₹{parseInt(t.amount || 0).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${t.status === 'completed' ? 'active' : (t.paymentStatus === 'success' || t.razorpayPaymentId ? 'active' : 'blocked')}`}>
                      {t.status}
                    </span>
                    {t.razorpayPaymentId && <p style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.7 }}>{t.razorpayPaymentId}</p>}
                  </td>
                  <td>{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Just now'}</td>
                  <td><div className="table-actions"><button className="action-icn edit" onClick={() => openTransModal(t)}><FaEdit /></button><button className="action-icn delete" onClick={() => handleTransAction(t.id, 'delete')}><FaTrash /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isTransModalOpen && (
          <div className="modal-overlay-v5">
            <div className="modal-v5">
              <div className="modal-header-v5"><h2>{editingTrans ? 'Edit Transaction' : 'Record New Transaction'}</h2><button className="close-btn" onClick={() => setIsTransModalOpen(false)}>×</button></div>
              <form onSubmit={handleSaveTrans} className="modal-form-v5">
                <div className="form-group-v5"><label>Customer Email</label><input type="email" required value={transFormData.customerEmail} onChange={(e) => setTransFormData({ ...transFormData, customerEmail: e.target.value })} /></div>
                <div className="form-group-v5"><label>Item / Details</label><input type="text" required value={transFormData.carDetails} onChange={(e) => setTransFormData({ ...transFormData, carDetails: e.target.value })} /></div>
                <div className="form-row-v5">
                  <div className="form-group-v5"><label>Amount (₹)</label><input type="number" required value={transFormData.amount} onChange={(e) => setTransFormData({ ...transFormData, amount: e.target.value })} /></div>
                  <div className="form-group-v5"><label>Status</label>
                    <select value={transFormData.status} onChange={(e) => setTransFormData({ ...transFormData, status: e.target.value })}>
                      <option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer-v5"><button type="button" className="cancel-btn-v5" onClick={() => setIsTransModalOpen(false)}>Cancel</button><button type="submit" className="save-btn-v5">Save Record</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Review Handlers
  const handleReviewAction = async (reviewId, action, value) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      if (action === 'delete') {
        if (window.confirm("Delete this review permanently?")) {
          await deleteDoc(reviewRef);
        }
      } else if (action === 'toggleApproval') {
        await updateDoc(reviewRef, { approved: value });
      }
    } catch (err) {
      console.error("Review Action Error:", err);
    }
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    try {
      if (editingReview) {
        await updateDoc(doc(db, 'reviews', editingReview.id), reviewFormData);
      }
      setIsReviewModalOpen(false);
      setEditingReview(null);
    } catch (err) {
      console.error("Save Review Error:", err);
    }
  };

  const openReviewModal = (review) => {
    setEditingReview(review);
    setReviewFormData({
      userName: review.userName || '',
      rating: review.rating || 5,
      title: review.title || '',
      review: review.review || '',
      approved: review.approved !== undefined ? review.approved : true
    });
    setIsReviewModalOpen(true);
  };

  // Settings Handlers
  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlatformSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'platform'), platformSettings);
      alert('✅ Platform settings saved successfully.');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Failed to save settings.');
    }
  };

  const handleResetAction = async (requestId, action, value) => {
    try {
      const requestRef = doc(db, 'password_reset_requests', requestId);
      if (action === 'delete') {
        if (window.confirm("Delete this reset request?")) {
          await deleteDoc(requestRef);
        }
      } else if (action === 'status') {
        await updateDoc(requestRef, { status: value });
      }
    } catch (err) {
      console.error("Reset Action Error:", err);
    }
  };

  const renderResetRequests = () => {
    const filteredRequests = resetRequests.filter(r =>
      (r.email?.toLowerCase().includes(resetSearchQuery.toLowerCase())) &&
      (resetFilterStatus === 'all' || r.status === resetFilterStatus)
    );

    return (
      <div className="management-view">
        <div className="controls-row">
          <div className="search-box-v5">
            <input type="text" placeholder="Search by email..." value={resetSearchQuery} onChange={(e) => setResetSearchQuery(e.target.value)} />
          </div>
          <div className="filters-group-v5">
            <select value={resetFilterStatus} onChange={(e) => setResetFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="alert-v5 info" style={{ margin: '1rem 0', background: 'rgba(66, 133, 244, 0.1)', color: '#4285f4', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(66,133,244,0.3)' }}>
          <FaKey style={{ marginRight: '0.5rem' }} />
          <strong>How to process:</strong> Client-side code cannot update other users' passwords for security. To fulfill a request:
          1. Copy the email. 2. Go to <strong>Firebase Console &gt; Authentication &gt; Users</strong>. 3. Search for the user.
          4. Click the three dots -&gt; <strong>Reset password</strong> or set it manually. 5. Mark as "Completed" here.
        </div>

        <div className="data-table-container">
          <table className="v5-p-table">
            <thead><tr><th>User Email</th><th>Requested New Password</th><th>Date Requested</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredRequests.map(r => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td><code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px' }}>{r.newPassword}</code></td>
                  <td>{r.requestedAt?.toDate ? r.requestedAt.toDate().toLocaleString() : 'Just now'}</td>
                  <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
                  <td>
                    <div className="table-actions">
                      {r.status === 'pending' && (
                        <button className="action-icn edit" title="Mark as Completed" onClick={() => handleResetAction(r.id, 'status', 'completed')}><FaCheck /></button>
                      )}
                      <button className="action-icn delete" title="Delete Request" onClick={() => handleResetAction(r.id, 'delete')}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No reset requests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPayments = () => {
    const filteredPayments = paymentsList.filter(p =>
      (p.paymentId?.toLowerCase().includes(paymentsSearchQuery.toLowerCase())) ||
      (p.userEmail?.toLowerCase().includes(paymentsSearchQuery.toLowerCase())) ||
      (p.userId?.toLowerCase().includes(paymentsSearchQuery.toLowerCase()))
    );

    return (
      <div className="management-view">
        <div className="controls-row">
          <div className="search-box-v5">
            <input type="text" placeholder="Search by payment ID or email..." value={paymentsSearchQuery} onChange={(e) => setPaymentsSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="data-table-container">
          <table className="v5-p-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order/Booking ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr key={p.id}>
                  <td className="u-email" style={{ color: 'var(--primary-light)' }}>{p.paymentId || p.razorpayPaymentId}</td>
                  <td className="u-email">{p.orderId || p.bookingId}</td>
                  <td>
                    <p className="u-name" style={{ fontWeight: 600 }}>{getUserName(p.userId, p.userEmail)}</p>
                    <p className="u-email" style={{ fontSize: '0.75rem', opacity: 0.7 }}>{p.userEmail || `ID: ${p.userId?.slice(0, 8)}`}</p>
                  </td>
                  <td><p className="price-v5">₹{parseInt(p.amount || 0).toLocaleString()}</p></td>
                  <td><span className={`status-badge ${p.paymentStatus === 'success' ? 'active' : 'pending'}`}>{p.paymentStatus}</span></td>
                  <td>{p.timestamp?.toDate ? p.timestamp.toDate().toLocaleString() : 'Just now'}</td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No payment records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="management-view">
      <div className="controls-row">
        <div className="filters-group-v5">
          {['general', 'financial', 'security', 'maintenance'].map(tab => (
            <button
              key={tab}
              className={`tab-btn`}
              onClick={() => setActiveSettingsTab(tab)}
              style={{
                padding: '0.6rem 1.2rem',
                background: activeSettingsTab === tab ? 'var(--primary)' : 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer',
                marginRight: '0.5rem',
                fontWeight: activeSettingsTab === tab ? '700' : '500',
                textTransform: 'capitalize'
              }}
            >
              {tab} Settings
            </button>
          ))}
        </div>
        <button className="save-btn-v5" onClick={saveSettings}>Save Changes</button>
      </div>

      <div className="settings-container" style={{ background: 'var(--bg-surface)', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '900px' }}>

        {activeSettingsTab === 'general' && (
          <div className="settings-section">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-white)' }}>General Configuration</h3>
            <div className="form-row-v5">
              <div className="form-group-v5"><label>Platform Name</label><input type="text" name="siteName" value={platformSettings.siteName} onChange={handleSettingChange} /></div>
              <div className="form-group-v5"><label>Support Email</label><input type="email" name="supportEmail" value={platformSettings.supportEmail} onChange={handleSettingChange} /></div>
            </div>
            <div className="form-group-v5"><label>Homepage Banner Message</label><input type="text" name="bannerMessage" value={platformSettings.bannerMessage} onChange={handleSettingChange} /></div>

            <h3 style={{ margin: '2.5rem 0 1.5rem', color: 'var(--text-white)' }}>Feature Toggles</h3>
            <div className="checkbox-group-v5" style={{ marginBottom: '1rem' }}><input type="checkbox" id="maintenance" name="maintenanceMode" checked={platformSettings.maintenanceMode} onChange={handleSettingChange} /><label htmlFor="maintenance">Enable Maintenance Mode (Blocks user access)</label></div>
            <div className="checkbox-group-v5"><input type="checkbox" id="registrations" name="allowRegistrations" checked={platformSettings.allowRegistrations} onChange={handleSettingChange} /><label htmlFor="registrations">Allow New User Registrations</label></div>
          </div>
        )}

        {activeSettingsTab === 'financial' && (
          <div className="settings-section">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-white)' }}>Commission & Fees</h3>
            <div className="form-row-v5">
              <div className="form-group-v5"><label>Sales Commission (%)</label><input type="number" name="commissionSale" value={platformSettings.commissionSale} onChange={handleSettingChange} /></div>
              <div className="form-group-v5"><label>Rental Commission (%)</label><input type="number" name="commissionRent" value={platformSettings.commissionRent} onChange={handleSettingChange} /></div>
            </div>
            <div className="form-group-v5"><label>Currency</label><select name="currency" value={platformSettings.currency} onChange={handleSettingChange}><option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option></select></div>

            <h3 style={{ margin: '2.5rem 0 1.5rem', color: 'var(--text-white)' }}>Payment Gateways</h3>
            <div className="form-group-v5"><label>Stripe Public Key</label><input type="password" name="stripeKey" value={platformSettings.stripeKey} onChange={handleSettingChange} /></div>
          </div>
        )}

        {activeSettingsTab === 'security' && (
          <div className="settings-section">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-white)' }}>Security Policies</h3>
            <div className="checkbox-group-v5" style={{ marginBottom: '1rem' }}><input type="checkbox" id="verification" name="requireVerification" checked={platformSettings.requireVerification} onChange={handleSettingChange} /><label htmlFor="verification">Require Identity Verification for Sellers</label></div>

            <h3 style={{ margin: '2.5rem 0 1rem', color: 'var(--text-white)' }}>Admin Management</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Manage users with administrative privileges in the Users tab.</p>
            <button className="add-btn-v5" onClick={() => setView('users')} style={{ display: 'inline-flex', width: 'auto' }}>Manage Admins</button>
          </div>
        )}

        {activeSettingsTab === 'maintenance' && (
          <div className="settings-section">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-white)' }}>Database Maintenance</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Repair data consistency and sync user names across collections.</p>

            <div className="alert-v5 info" style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
              <strong>Sync User Names:</strong> This utility will scan your Payments, Bookings, and Orders. For each record, it will find the corresponding user and update the record with their current Full Name.
            </div>

            <button
              className="add-btn-v5"
              onClick={handleSyncNames}
              disabled={isSeeding}
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', width: 'auto' }}
            >
              {isSeeding ? '⏳ Processing...' : '🔄 Sync Missing User Names'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Support & Notification Handlers
  const handleResolveTicket = async (ticketId) => {
    if (window.confirm('Mark this ticket as resolved?')) {
      await updateDoc(doc(db, 'tickets', ticketId), { status: 'resolved' });
      if (selectedTicket?.id === ticketId) setSelectedTicket(null);
    }
  };

  const handleTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReply.trim() || !selectedTicket) return;

    const newResponse = {
      sender: 'admin',
      message: ticketReply,
      timestamp: new Date()
    };

    const ticketRef = doc(db, 'tickets', selectedTicket.id);
    // Assuming 'responses' is an array field
    const currentResponses = selectedTicket.responses || [];
    await updateDoc(ticketRef, {
      responses: [...currentResponses, newResponse],
      status: 'active' // Re-open if pending
    });

    setTicketReply('');
    // Update local selected ticket state immediately for UI responsiveness (though onSnapshot will catch it)
    setSelectedTicket(prev => ({ ...prev, responses: [...(prev.responses || []), newResponse] }));
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'announcements'), {
        ...announcementFormData,
        createdAt: new Date(),
        sender: 'Admin System'
      });
      setIsAnnouncementModalOpen(false);
      setAnnouncementFormData({ title: '', message: '', target: 'all', type: 'info' });
      alert('Announcement sent successfully!');
    } catch (err) {
      console.error("Announcement Error:", err);
    }
  };

  const renderSupport = () => {
    const filteredTickets = ticketsList.filter(t => ticketFilter === 'all' || t.status === ticketFilter);

    return (
      <div className="management-view">
        <div className="dashboard-row-2">
          {/* Tickets Section */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="controls-row">
              <div className="filters-group-v5">
                <button className={`tab-btn ${ticketFilter === 'open' ? 'active' : ''}`} onClick={() => setTicketFilter('open')} style={{ padding: '0.5rem 1rem', background: ticketFilter === 'open' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', cursor: 'pointer', marginRight: '0.5rem' }}>Open Tickets</button>
                <button className={`tab-btn ${ticketFilter === 'resolved' ? 'active' : ''}`} onClick={() => setTicketFilter('resolved')} style={{ padding: '0.5rem 1rem', background: ticketFilter === 'resolved' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', cursor: 'pointer', marginRight: '0.5rem' }}>Resolved</button>
                <button className={`tab-btn ${ticketFilter === 'all' ? 'active' : ''}`} onClick={() => setTicketFilter('all')} style={{ padding: '0.5rem 1rem', background: ticketFilter === 'all' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>All History</button>
              </div>
              <button className="add-btn-v5" onClick={() => setIsAnnouncementModalOpen(true)}><FaBullhorn /> New Announcement</button>
            </div>

            <div className="data-table-container">
              <table className="v5-p-table">
                <thead><tr><th>Subject</th><th>User</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredTickets.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tickets found</td></tr> :
                    filteredTickets.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: '600' }}>{t.subject}</td>
                        <td className="u-email">{t.userEmail}</td>
                        <td><span className={`status-badge ${t.status === 'resolved' ? 'active' : 'pending'}`}>{t.status}</span></td>
                        <td>{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Recent'}</td>
                        <td><button className="action-icn edit" onClick={() => setSelectedTicket(t)}><FaPaperPlane /></button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="modal-overlay-v5">
            <div className="modal-v5">
              <div className="modal-header-v5"><h2>Ticket: {selectedTicket.subject}</h2><button className="close-btn" onClick={() => setSelectedTicket(null)}>×</button></div>
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>From: {selectedTicket.userEmail}</p>
                  <p>{selectedTicket.message}</p>
                </div>
                {(selectedTicket.responses || []).map((r, i) => (
                  <div key={i} style={{ marginBottom: '0.5rem', textAlign: r.sender === 'admin' ? 'right' : 'left' }}>
                    <span style={{ background: r.sender === 'admin' ? 'var(--primary)' : 'var(--bg-surface)', padding: '0.5rem 1rem', borderRadius: '12px', display: 'inline-block', fontSize: '0.9rem' }}>{r.message}</span>
                  </div>
                ))}
              </div>
              {selectedTicket.status !== 'resolved' ? (
                <form onSubmit={handleTicketReply} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" value={ticketReply} onChange={(e) => setTicketReply(e.target.value)} placeholder="Type a reply..." style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'white' }} />
                  <button type="submit" className="save-btn-v5"><FaPaperPlane /></button>
                  <button type="button" className="cancel-btn-v5" onClick={() => handleResolveTicket(selectedTicket.id)} style={{ background: '#10b981', color: 'white' }}>Resolve</button>
                </form>
              ) : <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>This ticket is resolved</div>}
            </div>
          </div>
        )}

        {/* Announcement Modal */}
        {isAnnouncementModalOpen && (
          <div className="modal-overlay-v5">
            <div className="modal-v5">
              <div className="modal-header-v5"><h2>Create Announcement</h2><button className="close-btn" onClick={() => setIsAnnouncementModalOpen(false)}>×</button></div>
              <form onSubmit={handleSendAnnouncement} className="modal-form-v5">
                <div className="form-group-v5"><label>Title</label><input type="text" required value={announcementFormData.title} onChange={(e) => setAnnouncementFormData({ ...announcementFormData, title: e.target.value })} /></div>
                <div className="form-group-v5"><label>Message</label><textarea required rows="4" value={announcementFormData.message} onChange={(e) => setAnnouncementFormData({ ...announcementFormData, message: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'white' }}></textarea></div>
                <div className="form-row-v5">
                  <div className="form-group-v5"><label>Target Audience</label>
                    <select value={announcementFormData.target} onChange={(e) => setAnnouncementFormData({ ...announcementFormData, target: e.target.value })}>
                      <option value="all">All Users</option><option value="buyers">Buyers Only</option><option value="sellers">Sellers Only</option>
                    </select>
                  </div>
                  <div className="form-group-v5"><label>Type</label>
                    <select value={announcementFormData.type} onChange={(e) => setAnnouncementFormData({ ...announcementFormData, type: e.target.value })}>
                      <option value="info">Info</option><option value="alert">Alert</option><option value="promo">Promo</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer-v5"><button type="button" className="cancel-btn-v5" onClick={() => setIsAnnouncementModalOpen(false)}>Cancel</button><button type="submit" className="save-btn-v5">Broadcast</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReviews = () => {
    const filteredReviews = reviewsList.filter(r =>
    (r.userName?.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
      r.review?.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
      r.title?.toLowerCase().includes(reviewSearchQuery.toLowerCase()))
    );

    return (
      <div className="management-view">
        <div className="controls-row">
          <div className="search-box-v5">
            <input type="text" placeholder="Search reviews..." value={reviewSearchQuery} onChange={(e) => setReviewSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="data-table-container">
          <table className="v5-p-table">
            <thead><tr><th>User</th><th>Rating</th><th>Content</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredReviews.map(r => (
                <tr key={r.id}>
                  <td><div className="user-cell"><div style={{ width: 30, height: 30, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontWeight: 'bold' }}>{r.userName?.[0]}</div><div><p className="u-name">{r.userName || 'Anonymous'}</p><p className="u-email">{r.userEmail}</p></div></div></td>
                  <td><div style={{ color: '#fbbf24', display: 'flex' }}>{[...Array(5)].map((_, i) => <FaStar key={i} style={{ opacity: i < r.rating ? 1 : 0.3 }} />)}</div></td>
                  <td style={{ maxWidth: '300px' }}><strong>{r.title}</strong><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.review}</p></td>
                  <td><button className={`verify-toggle ${r.approved ? 'verified' : 'pending'}`} onClick={() => handleReviewAction(r.id, 'toggleApproval', !r.approved)}>{r.approved ? <><FaCheck /> Approved</> : 'Pending'}</button></td>
                  <td><div className="table-actions"><button className="action-icn edit" onClick={() => openReviewModal(r)}><FaEdit /></button><button className="action-icn delete" onClick={() => handleReviewAction(r.id, 'delete')}><FaTrash /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isReviewModalOpen && (
          <div className="modal-overlay-v5">
            <div className="modal-v5">
              <div className="modal-header-v5"><h2>Edit Review</h2><button className="close-btn" onClick={() => setIsReviewModalOpen(false)}>×</button></div>
              <form onSubmit={handleSaveReview} className="modal-form-v5">
                <div className="form-group-v5"><label>User Name</label><input type="text" value={reviewFormData.userName} disabled style={{ opacity: 0.7 }} /></div>
                <div className="form-group-v5"><label>Rating</label>
                  <select value={reviewFormData.rating} onChange={(e) => setReviewFormData({ ...reviewFormData, rating: parseInt(e.target.value) })}>
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
                <div className="form-group-v5"><label>Title</label><input type="text" value={reviewFormData.title} onChange={(e) => setReviewFormData({ ...reviewFormData, title: e.target.value })} /></div>
                <div className="form-group-v5"><label>Review</label>
                  <textarea
                    value={reviewFormData.review}
                    onChange={(e) => setReviewFormData({ ...reviewFormData, review: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.8rem', borderRadius: '12px', color: 'var(--text-white)', minHeight: '100px' }}
                  />
                </div>
                <div className="checkbox-group-v5">
                  <input type="checkbox" id="is-approved" checked={reviewFormData.approved} onChange={(e) => setReviewFormData({ ...reviewFormData, approved: e.target.checked })} />
                  <label htmlFor="is-approved">Approved</label>
                </div>
                <div className="modal-footer-v5">
                  <button type="button" className="cancel-btn-v5" onClick={() => setIsReviewModalOpen(false)}>Cancel</button>
                  <button type="submit" className="save-btn-v5">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    // ... [same as before or slightly shortened for brevity in this tool call]
    <div className="overview-tab">
      <div className="stats-grid-dashboard">
        <div className="stat-v5-card">
          <div className="stat-v5-icon user"><FaUsers /></div>
          <div className="stat-v5-info">
            <span className="stat-v5-label">Total Users</span>
            <h3 className="stat-v5-value">{stats.users}</h3>
            <span className="stat-v5-trend up"><FaArrowUp /> 12% growth</span>
          </div>
        </div>
        <div className="stat-v5-card">
          <div className="stat-v5-icon car"><FaCar /></div>
          <div className="stat-v5-info">
            <span className="stat-v5-label">Active Listings</span>
            <h3 className="stat-v5-value">{stats.cars}</h3>
            <span className="stat-v5-trend up"><FaArrowUp /> 8% month</span>
          </div>
        </div>
        <div className="stat-v5-card">
          <div className="stat-v5-icon wallet"><FaWallet /></div>
          <div className="stat-v5-info">
            <span className="stat-v5-label">Revenue</span>
            <h3 className="stat-v5-value">₹{stats.revenue.toLocaleString()}</h3>
            <span className="stat-v5-trend up"><FaArrowUp /> 24% week</span>
          </div>
        </div>
        <div className="stat-v5-card">
          <div className="stat-v5-icon booking"><FaClipboardList /></div>
          <div className="stat-v5-info">
            <span className="stat-v5-label">Bookings</span>
            <h3 className="stat-v5-value">{stats.orders}</h3>
            <span className="stat-v5-trend down"><FaArrowDown /> 3% day</span>
          </div>
        </div>
      </div>

      <div className="dashboard-row-2">
        <div className="insight-card activity-feed">
          <div className="card-header-v5">
            <h3><FaHistory /> Recent Activity</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activity-list">
            {recentActivity.length > 0 ? recentActivity.map(act => (
              <div key={act.id} className="activity-item-v5">
                <div className="act-icon">{act.icon}</div>
                <div className="act-details">
                  <p className="act-title">{act.title}</p>
                  <p className="act-subtitle">{act.subtitle}</p>
                </div>
                <span className="act-time">{act.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )) : <p className="empty-msg">No recent activity</p>}
          </div>
        </div>

        <div className="insight-card details-split">
          <h3>Marketplace Split</h3>
          <div className="split-items">
            <div className="split-item">
              <div className="split-info"><span>Rentals</span><span>{stats.rentals}</span></div>
              <div className="split-bar"><div className="fill" style={{ width: `${(stats.rentals / stats.cars) * 100}%` }}></div></div>
            </div>
            <div className="split-item">
              <div className="split-info"><span>Sales</span><span>{stats.sales}</span></div>
              <div className="split-bar"><div className="fill" style={{ width: `${(stats.sales / stats.cars) * 100}%`, backgroundColor: '#ff6b6b' }}></div></div>
            </div>
          </div>
          <div className="quick-actions-v5">
            <h3>Quick Actions</h3>
            <div className="action-grid">
              <button className="q-action" onClick={() => setView('listings')}><FaPlus /> Add Car</button>
              <button className="q-action" onClick={() => setView('users')}><FaUsers /> Manage Users</button>
              <button className="q-action" onClick={() => setView('reviews')}><FaStar /> Reviews</button>
              <button className="q-action"><FaWallet /> Payouts</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    const filteredUsers = usersList.filter(u =>
      (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterRole === 'all' || u.role === filterRole)
    );

    return (
      <div className="management-view">
        <div className="controls-row">
          <div className="search-box-v5">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filters-group-v5">
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Standard Users</option>
              <option value="seller">Sellers</option>
              <option value="buyer">Buyers</option>
              <option value="renter">Renters</option>
            </select>
            <button className="add-btn-v5" onClick={() => openUserModal()}><FaPlus /> Add User</button>
          </div>
        </div>

        <div className="data-table-container">
          <table className="v5-p-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}&background=000&color=fff`} alt="" />
                      <div>
                        <p className="u-name">{u.fullName || u.displayName || 'Unnamed User'}</p>
                        <p className="u-email">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                  <td><span className={`status-badge ${u.status || 'active'}`}>{u.status || 'Active'}</span></td>
                  <td>
                    <button
                      className={`verify-toggle ${u.isVerified ? 'verified' : 'pending'}`}
                      onClick={() => handleUserAction(u.id, 'toggleVerify', !u.isVerified)}
                    >
                      {u.isVerified ? <><FaCheck /> Verified</> : 'Unverified'}
                    </button>
                    {u.verificationDocs && (
                      <button
                        className="action-icn info"
                        style={{ marginLeft: '8px', color: 'var(--primary)', padding: '5px' }}
                        onClick={() => setActiveDocs({
                          title: `Verification Docs: ${u.fullName || u.email}`,
                          docs: u.verificationDocs
                        })}
                        title="View Identification Documents"
                      >
                        <FaFileAlt />
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="action-icn edit" onClick={() => openUserModal(u)}><FaEdit /></button>
                      <button className="action-icn delete" onClick={() => handleUserAction(u.id, 'delete')}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── User Modal ── */}
        {isUserModalOpen && (
          <div className="modal-overlay-v5">
            <div className="modal-v5">
              <div className="modal-header-v5">
                <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                <button className="close-btn" onClick={() => setIsUserModalOpen(false)}>×</button>
              </div>
              <form onSubmit={handleSaveUser} className="modal-form-v5">
                <div className="form-group-v5">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={userFormData.fullName}
                    onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group-v5">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    readOnly={!!editingUser}
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  />
                </div>
                <div className="form-row-v5">
                  <div className="form-group-v5">
                    <label>Role</label>
                    <select value={userFormData.role} onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}>
                      <option value="user">Standard User</option>
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="renter">Renter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group-v5">
                    <label>Status</label>
                    <select value={userFormData.status} onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-group-v5">
                  <input
                    type="checkbox"
                    id="is-verified"
                    checked={userFormData.isVerified}
                    onChange={(e) => setUserFormData({ ...userFormData, isVerified: e.target.checked })}
                  />
                  <label htmlFor="is-verified">Mark as Verified User</label>
                </div>
                <div className="modal-footer-v5">
                  <button type="button" className="cancel-btn-v5" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                  <button type="submit" className="save-btn-v5">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---- Seed Handler -----------------------------------------
  const handleSeedDatabase = async () => {
    if (!window.confirm('This will upload 100+ sample Indian cars to Firestore. Proceed?')) return;
    setIsSeeding(true);
    setSeedStatus('Generating seed data...');
    try {
      const seedCars = generateSeedData();
      const batchSize = 450; // Firestore batch limit is 500 ops
      let uploaded = 0;
      for (let i = 0; i < seedCars.length; i += batchSize) {
        const chunk = seedCars.slice(i, i + batchSize);
        const batch = writeBatch(db);
        chunk.forEach(car => {
          const ref = doc(collection(db, 'cars'));
          batch.set(ref, { ...car, createdAt: new Date() });
        });
        await batch.commit();
        uploaded += chunk.length;
        setSeedStatus(`Uploading... ${uploaded}/${seedCars.length} cars`);
      }
      setSeedStatus(`✅ ${uploaded} cars seeded successfully!`);
      setTimeout(() => setSeedStatus(''), 4000);
    } catch (err) {
      console.error('Seed error:', err);
      setSeedStatus(`❌ Error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // ---- API Ninjas Lookup ------------------------------------
  const handleApiLookup = async () => {
    if (!carFormData.brand && !carFormData.make) {
      alert('Enter Make/Brand first.'); return;
    }
    try {
      setSeedStatus('🔍 Looking up specs...');
      const results = await searchCarsAPI({
        make: carFormData.brand || carFormData.make,
        model: carFormData.model,
        year: carFormData.year || undefined,
        limit: 1
      });
      if (results.length === 0) {
        setSeedStatus('No specs found. Try a different make/model.'); return;
      }
      const mapped = mapApiSpecToFormFields(results[0]);
      setCarFormData(prev => ({ ...prev, ...mapped }));
      setSeedStatus('✅ Specs auto-filled from API!');
      setTimeout(() => setSeedStatus(''), 3000);
    } catch (err) {
      setSeedStatus(`❌ API Error: ${err.message}`);
    }
  };

  // ---- Fix Images Handler (repairs already-seeded docs) --------
  const handleFixImages = async () => {
    if (!window.confirm('This will update imageUrl on ALL cars in Firestore with model-accurate photos. Proceed?')) return;
    setIsSeeding(true);
    setSeedStatus('🔄 Reading cars from Firestore...');
    try {
      const snapshot = await getDocs(collection(db, 'cars'));
      const batchSize = 450;
      const docs = snapshot.docs;
      let fixed = 0;
      for (let i = 0; i < docs.length; i += batchSize) {
        const chunk = docs.slice(i, i + batchSize);
        const batch = writeBatch(db);
        for (const d of chunk) {
          const data = d.data();
          const [img1, img2] = getCarImages(data.model, data.type);
          batch.update(doc(db, 'cars', d.id), {
            imageUrl: img1,
            images: [img1, img2],
          });
          fixed++;
        }
        await batch.commit();
        setSeedStatus(`🔄 Fixing images... ${Math.min(i + batchSize, docs.length)}/${docs.length}`);
      }
      setSeedStatus(`✅ Updated images on ${fixed} cars successfully!`);
      setTimeout(() => setSeedStatus(''), 4000);
    } catch (err) {
      console.error('Fix images error:', err);
      setSeedStatus(`❌ Error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const renderFleet = () => {
    const filteredFleet = fleetList.filter(c => {
      const q = carSearchQuery.toLowerCase();
      const matchSearch = !q ||
        c.make?.toLowerCase().includes(q) || c.model?.toLowerCase().includes(q) ||
        c.brand?.toLowerCase().includes(q);
      const matchType = carFilterType === 'all' || c.purpose === carFilterType;
      return matchSearch && matchType;
    });

    return (
      <div className="management-view">
        {seedStatus && (
          <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: seedStatus.startsWith('✅') ? 'rgba(16,185,129,0.1)' : seedStatus.startsWith('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${seedStatus.startsWith('✅') ? '#10b981' : seedStatus.startsWith('❌') ? '#ef4444' : '#3b82f6'}`, borderRadius: '10px', color: 'white', fontSize: '0.9rem' }}>
            {seedStatus}
          </div>
        )}
        <div className="controls-row">
          <div className="search-box-v5">
            <input
              type="text"
              placeholder="Search vehicles..."
              value={carSearchQuery}
              onChange={(e) => setCarSearchQuery(e.target.value)}
            />
          </div>
          <div className="filters-group-v5">
            <select value={carFilterType} onChange={(e) => setCarFilterType(e.target.value)}>
              <option value="all">All Fleet</option>
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
            <button
              className="add-btn-v5"
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', marginRight: '0.5rem' }}
            >
              {isSeeding ? '⏳ Working...' : '🚀 Seed 100 Cars'}
            </button>
            <button
              className="add-btn-v5"
              onClick={handleFixImages}
              disabled={isSeeding}
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', marginRight: '0.5rem' }}
            >
              🔧 Fix Images
            </button>
            <button className="add-btn-v5" onClick={() => openCarModal()}><FaPlus /> List Vehicle</button>
          </div>
        </div>

        <div className="data-table-container">
          <table className="v5-p-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFleet.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="user-cell">
                      <img src={c.imageUrl || c.images?.[0] || 'https://via.placeholder.com/150'} alt="" className="v-thumb" />
                      <div>
                        <p className="u-name">{c.brand || c.make} {c.model}</p>
                        <p className="u-email">{c.year} • {c.fuelType || ''} • {c.location || c.ownerEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`type-badge ${c.purpose}`}>{c.purpose}</span></td>
                  <td>
                    <select
                      className={`status-select-v5 ${c.status}`}
                      value={c.status}
                      onChange={(e) => handleCarAction(c.id, 'status', e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className={`featured-toggle ${c.isFeatured ? 'active' : ''}`}
                      onClick={() => handleCarAction(c.id, 'toggleFeatured', !c.isFeatured)}
                    >
                      <FaStar /> {c.isFeatured ? 'Featured' : 'Standard'}
                    </button>
                  </td>
                  <td><p className="price-v5">₹{parseInt(c.price || c.dailyRate || 0).toLocaleString()}{c.purpose === 'rent' ? '/day' : ''}</p></td>
                  <td>
                    <div className="table-actions">
                      {c.publicDocs && Object.keys(c.publicDocs).length > 0 && (
                        <button
                          className="action-icn info"
                          onClick={() => setActiveDocs({
                            title: `Vehicle Documents: ${c.brand || c.make} ${c.model}`,
                            docs: c.publicDocs
                          })}
                          title="View Vehicle Documents (RC, Insurance, etc.)"
                          style={{ color: '#60a5fa' }}
                        >
                          <FaFileAlt />
                        </button>
                      )}
                      <button className="action-icn edit" onClick={() => openCarModal(c)}><FaEdit /></button>
                      <button className="action-icn delete" onClick={() => handleCarAction(c.id, 'delete')}><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Car Modal ── */}
        {isCarModalOpen && (
          <div className="modal-overlay-v5">
            <div className="modal-v5 wide">
              <div className="modal-header-v5">
                <h2>{editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
                <button className="close-btn" onClick={() => setIsCarModalOpen(false)}>×</button>
              </div>
              <form onSubmit={handleSaveCar} className="modal-form-v5">
                {/* API Lookup Row */}
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#93c5fd', fontSize: '0.85rem', flex: 1 }}>🔍 Enter Make + Model + Year below, then click Lookup to auto-fill specs via API Ninjas</span>
                  <button type="button" onClick={handleApiLookup} style={{ padding: '0.5rem 1.2rem', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    ⚡ Lookup Specs
                  </button>
                </div>

                <div className="form-row-v5">
                  <div className="form-group-v5">
                    <label>Brand / Make</label>
                    <input type="text" required placeholder="e.g. Maruti" value={carFormData.brand || carFormData.make} onChange={(e) => setCarFormData({ ...carFormData, brand: e.target.value, make: e.target.value })} />
                  </div>
                  <div className="form-group-v5">
                    <label>Model</label>
                    <input type="text" required placeholder="e.g. Swift" value={carFormData.model} onChange={(e) => setCarFormData({ ...carFormData, model: e.target.value })} />
                  </div>
                </div>
                <div className="form-row-v5">
                  <div className="form-group-v5">
                    <label>Year</label>
                    <input type="number" required placeholder="2022" value={carFormData.year} onChange={(e) => setCarFormData({ ...carFormData, year: e.target.value })} />
                  </div>
                  <div className="form-group-v5">
                    <label>Body Type</label>
                    <select value={carFormData.type} onChange={(e) => setCarFormData({ ...carFormData, type: e.target.value })}>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="MUV/MPV">MUV/MPV</option>
                      <option value="Coupe">Coupe</option>
                    </select>
                  </div>
                </div>
                <div className="form-row-v5">
                  <div className="form-group-v5">
                    <label>Fuel Type</label>
                    <select value={carFormData.fuelType} onChange={(e) => setCarFormData({ ...carFormData, fuelType: e.target.value })}>
                      <option>Petrol</option><option>Diesel</option>
                      <option>CNG</option><option>Electric</option><option>Hybrid</option>
                    </select>
                  </div>
                  <div className="form-group-v5">
                    <label>Transmission</label>
                    <select value={carFormData.transmission} onChange={(e) => setCarFormData({ ...carFormData, transmission: e.target.value })}>
                      <option>Manual</option><option>Automatic</option>
                    </select>
                  </div>
                </div>
                <div className="form-row-v5">
                  <div className="form-group-v5">
                    <label>Sale Price (₹) <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>— leave 0 for rental</span></label>
                    <input type="number" value={carFormData.price} onChange={(e) => setCarFormData({ ...carFormData, price: e.target.value })} />
                  </div>
                  <div className="form-group-v5">
                    <label>Daily Rate (₹/day) <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>— leave 0 for sale</span></label>
                    <input type="number" value={carFormData.dailyRate} onChange={(e) => setCarFormData({ ...carFormData, dailyRate: e.target.value })} />
                  </div>
                </div>
                <div className="form-row-v5">
                  <div className="form-group-v5">
                    <label>KM Driven</label>
                    <input type="number" placeholder="45000" value={carFormData.kmDriven} onChange={(e) => setCarFormData({ ...carFormData, kmDriven: e.target.value })} />
                  </div>
                  <div className="form-group-v5">
                    <label>Condition</label>
                    <select value={carFormData.condition} onChange={(e) => setCarFormData({ ...carFormData, condition: e.target.value })}>
                      <option>Excellent</option><option>Good</option><option>Fair</option>
                    </select>
                  </div>
                </div>
                <div className="form-row-v5">
                  <div className="form-group-v5">
                    <label>Location / City</label>
                    <input type="text" placeholder="Mumbai" value={carFormData.location} onChange={(e) => setCarFormData({ ...carFormData, location: e.target.value })} />
                  </div>
                  <div className="form-group-v5">
                    <label>Image URL</label>
                    <input type="url" placeholder="https://..." value={carFormData.imageUrl} onChange={(e) => setCarFormData({ ...carFormData, imageUrl: e.target.value, images: e.target.value ? [e.target.value] : [] })} />
                  </div>
                </div>
                <div className="form-group-v5">
                  <label>Description</label>
                  <textarea rows="3" placeholder="Brief vehicle description..." value={carFormData.description} onChange={(e) => setCarFormData({ ...carFormData, description: e.target.value })} style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.8rem', borderRadius: '12px', color: 'var(--text-white)', resize: 'vertical' }} />
                </div>
                <div className="form-row-v5">
                  <div className="form-group-v5">
                    <label>Category</label>
                    <select value={carFormData.purpose} onChange={(e) => setCarFormData({ ...carFormData, purpose: e.target.value })}>
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                    </select>
                  </div>
                  <div className="form-group-v5">
                    <label>Listing Status</label>
                    <select value={carFormData.status} onChange={(e) => setCarFormData({ ...carFormData, status: e.target.value })}>
                      <option value="pending">Pending</option>
                      <option value="active">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                <div className="checkbox-group-v5">
                  <input type="checkbox" id="is-featured" checked={carFormData.isFeatured} onChange={(e) => setCarFormData({ ...carFormData, isFeatured: e.target.checked })} />
                  <label htmlFor="is-featured">Feature this vehicle on homepage</label>
                </div>
                <div className="modal-footer-v5">
                  <button type="button" className="cancel-btn-v5" onClick={() => setIsCarModalOpen(false)}>Cancel</button>
                  <button type="submit" className="save-btn-v5">Deploy Listing</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-command-center">
      <div className="admin-shell">
        {/* ── Persistent Sidebar ── */}
        <aside className="admin-nav-v5">
          <div className="nav-brand">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none', color: 'inherit' }}>
              <img src="/logo-brand.png" alt="RideMart" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, letterSpacing: '2px', fontSize: '1.2rem', margin: 0 }}>RIDEMART</h2>
            </Link>
          </div>
          <nav className="nav-menu-v5">
            <div className={`nav-link-v5 ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')}>
              <FaChartLine /> <span>Overview</span>
            </div>
            <div className={`nav-link-v5 ${view === 'users' ? 'active' : ''}`} onClick={() => setView('users')}>
              <FaUsers /> <span>Users</span>
            </div>
            <div className={`nav-link-v5 ${view === 'listings' ? 'active' : ''}`} onClick={() => setView('listings')}>
              <FaCar /> <span>Fleet</span>
            </div>
            <div className={`nav-link-v5 ${view === 'orders' ? 'active' : ''}`} onClick={() => setView('orders')}>
              <FaClipboardList /> <span>Bookings</span>
            </div>
            <div className={`nav-link-v5 ${view === 'transactions' ? 'active' : ''}`} onClick={() => setView('transactions')}>
              <FaWallet /> <span>Sales</span>
            </div>
            <div className={`nav-link-v5 ${view === 'payments' ? 'active' : ''}`} onClick={() => setView('payments')}>
              <FaCreditCard /> <span>Payments</span>
            </div>
            <div className={`nav-link-v5 ${view === 'analytics' ? 'active' : ''}`} onClick={() => setView('analytics')}>
              <FaPoll /> <span>Analytics</span>
            </div>
            <div className={`nav-link-v5 ${view === 'reviews' ? 'active' : ''}`} onClick={() => setView('reviews')}>
              <FaStar /> <span>Reviews</span>
            </div>
            <div className={`nav-link-v5 ${view === 'support' ? 'active' : ''}`} onClick={() => setView('support')}>
              <FaHeadset /> <span>Support</span>
            </div>
            <div className={`nav-link-v5 ${view === 'resets' ? 'active' : ''}`} onClick={() => setView('resets')}>
              <FaKey /> <span>Resets</span>
            </div>
            <div className={`nav-link-v5 ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
              <FaCog /> <span>Settings</span>
            </div>
          </nav>

          <div className="admin-profile-mini">
            <img src="https://ui-avatars.com/api/?name=Admin&background=c21807&color=fff" alt="Admin" />
            <div className="profile-info">
              <p className="p-name">System Admin</p>
              <p className="p-role">Superuser</p>
            </div>
          </div>
        </aside>

        {/* ── Main Canvas ── */}
        <main className="admin-main-canvas">
          <header className="canvas-header">
            <div className="header-left">
              <h1>Dashboard Overview</h1>
              <p>Real-time platform metrics and monitoring</p>
            </div>
            <div className="header-right">
              <div className="live-pill">
                <span className="pulse"></span> LIVE MONITOR
              </div>
            </div>
          </header>

          <div className="canvas-content">
            {view === 'overview' && renderOverview()}
            {view === 'users' && renderUsers()}
            {view === 'listings' && renderFleet()}
            {view === 'orders' && renderBookings()}
            {view === 'transactions' && renderTransactions()}
            {view === 'reviews' && renderReviews()}
            {view === 'support' && renderSupport()}
            {view === 'resets' && renderResetRequests()}
            {view === 'payments' && renderPayments()}
            {view === 'settings' && renderSettings()}

            {/* ── Document Viewer Modal ── */}
            {activeDocs && (
              <div className="modal-overlay-v5" style={{ zIndex: 2000 }}>
                <div className="modal-v5" style={{ maxWidth: '600px' }}>
                  <div className="modal-header-v5">
                    <h2>{activeDocs.title}</h2>
                    <button className="close-btn" onClick={() => setActiveDocs(null)}>×</button>
                  </div>
                  <div className="modal-body-v5" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Object.entries(activeDocs.docs).map(([key, url]) => {
                        if (key === 'status' || key === 'submittedAt') return null;
                        return (
                          <div key={key} style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <FaFileAlt style={{ color: 'var(--primary)', fontSize: '1.2rem' }} />
                              <span style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                {key.replace('Url', '')}
                              </span>
                            </div>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary"
                              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', textDecoration: 'none' }}
                            >
                              View / Download
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="modal-footer-v5">
                    <button className="save-btn-v5" onClick={() => setActiveDocs(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}

            {view === 'analytics' && (
              <Suspense fallback={
                <div className="loading-state" style={{ height: '100%', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner"></div><p>Loading Analytics...</p>
                </div>}>
                <AnalyticsDashboard users={usersList} cars={fleetList} rentals={bookingsList} orders={transactionsList} />
              </Suspense>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
