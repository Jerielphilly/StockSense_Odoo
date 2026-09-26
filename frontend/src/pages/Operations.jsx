import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Operations() {
  const [stats, setStats] = useState({
    pending_receipts: 0,
    pending_deliveries: 0,
    pending_transfers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://127.0.0.1:8000/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.kpis);
        }
      } catch (err) {
        console.error("Failed to fetch operations stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading">Loading Operations...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Operations Overview</h2>
          <p className="subtitle">Select an operation type to manage your stock movements.</p>
        </div>
      </div>

      <div className="operations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Receipts Card */}
        <div className="auth-card" style={{ width: '100%', padding: '2rem', textAlign: 'left' }}>
          <h3 style={{ color: '#ffb4a2', fontSize: '1.5rem', marginBottom: '1rem' }}>📥 Receipts</h3>
          <p style={{ color: '#ddd', marginBottom: '2rem' }}>Process incoming goods from vendors into your warehouse.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {stats.pending_receipts} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#888' }}>To Process</span>
            </span>
            {/* The Link currently goes nowhere until we get the wireframe! */}
            <Link to="/operations/receipts" className="primary-btn" style={{ marginTop: 0, textDecoration: 'none' }}>
              Open Receipts
            </Link>
          </div>
        </div>

        {/* Deliveries Card */}
        <div className="auth-card" style={{ width: '100%', padding: '2rem', textAlign: 'left' }}>
          <h3 style={{ color: '#ffb4a2', fontSize: '1.5rem', marginBottom: '1rem' }}>📤 Delivery Orders</h3>
          <p style={{ color: '#ddd', marginBottom: '2rem' }}>Process outgoing shipments to your customers.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {stats.pending_deliveries} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#888' }}>To Process</span>
            </span>
            <button className="primary-btn" style={{ marginTop: 0 }} onClick={() => alert("Waiting for Delivery wireframe!")}>
              Open Deliveries
            </button>
          </div>
        </div>

        {/* Internal Transfers Card */}
        <div className="auth-card" style={{ width: '100%', padding: '2rem', textAlign: 'left' }}>
          <h3 style={{ color: '#ffb4a2', fontSize: '1.5rem', marginBottom: '1rem' }}>🔄 Internal Transfers</h3>
          <p style={{ color: '#ddd', marginBottom: '2rem' }}>Move stock between your internal warehouse locations.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {stats.pending_transfers} <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#888' }}>To Process</span>
            </span>
            <button className="primary-btn" style={{ marginTop: 0 }} onClick={() => alert("Transfers coming soon!")}>
              Open Transfers
            </button>
          </div>
        </div>

        {/* Adjustments Card */}
        <div className="auth-card" style={{ width: '100%', padding: '2rem', textAlign: 'left' }}>
          <h3 style={{ color: '#ffb4a2', fontSize: '1.5rem', marginBottom: '1rem' }}>✏️ Adjustments</h3>
          <p style={{ color: '#ddd', marginBottom: '2rem' }}>Update physical inventory counts and fix discrepancies.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'transparent' }}>0</span>
            <Link to="/stock" className="primary-btn" style={{ marginTop: 0, textDecoration: 'none' }}>
              Go to Stock Page
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
