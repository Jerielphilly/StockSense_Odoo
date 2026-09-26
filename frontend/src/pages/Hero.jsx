import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <h1 className="hero-title">Welcome to StockSense</h1>
        <p className="hero-subtitle">
          The ultimate modular Inventory Management System (IMS) that digitizes and streamlines all stock-related operations within your business. 
          Replace manual registers, scattered Excel sheets, and outdated tracking methods with a centralized, real-time, easy-to-use app.
        </p>
        
        <div className="hero-features">
          <div className="feature">
            <h3>📦 Real-Time Stock</h3>
            <p>Know exactly what is on your shelves at any given second.</p>
          </div>
          <div className="feature">
            <h3>🚚 Smooth Operations</h3>
            <p>Manage Receipts, Deliveries, and Internal Transfers seamlessly.</p>
          </div>
          <div className="feature">
            <h3>📊 Dynamic Dashboard</h3>
            <p>Track low-stock alerts and pending deliveries automatically.</p>
          </div>
        </div>

        <div className="hero-actions">
          <Link to="/login" className="primary-btn hero-btn">LOGIN</Link>
          <Link to="/signup" className="primary-btn hero-btn outline">SIGN UP</Link>
        </div>
      </div>
    </div>
  );
}
