import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch KPIs
        const resKpi = await fetch('http://127.0.0.1:8000/dashboard', { headers });
        if (!resKpi.ok) throw new Error("Failed to load KPIs");
        const dataKpi = await resKpi.json();
        setKpis(dataKpi.kpis);
        
        // Fetch Chart Data
        const resChart = await fetch('http://127.0.0.1:8000/analytics/flow', { headers });
        if (resChart.ok) setChartData(await resChart.json());
        
        // Fetch History for Activity Feed
        const resHist = await fetch('http://127.0.0.1:8000/history', { headers });
        if (resHist.ok) {
          const histData = await resHist.json();
          setRecentHistory(histData.slice(0, 5)); // Just grab the 5 most recent moves
        }
      } catch (err) {
        setError("Failed to load dashboard data.");
      }
    };
    fetchDashboard();
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!kpis) return <div className="loading">Loading KPIs...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Executive Dashboard</h2>
          <p className="subtitle">High-level overview of your warehouse operations.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className="kanban-card" style={{borderTop: '4px solid #ffb4a2'}}>
          <h3 style={{color: '#888'}}>Total SKUs</h3>
          <p style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{kpis.total_products}</p>
        </div>
        
        <div className="kanban-card" style={{borderTop: '4px solid #ff4d4d'}}>
          <h3 style={{color: '#888'}}>Low Stock Alerts</h3>
          <p style={{fontSize: '2.5rem', fontWeight: 'bold', color: kpis.low_or_out_of_stock > 0 ? '#ff4d4d' : 'inherit'}}>
            {kpis.low_or_out_of_stock}
          </p>
        </div>

        <div className="kanban-card" style={{borderTop: '4px solid #79d279'}}>
          <h3 style={{color: '#888'}}>Pending Receipts</h3>
          <p style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{kpis.pending_receipts}</p>
        </div>

        <div className="kanban-card" style={{borderTop: '4px solid #f39c12'}}>
          <h3 style={{color: '#888'}}>Pending Deliveries</h3>
          <p style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{kpis.pending_deliveries}</p>
        </div>
      </div>

      <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
        
        {/* Chart Section */}
        <div style={{flex: '1 1 400px', background: '#1a1a1a', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333'}}>
          <h3 style={{color: '#ffb4a2', marginBottom: '1.5rem'}}>Stock Flow (Last 7 Days)</h3>
          <div style={{width: '100%', height: 300}}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{backgroundColor: '#222', borderColor: '#444'}} />
                <Legend />
                <Bar dataKey="IN" fill="#79d279" name="Stock In (Receipts)" />
                <Bar dataKey="OUT" fill="#ff4d4d" name="Stock Out (Deliveries)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div style={{flex: '1 1 400px'}}>
          <h3 style={{color: '#ffb4a2', marginBottom: '1rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem'}}>Recent Activity Feed</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Product</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.length === 0 ? (
                  <tr><td colSpan="3" style={{textAlign:'center'}}>No recent activity.</td></tr>
                ) : recentHistory.map((move, idx) => {
                  let color = 'inherit';
                  if (move.type === 'receipt') color = '#79d279';
                  if (move.type === 'delivery') color = '#ff4d4d';
                  
                  return (
                    <tr key={idx} style={{color: color}}>
                      <td style={{fontWeight:'bold'}}>{move.reference}</td>
                      <td>[{move.sku}] {move.product_name} ({move.quantity})</td>
                      <td>{move.status.toUpperCase()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
