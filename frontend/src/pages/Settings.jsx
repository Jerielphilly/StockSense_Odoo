import { useState, useEffect } from 'react';

export default function Settings() {
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const [whForm, setWhForm] = useState({ name: '', short_code: '', address: '' });
  const [locForm, setLocForm] = useState({ name: '', short_code: '', warehouse_id: '' });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [whRes, locRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/warehouses', { headers }),
        fetch('http://127.0.0.1:8000/locations', { headers })
      ]);
      if (whRes.ok) setWarehouses(await whRes.json());
      if (locRes.ok) setLocations(await locRes.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(whForm)
      });
      if (!res.ok) throw new Error("Failed to create warehouse");
      alert("Warehouse created successfully!");
      setWhForm({ name: '', short_code: '', address: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: locForm.name,
        short_code: locForm.short_code,
        type: 'internal',
        warehouse_id: locForm.warehouse_id ? parseInt(locForm.warehouse_id) : null
      };
      
      const res = await fetch('http://127.0.0.1:8000/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create location");
      alert("Location created successfully!");
      setLocForm({ name: '', short_code: '', warehouse_id: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p className="subtitle">This page contains the warehouse details & locations.</p>
        </div>
      </div>

      {/* Warehouse Card */}
      <div className="auth-card" style={{width: '100%', padding: '2rem', marginBottom: '2rem', textAlign:'left'}}>
        <h3 style={{color: '#ffb4a2', borderBottom: '1px solid #444', paddingBottom: '1rem', marginBottom: '1rem'}}>Warehouse</h3>
        <form onSubmit={handleWarehouseSubmit} style={{display:'grid', gridTemplateColumns:'1fr', gap:'1.5rem', maxWidth:'500px'}}>
          <div className="input-group">
            <label>Name:</label>
            <input type="text" required value={whForm.name} onChange={e => setWhForm({...whForm, name: e.target.value})} placeholder="e.g. Main Warehouse" />
          </div>
          <div className="input-group">
            <label>Short Code:</label>
            <input type="text" required value={whForm.short_code} onChange={e => setWhForm({...whForm, short_code: e.target.value})} placeholder="e.g. WH" />
          </div>
          <div className="input-group">
            <label>Address:</label>
            <input type="text" value={whForm.address} onChange={e => setWhForm({...whForm, address: e.target.value})} placeholder="e.g. 123 Factory Lane" />
          </div>
          <button type="submit" className="primary-btn" style={{width:'fit-content'}}>Save Warehouse</button>
        </form>
        
        {warehouses.length > 0 && (
          <div style={{marginTop:'2rem'}}>
            <h4 style={{color:'#888'}}>Saved Warehouses</h4>
            <ul style={{listStyle:'none', padding:0}}>
              {warehouses.map(w => <li key={w.id}>[{w.short_code}] {w.name} - {w.address}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Location Card */}
      <div className="auth-card" style={{width: '100%', padding: '2rem', textAlign:'left'}}>
        <h3 style={{color: '#ffb4a2', borderBottom: '1px solid #444', paddingBottom: '1rem', marginBottom: '1rem'}}>Location</h3>
        <p style={{color:'#888', fontSize:'0.9rem', marginBottom:'1.5rem'}}>This holds the multiple locations of warehouse, rooms etc..</p>
        <form onSubmit={handleLocationSubmit} style={{display:'grid', gridTemplateColumns:'1fr', gap:'1.5rem', maxWidth:'500px'}}>
          <div className="input-group">
            <label>Name:</label>
            <input type="text" required value={locForm.name} onChange={e => setLocForm({...locForm, name: e.target.value})} placeholder="e.g. Stock" />
          </div>
          <div className="input-group">
            <label>Short Code:</label>
            <input type="text" required value={locForm.short_code} onChange={e => setLocForm({...locForm, short_code: e.target.value})} placeholder="e.g. Stock1" />
          </div>
          <div className="input-group">
            <label>Warehouse:</label>
            <select required value={locForm.warehouse_id} onChange={e => setLocForm({...locForm, warehouse_id: e.target.value})} style={{padding:'0.8rem', background:'#1a1a1a', color:'white', border:'2px solid #ffb4a2'}}>
              <option value="">-- Select Warehouse --</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.short_code}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="primary-btn" style={{width:'fit-content'}}>Save Location</button>
        </form>
        
        {locations.length > 0 && (
          <div style={{marginTop:'2rem'}}>
            <h4 style={{color:'#888'}}>Saved Locations</h4>
            <ul style={{listStyle:'none', padding:0}}>
              {locations.map(l => {
                const wh = warehouses.find(w => w.id === l.warehouse_id);
                return <li key={l.id}>[{wh ? wh.short_code : ''}/{l.short_code || '?'}] {l.name}</li>
              })}
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}
