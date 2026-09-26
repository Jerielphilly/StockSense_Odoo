import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from our FastAPI backend!
    fetch('http://127.0.0.1:8000/dashboard')
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(data => setKpis(data.kpis))
      .catch(err => {
        console.error("Fetch error:", err);
        setError("Failed to load dashboard data. Is the FastAPI server running?");
      });
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!kpis) return <div className="loading">Loading KPIs...</div>;

  return (
    <div className="dashboard-grid">
      
      {/* Receipt Card */}
      <div className="kanban-card">
        <h3>Receipt</h3>
        <div className="card-content">
          <div className="action-button">
            <span>{kpis.pending_receipts} to receive</span>
          </div>
          <div className="card-stats">
            <p>0 Late</p>
            <p>{kpis.pending_receipts} operations</p>
          </div>
        </div>
      </div>

      {/* Delivery Card */}
      <div className="kanban-card">
        <h3>Delivery</h3>
        <div className="card-content">
          <div className="action-button">
            <span>{kpis.pending_deliveries} to Deliver</span>
          </div>
          <div className="card-stats">
            <p>0 Late</p>
            <p>0 waiting</p>
            <p>{kpis.pending_deliveries} operations</p>
          </div>
        </div>
      </div>

      {/* Internal Transfers Card (Bonus based on our backend logic!) */}
      <div className="kanban-card">
        <h3>Internal Transfers</h3>
        <div className="card-content">
          <div className="action-button">
            <span>{kpis.pending_transfers} to Move</span>
          </div>
          <div className="card-stats">
            <p>0 Late</p>
            <p>{kpis.pending_transfers} operations</p>
          </div>
        </div>
      </div>

    </div>
  );
}
