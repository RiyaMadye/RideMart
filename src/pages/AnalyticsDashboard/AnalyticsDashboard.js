import React, { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaDownload, FaUserFriends, FaCar, FaDollarSign, FaBook } from 'react-icons/fa';
import './AnalyticsDashboard.css';

// Helper to format date for charts (e.g., 'Jan 2023')
const formatMonth = (date) => {
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
};

// Helper to export data to CSV
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString()}.csv`;
  link.click();
};

function AnalyticsDashboard({ users = [], cars = [], rentals = [], orders = [] }) {

  // 1. User Growth Analytics
  const userGrowthData = useMemo(() => {
    const monthlyUsers = users.reduce((acc, user) => {
      if (user.createdAt && typeof user.createdAt.toDate === 'function') {
        const month = formatMonth(user.createdAt.toDate());
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.keys(monthlyUsers).map(month => ({
      month,
      newUsers: monthlyUsers[month]
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [users]);

  // 2. Revenue Reports
  const revenueData = useMemo(() => {
    const monthlyRevenue = orders.reduce((acc, order) => {
      if (order.createdAt && typeof order.createdAt.toDate === 'function') {
        const month = formatMonth(order.createdAt.toDate());
        acc[month] = (acc[month] || 0) + (Number(order.amount) || 0);
      }
      return acc;
    }, {});

    return Object.keys(monthlyRevenue).map(month => ({
      month,
      revenue: monthlyRevenue[month]
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [orders]);

  // 3. Booking Trends
  const bookingTrendsData = useMemo(() => {
    const monthlyBookings = rentals.reduce((acc, rental) => {
      if (rental.createdAt && typeof rental.createdAt.toDate === 'function') {
        const month = formatMonth(rental.createdAt.toDate());
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.keys(monthlyBookings).map(month => ({
      month,
      bookings: monthlyBookings[month]
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  }, [rentals]);

  // 4. Top Performing Sellers
  const topSellers = useMemo(() => {
    const sellerStats = orders.reduce((acc, order) => {
      const sellerEmail = order.sellerEmail || 'Unknown';
      if (!acc[sellerEmail]) {
        acc[sellerEmail] = { sales: 0, revenue: 0 };
      }
      acc[sellerEmail].sales += 1;
      acc[sellerEmail].revenue += Number(order.amount) || 0;
      return acc;
    }, {});

    return Object.keys(sellerStats).map(email => ({
      email,
      ...sellerStats[email]
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  // 5. Most Sold & Rented Cars
  const topCars = useMemo(() => {
    const carStats = {};
    
    // Count sales from orders
    orders.forEach(order => {
      const model = order.carDetails || 'Unknown Model';
      if (!carStats[model]) carStats[model] = { sales: 0, rentals: 0 };
      carStats[model].sales += 1;
    });

    // Count rentals
    rentals.forEach(rental => {
      const model = `${rental.carMake} ${rental.carModel}`;
      if (!carStats[model]) carStats[model] = { sales: 0, rentals: 0 };
      carStats[model].rentals += 1;
    });

    return Object.keys(carStats).map(model => ({
      model,
      ...carStats[model]
    })).sort((a, b) => (b.sales + b.rentals) - (a.sales + a.rentals)).slice(0, 5);
  }, [orders, rentals]);

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="analytics-dashboard">
      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon revenue"><FaDollarSign /></div>
          <div className="summary-info">
            <h4>Total Revenue</h4>
            <p>₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon users"><FaUserFriends /></div>
          <div className="summary-info">
            <h4>Total Users</h4>
            <p>{users.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon cars"><FaCar /></div>
          <div className="summary-info">
            <h4>Total Listings</h4>
            <p>{cars.length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon bookings"><FaBook /></div>
          <div className="summary-info">
            <h4>Total Bookings</h4>
            <p>{rentals.length}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Revenue Over Time</h3>
            <button className="export-btn" onClick={() => exportToCSV(revenueData, 'revenue_report')}>
              <FaDownload /> CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${value/1000}k`} />
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>User Growth</h3>
            <button className="export-btn" onClick={() => exportToCSV(userGrowthData, 'user_growth_report')}>
              <FaDownload /> CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>Booking Trends</h3>
            <button className="export-btn" onClick={() => exportToCSV(bookingTrendsData, 'booking_trends_report')}>
              <FaDownload /> CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#ff8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="tables-grid">
        <div className="table-container">
          <div className="chart-header">
            <h3>Top Performing Sellers</h3>
            <button className="export-btn" onClick={() => exportToCSV(topSellers, 'top_sellers_report')}>
              <FaDownload /> CSV
            </button>
          </div>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Seller Email</th>
                <th>Sales</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topSellers.map(seller => (
                <tr key={seller.email}>
                  <td>{seller.email}</td>
                  <td>{seller.sales}</td>
                  <td>₹{seller.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-container">
          <div className="chart-header">
            <h3>Most Popular Cars</h3>
            <button className="export-btn" onClick={() => exportToCSV(topCars, 'top_cars_report')}>
              <FaDownload /> CSV
            </button>
          </div>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Car Model</th>
                <th>Sales</th>
                <th>Rentals</th>
              </tr>
            </thead>
            <tbody>
              {topCars.map(car => (
                <tr key={car.model}>
                  <td>{car.model}</td>
                  <td>{car.sales}</td>
                  <td>{car.rentals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;