import { useState, useEffect } from 'react';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/history', { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setHistory(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, []);

  if (loading) return <div className="loading">Loading Move History...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Move History</h2>
          <p className="subtitle">The complete ledger of all product movements.</p>
        </div>
        <div className="search-icon">🔍</div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Date</th>
              <th>Product</th>
              <th>Contact</th>
              <th>From</th>
              <th>To</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan="8" style={{textAlign:'center'}}>No moves recorded yet.</td></tr>
            ) : history.map((move, idx) => {
              
              // Apply wireframe color logic: "In event should be display in green. Out moves should be display in rend"
              let rowStyle = {};
              if (move.type === 'receipt') rowStyle.color = '#79d279'; // Green
              else if (move.type === 'delivery') rowStyle.color = '#ff4d4d'; // Red

              return (
                <tr key={idx} style={rowStyle}>
                  <td style={{fontWeight:'bold'}}>{move.reference}</td>
                  <td>{move.date ? new Date(move.date).toLocaleDateString() : '-'}</td>
                  <td>[{move.sku}] {move.product_name}</td>
                  <td>{move.contact}</td>
                  <td>{move.from_loc}</td>
                  <td>{move.to_loc}</td>
                  <td style={{fontWeight:'bold'}}>{move.quantity}</td>
                  <td>{move.status.toUpperCase()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p style={{marginTop:'2rem', color:'#888', fontSize:'0.9rem'}}>
        * Note: IN (Receipts) are shown in green. OUT (Deliveries) are shown in red.
      </p>
    </div>
  );
}
