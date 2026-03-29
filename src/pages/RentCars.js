import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getCarImage } from '../utils/carImages';
import { FaUserFriends, FaCog, FaGasPump, FaCheckCircle, FaSearch, FaRedo, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import { getCurrentPosition, getCityFromCoords } from '../utils/locationUtils';
import './RentCars.css';

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kochi',
  'Chandigarh', 'Indore', 'Nagpur'
];

function RentCars() {
  const [allCars, setAllCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [rateRange, setRateRange] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => { fetchRentalCars(); }, []);

  useEffect(() => {
    filterCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedBrand, selectedFuel, selectedTransmission, selectedLocation, rateRange, selectedType, allCars]);

  const fetchRentalCars = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'cars'));
      // Get only rent-purpose cars from the unified 'cars' collection
      const cars = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        // STRICT FILTER: Only show cars intended for rent
        .filter(c => (c.purpose === 'rent' || c.listingPurpose === 'rent' || c.listingPurpose === 'both') && c.status !== 'rented');
      setAllCars(cars);
    } catch (error) {
      console.error('Error fetching rental cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = async () => {
    try {
      setLocating(true);
      const coords = await getCurrentPosition();
      const city = await getCityFromCoords(coords.lat, coords.lng);
      if (city) {
        setSelectedLocation(city);
        setSearchTerm(city);
      } else {
        alert("Could not determine your city. Please select manually.");
      }
    } catch (error) {
      console.error("Geolocation error:", error);
      alert("Error getting location. Please check your browser permissions.");
    } finally {
      setLocating(false);
    }
  };

  const filterCars = () => {
    let filtered = [...allCars];

    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.brand?.toLowerCase().includes(t) ||
        c.model?.toLowerCase().includes(t) ||
        c.location?.toLowerCase().includes(t) ||
        c.city?.toLowerCase().includes(t) ||
        c.area?.toLowerCase().includes(t) ||
        c.state?.toLowerCase().includes(t)
      );
    }

    if (selectedBrand) filtered = filtered.filter(c => c.brand === selectedBrand);
    if (selectedType) filtered = filtered.filter(c => c.type === selectedType);
    if (selectedFuel) filtered = filtered.filter(c => c.fuelType === selectedFuel);
    if (selectedTransmission) filtered = filtered.filter(c => c.transmission === selectedTransmission);

    if (selectedLocation) {
      filtered = filtered.filter(c =>
        c.location?.toLowerCase() === selectedLocation.toLowerCase() ||
        c.city?.toLowerCase() === selectedLocation.toLowerCase() ||
        c.area?.toLowerCase() === selectedLocation.toLowerCase() ||
        c.state?.toLowerCase() === selectedLocation.toLowerCase()
      );
    }

    if (rateRange) {
      filtered = filtered.filter(c => {
        const rate = c.dailyRate || c.price || 0;
        switch (rateRange) {
          case 'under2k':  return rate < 2000;
          case '2k-4k':    return rate >= 2000 && rate < 4000;
          case '4k-6k':    return rate >= 4000 && rate < 6000;
          case 'over6k':   return rate >= 6000;
          default: return true;
        }
      });
    }

    setFilteredCars(filtered);
  };

  const resetFilters = () => {
    setSearchTerm(''); setSelectedBrand(''); setSelectedFuel('');
    setSelectedTransmission(''); setSelectedLocation('');
    setRateRange(''); setSelectedType('');
  };

  const brands = [...new Set(allCars.map(c => c.brand).filter(Boolean))].sort();

  const handleRentNow = (car) => {
    navigate(`/rent/book/${car.id}`, { state: { car } });
  };

  if (loading) {
    return (
      <div className="buy-cars">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Gathering rental options...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rent-cars animate-fade-in">
      <div className="container">
        <header className="page-header">
          <h1>Flexibility on <span className="highlight">Your Terms</span></h1>
          <p>Rent premium vehicles for a day, a week, or as long as you need — across India</p>
        </header>

        {/* Filters */}
        <section className="filters-section">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-bar"
              placeholder="Search by brand, model or city..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button 
              className="location-detect-btn" 
              onClick={handleCurrentLocation} 
              disabled={locating}
              title="Use Current Location"
            >
              <FaMapMarkerAlt className={locating ? 'pulse' : ''} /> {locating ? 'Locating...' : 'Nearby'}
            </button>
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Brand</label>
              <select className="filter-select" value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
                <option value="">All Brands</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Body Type</label>
              <select className="filter-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                <option value="">All Types</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="MUV/MPV">MUV/MPV</option>
                <option value="Coupe">Coupe</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Rate Per Day</label>
              <select className="filter-select" value={rateRange} onChange={e => setRateRange(e.target.value)}>
                <option value="">Any Rate</option>
                <option value="under2k">Under ₹2,000</option>
                <option value="2k-4k">₹2,000 – ₹4,000</option>
                <option value="4k-6k">₹4,000 – ₹6,000</option>
                <option value="over6k">Above ₹6,000</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Fuel Type</label>
              <select className="filter-select" value={selectedFuel} onChange={e => setSelectedFuel(e.target.value)}>
                <option value="">All Fuels</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Transmission</label>
              <select className="filter-select" value={selectedTransmission} onChange={e => setSelectedTransmission(e.target.value)}>
                <option value="">Any</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label"><FaMapMarkerAlt style={{ marginRight: '4px' }} />City</label>
              <select className="filter-select" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                <option value="">All Cities</option>
                {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button className="btn btn-secondary" onClick={resetFilters} style={{ alignSelf: 'flex-end', height: '45px' }}>
              <FaRedo /> Reset
            </button>
          </div>

          <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <strong style={{ color: 'var(--text-white)' }}>{filteredCars.length}</strong> rentals available
          </p>
        </section>

        {filteredCars.length === 0 ? (
          <div className="no-results animate-fade-in">
            <div className="no-results-icon">🔍</div>
            <h3>No matching rentals found</h3>
            <p>We couldn't find any vehicles matching your current filters. Try adjusting your search criteria or reset all filters to browse our full catalog.</p>
            <button className="btn btn-primary" onClick={resetFilters} style={{ margin: '2rem auto 0', display: 'block' }}>
              <FaRedo /> Reset All Filters
            </button>
          </div>
        ) : (
          <div className="rental-grid">
            {filteredCars.map(car => (
              <div key={car.id} className="rental-card">
                <div className="rental-image">
                  <img
                    src={car.imageUrl || car.images?.[0] || getCarImage(car.model, car.type)}
                    alt={`${car.brand} ${car.model}`}
                    loading="lazy"
                    onError={e => { e.target.onerror = null; e.target.src = getCarImage(car.model, car.type); }}
                  />
                  <span className="rental-badge">PREMIUM RENTAL</span>
                  {car.isFeatured && <span className="rental-badge-featured"><FaStar /> Featured</span>}
                  {car.location && (
                    <span className="rental-location-tag">
                      <FaMapMarkerAlt style={{ marginRight: 3 }} />{car.location}
                    </span>
                  )}
                </div>

                <div className="rental-details">
                  <div className="rental-car-header">
                    <div>
                      <p className="rental-brand-name">{car.brand}</p>
                      <h3 className="rental-model-name">{car.model}</h3>
                    </div>
                    <span className="rental-year-badge">{car.year}</span>
                  </div>

                  <div className="rental-specs">
                    <span><FaUserFriends /> {car.seats || 5} Seats</span>
                    <span><FaCog /> {car.transmission || 'Auto'}</span>
                    <span><FaGasPump /> {car.fuelType || 'Petrol'}</span>
                  </div>

                  <div className="rental-features">
                    {(car.features || []).slice(0, 3).map((f, i) => (
                      <span key={i} className="feature-tag">
                        <FaCheckCircle style={{ fontSize: '0.6rem' }} /> {f}
                      </span>
                    ))}
                  </div>

                  <div className="rental-pricing">
                    <div className="daily-rate">
                      <div>
                        <span className="rate-amount">₹{(car.dailyRate || car.price || 0).toLocaleString()}</span>
                        <span className="rate-period">/day</span>
                      </div>
                      <span className="condition-tag">{car.condition || 'Excellent'}</span>
                    </div>
                  </div>

                  <button className="rent-btn" onClick={() => handleRentNow(car)}>
                    Reserve This Ride
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RentCars;