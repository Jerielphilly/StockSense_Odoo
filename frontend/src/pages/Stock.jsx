import { useState, useEffect } from 'react';

export default function Stock() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStock = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/stock', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch stock data");
      const data = await res.json();
      setStockData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleUpdateStock = async (item) => {
    const newCountStr = window.prompt(`Actual physical count for ${item.product_name} at ${item.location_name}:`, item.on_hand);
    if (newCountStr === null || newCountStr === "") return;
    
    const newCount = parseInt(newCountStr, 10);
    if (isNaN(newCount) || newCount < 0) {
      alert("Invalid quantity!");
      return;
    }

    const difference = newCount - item.on_hand;
    if (difference === 0) return; // No change

    try {
      const token = localStorage.getItem('token');
      
      // 1. Create Adjustment Move
      const movePayload = {
        product_id: item.product_id,
        type: 'adjustment',
        quantity: Math.abs(difference),
        reference: 'Manual Count Update'
      };
      
      if (difference > 0) {
        // We found more stock! Destination is the location.
        movePayload.dest_location_id = item.location_id;
      } else {
        // We lost stock! Source is the location.
        movePayload.source_location_id = item.location_id;
      }

      const resMove = await fetch('http://127.0.0.1:8000/moves', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(movePayload)
      });
      if (!resMove.ok) throw new Error("Failed to create adjustment move");
      const moveData = await resMove.json();

      // 1.5 Mark as Ready (State machine requirement)
      const resReady = await fetch(`http://127.0.0.1:8000/moves/${moveData.id}/ready`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resReady.ok) throw new Error("Failed to mark adjustment as ready");

      // 2. Validate Move
      const resVal = await fetch(`http://127.0.0.1:8000/moves/${moveData.id}/validate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resVal.ok) {
        const valData = await resVal.json();
        throw new Error(valData.detail || "Failed to validate adjustment move");
      }

      alert("Stock updated successfully!");
      fetchStock(); // Refresh data

    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="loading">Loading stock...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Stock</h2>
          <p className="subtitle">This page contains the warehouse details & location.</p>
        </div>
        <div className="search-icon">🔍</div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Location</th>
              <th>per unit cost</th>
              <th>On hand</th>
              <th>free to Use</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {stockData.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>No stock data available. Add products first!</td></tr>
            ) : (
              stockData.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.product_name}</td>
                  <td>{item.location_name}</td>
                  <td>{item.unit_cost} Rs</td>
                  <td>{item.on_hand}</td>
                  <td>{item.free_to_use}</td>
                  <td>
                    <button className="small-btn" onClick={() => handleUpdateStock(item)}>
                      Update
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <p style={{textAlign: 'center', marginTop: '2rem', color: '#ffb4a2'}}>
        User must be able to update the stock from here.
      </p>
    </div>
  );
}
