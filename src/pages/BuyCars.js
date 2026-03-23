import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import CarCard from '../components/CarCard';
import { FaSearch, FaFilter, FaRedo, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './BuyCars.css';

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kochi',
  'Chandigarh', 'Indore', 'Nagpur', 'Coimbatore', 'Vadodara', 'Bhopal'
];

function BuyCars() {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Basic filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  // Advanced filters
  const [selectedFuel, setSelectedFuel] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedKm, setSelectedKm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('');

  useEffect(() => { fetchCars(); }, []);

  useEffect(() => {
    filterCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedBrand, selectedType, priceRange, availabilityFilter,
      selectedFuel, selectedTransmission, selectedYear, selectedKm,
      selectedCondition, selectedLocation, sortBy, cars]);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'cars'));
      const allCars = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Normalise availability field
        availability: doc.data().purpose === 'rent' ? 'rent' : 'sale',
        price: doc.data().purpose === 'rent'
          ? (doc.data().dailyRate || doc.data().price)
          : doc.data().price,
      }));
      setCars(allCars);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCars = () => {
    let filtered = [...cars];

    // Availability
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(c => c.availability === availabilityFilter);
    }

    // Full-text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.brand?.toLowerCase().includes(term) ||
        c.model?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        c.location?.toLowerCase().includes(term)
      );
    }

    // Brand
    if (selectedBrand) filtered = filtered.filter(c => c.brand === selectedBrand);

    // Body type
    if (selectedType) filtered = filtered.filter(c => c.type === selectedType);

    // Fuel type
    if (selectedFuel) filtered = filtered.filter(c => c.fuelType === selectedFuel);

    // Transmission
    if (selectedTransmission) filtered = filtered.filter(c => c.transmission === selectedTransmission);

    // Condition
    if (selectedCondition) filtered = filtered.filter(c => c.condition === selectedCondition);

    // Location
    if (selectedLocation) filtered = filtered.filter(c =>
      c.location?.toLowerCase() === selectedLocation.toLowerCase() ||
      c.city?.toLowerCase() === selectedLocation.toLowerCase()
    );

    // Year range
    if (selectedYear) {
      filtered = filtered.filter(c => {
        const y = Number(c.year);
        switch (selectedYear) {
          case '2023+':   return y >= 2023;
          case '2020-22': return y >= 2020 && y <= 2022;
          case '2017-19': return y >= 2017 && y <= 2019;
          case 'pre2017': return y < 2017;
          default: return true;
        }
      });
    }

    // KM Driven
    if (selectedKm) {
      filtered = filtered.filter(c => {
        const km = Number(c.kmDriven);
        switch (selectedKm) {
          case 'under30':   return km < 30000;
          case '30-75':     return km >= 30000 && km < 75000;
          case '75-150':    return km >= 75000 && km < 150000;
          case 'over150':   return km >= 150000;
          default: return true;
        }
      });
    }

    // Price range (₹)
    if (priceRange) {
      filtered = filtered.filter(c => {
        const p = c.price || c.dailyRate;
        switch (priceRange) {
          case 'under3L':    return p < 300000;
          case '3L-8L':      return p >= 300000 && p < 800000;
          case '8L-15L':     return p >= 800000 && p < 1500000;
          case '15L-30L':    return p >= 1500000 && p < 3000000;
          case 'over30L':    return p >= 3000000;
          // Rental price per day
          case 'r-under2k':  return p < 2000;
          case 'r-2k-4k':    return p >= 2000 && p < 4000;
          case 'r-over4k':   return p >= 4000;
          default: return true;
        }
      });
    }

    // Sort
    if (sortBy) {
      filtered.sort((a, b) => {
        const pa = a.price || a.dailyRate || 0;
        const pb = b.price || b.dailyRate || 0;
        if (sortBy === 'price-asc')  return pa - pb;
        if (sortBy === 'price-desc') return pb - pa;
        if (sortBy === 'year-desc')  return (Number(b.year) || 0) - (Number(a.year) || 0);
        if (sortBy === 'year-asc')   return (Number(a.year) || 0) - (Number(b.year) || 0);
        if (sortBy === 'km-asc')     return (Number(a.kmDriven) || 0) - (Number(b.kmDriven) || 0);
        return 0;
      });
    }

    setFilteredCars(filtered);
  };

  const resetFilters = () => {
    setSearchTerm(''); setSelectedBrand(''); setSelectedType('');
    setPriceRange(''); setAvailabilityFilter('all'); setSelectedFuel('');
    setSelectedTransmission(''); setSelectedYear(''); setSelectedKm('');
    setSelectedCondition(''); setSelectedLocation(''); setSortBy('');
  };

  const brands = [...new Set(cars.map(c => c.brand).filter(Boolean))].sort();

  const activeFilterCount = [
    selectedBrand, selectedType, selectedFuel, selectedTransmission,
    selectedYear, selectedKm, selectedCondition, selectedLocation, priceRange
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="buy-cars">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Scanning our marketplace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buy-cars animate-fade-in">
      <div className="container">
        <header className="page-header">
          <h1>Find Your Next <span className="highlight">Perfect Ride</span></h1>
          <p>Browse {cars.length}+ vehicles — buy or rent across India</p>
        </header>

        {/* ---- Search + Basic Filters ---- */}
        <section className="filters-section">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-bar"
              placeholder="Search by brand, model, city or feature..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters-grid">
            {/* Listing type */}
            <div className="filter-group">
              <label className="filter-label">Listing Type</label>
              <select className="filter-select" value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)}>
                <option value="all">All Listings</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            {/* Brand */}
            <div className="filter-group">
              <label className="filter-label">Brand</label>
              <select className="filter-select" value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
                <option value="">All Brands</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Body type */}
            <div className="filter-group">
              <label className="filter-label">Body Type</label>
              <select className="filter-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                <option value="">All Types</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="MPV">MPV</option>
                <option value="Pickup">Pickup</option>
                <option value="Coupe">Coupe</option>
              </select>
            </div>

            {/* Price */}
            <div className="filter-group">
              <label className="filter-label">
                {availabilityFilter === 'rent' ? 'Rate / Day' : 'Price Range'}
              </label>
              {availabilityFilter === 'rent' ? (
                <select className="filter-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                  <option value="">Any Rate</option>
                  <option value="r-under2k">Under ₹2,000/day</option>
                  <option value="r-2k-4k">₹2,000 – ₹4,000/day</option>
                  <option value="r-over4k">Above ₹4,000/day</option>
                </select>
              ) : (
                <select className="filter-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
                  <option value="">Any Price</option>
                  <option value="under3L">Under ₹3 Lakh</option>
                  <option value="3L-8L">₹3L – ₹8L</option>
                  <option value="8L-15L">₹8L – ₹15L</option>
                  <option value="15L-30L">₹15L – ₹30L</option>
                  <option value="over30L">Above ₹30L</option>
                </select>
              )}
            </div>

            {/* Sort */}
            <div className="filter-group">
              <label className="filter-label">Sort By</label>
              <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="">Default</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="year-desc">Newest First</option>
                <option value="year-asc">Oldest First</option>
                <option value="km-asc">Lowest KM</option>
              </select>
            </div>

            <button className="btn btn-secondary" onClick={resetFilters} style={{ alignSelf: 'flex-end', height: '45px' }}>
              <FaRedo /> Reset
            </button>
          </div>

          {/* ---- Advanced Filters Toggle ---- */}
          <button
            className="btn btn-secondary"
            style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
            onClick={() => setShowAdvanced(v => !v)}
          >
            <FaFilter />
            Advanced Filters
            {activeFilterCount > 0 && (
              <span style={{ background: 'var(--primary)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                {activeFilterCount}
              </span>
            )}
            {showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          {showAdvanced && (
            <div className="filters-grid" style={{ marginTop: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Fuel Type */}
              <div className="filter-group">
                <label className="filter-label">Fuel Type</label>
                <select className="filter-select" value={selectedFuel} onChange={e => setSelectedFuel(e.target.value)}>
                  <option value="">All Fuel Types</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              {/* Transmission */}
              <div className="filter-group">
                <label className="filter-label">Transmission</label>
                <select className="filter-select" value={selectedTransmission} onChange={e => setSelectedTransmission(e.target.value)}>
                  <option value="">Any</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>

              {/* Year Range */}
              <div className="filter-group">
                <label className="filter-label">Year</label>
                <select className="filter-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                  <option value="">Any Year</option>
                  <option value="2023+">2023 & Newer</option>
                  <option value="2020-22">2020 – 2022</option>
                  <option value="2017-19">2017 – 2019</option>
                  <option value="pre2017">Before 2017</option>
                </select>
              </div>

              {/* KM Driven */}
              <div className="filter-group">
                <label className="filter-label">KM Driven</label>
                <select className="filter-select" value={selectedKm} onChange={e => setSelectedKm(e.target.value)}>
                  <option value="">Any KM</option>
                  <option value="under30">Under 30,000 km</option>
                  <option value="30-75">30,000 – 75,000 km</option>
                  <option value="75-150">75,000 – 1,50,000 km</option>
                  <option value="over150">Above 1,50,000 km</option>
                </select>
              </div>

              {/* Condition */}
              <div className="filter-group">
                <label className="filter-label">Condition</label>
                <select className="filter-select" value={selectedCondition} onChange={e => setSelectedCondition(e.target.value)}>
                  <option value="">Any Condition</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              {/* Location */}
              <div className="filter-group">
                <label className="filter-label">Location / City</label>
                <select className="filter-select" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                  <option value="">All Cities</option>
                  {INDIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
            </div>
          )}
        </section>

        <div className="results-header">
          <p className="results-count">
            <strong>{filteredCars.length}</strong> vehicles matching your criteria
          </p>
        </div>

        {filteredCars.length === 0 ? (
          <div className="no-results">
            <FaFilter style={{ fontSize: '3rem', color: 'var(--primary-light)', marginBottom: '1rem' }} />
            <h3>No matches found</h3>
            <p>Try adjusting your filters or search term</p>
            <button className="btn btn-primary" onClick={resetFilters} style={{ marginTop: '1.5rem' }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="cars-grid">
            {filteredCars.map(car => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyCars;