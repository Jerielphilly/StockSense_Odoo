import { useState, useEffect } from 'react';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const [view, setView] = useState('list');
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const [formData, setFormData] = useState({ schedule_date: '', source_location_id: '', dest_location_id: '' });
  const [formItems, setFormItems] = useState([{ product_id: '', quantity: 1 }]);

  const fetchTransfers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/transfers', { headers: { 'Authorization': `Bearer ${token}` }});
      if (res.ok) setTransfers(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchDropdowns = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [prodRes, locRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/products', { headers }),
        fetch('http://127.0.0.1:8000/locations', { headers })
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (locRes.ok) setLocations(await locRes.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchTransfers();
    fetchDropdowns();
  }, []);

  const openDetail = async (ref) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:8000/transfers/${encodeURIComponent(ref)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedTransfer(await res.json());
        setView('detail');
      }
    } catch (err) { alert("Failed to fetch transfer details."); }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.source_location_id || !formData.dest_location_id) return alert("Select both source and destination locations!");
    if (formData.source_location_id === formData.dest_location_id) return alert("Source and destination must be different!");
    
    const items = formItems.filter(i => i.product_id && i.quantity > 0).map(i => ({
      product_id: parseInt(i.product_id),
      quantity: parseInt(i.quantity)
    }));
    
    if (items.length === 0) return alert("Add at least one valid product!");

    const payload = {
      schedule_date: formData.schedule_date ? new Date(formData.schedule_date).toISOString() : null,
      source_location_id: parseInt(formData.source_location_id),
      dest_location_id: parseInt(formData.dest_location_id),
      items: items
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create transfer");
      
      alert("Transfer created successfully!");
      setFormData({ schedule_date: '', source_location_id: '', dest_location_id: '' });
      setFormItems([{ product_id: '', quantity: 1 }]);
      setView('list');
      fetchTransfers();
    } catch (err) { alert(err.message); }
  };

  const handleCheckAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:8000/transfers/${encodeURIComponent(selectedTransfer.reference)}/check`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
      openDetail(selectedTransfer.reference);
    } catch (err) { alert("Error checking availability"); }
  };

  const handleValidate = async () => {
    try {
      const token = localStorage.getItem('token');
      for (const item of selectedTransfer.items) {
        await fetch(`http://127.0.0.1:8000/moves/${item.move_id}/validate`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      openDetail(selectedTransfer.reference);
    } catch (err) { alert("Error validating: " + err.message); }
  };

  return (
    <div className="page-container">
      {/* ---------- LIST VIEW ---------- */}
      {view === 'list' && (
        <>
          <div className="page-header">
            <div>
              <h2>Internal Transfers</h2>
              <p className="subtitle">Move stock between your internal locations.</p>
            </div>
            <button className="primary-btn" onClick={() => setView('create')} style={{marginTop:0}}>+ NEW</button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr><td colSpan="4" style={{textAlign:'center'}}>No internal transfers found.</td></tr>
                ) : transfers.map((t, idx) => (
                  <tr key={idx} style={{cursor:'pointer'}} onClick={() => openDetail(t.reference)}>
                    <td style={{color: '#ffb4a2'}}>{t.reference}</td>
                    <td>{t.source_location_name}</td>
                    <td>{t.dest_location_name}</td>
                    <td>{t.status.toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ---------- CREATE VIEW ---------- */}
      {view === 'create' && (
        <>
          <div className="page-header">
            <h2>New Internal Transfer</h2>
            <button className="small-btn" onClick={() => setView('list')}>Cancel</button>
          </div>
          <form className="auth-card" style={{width: '100%', padding: '2rem'}} onSubmit={handleCreateSubmit}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginBottom: '2rem'}}>
              <div className="input-group">
                <label>Source Location (From)</label>
                <select required value={formData.source_location_id} onChange={e=>setFormData({...formData, source_location_id: e.target.value})} style={{padding:'0.8rem', background:'#1a1a1a', color:'white', border:'2px solid #ffb4a2'}}>
                  <option value="">-- Choose --</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Destination Location (To)</label>
                <select required value={formData.dest_location_id} onChange={e=>setFormData({...formData, dest_location_id: e.target.value})} style={{padding:'0.8rem', background:'#1a1a1a', color:'white', border:'2px solid #ffb4a2'}}>
                  <option value="">-- Choose --</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Schedule Date</label>
                <input type="date" required value={formData.schedule_date} onChange={e=>setFormData({...formData, schedule_date: e.target.value})} />
              </div>
            </div>

            <h3 style={{color:'#ffb4a2', marginBottom:'1rem'}}>Products to Transfer</h3>
            {formItems.map((item, idx) => (
              <div key={idx} style={{display:'flex', gap:'1rem', marginBottom:'1rem'}}>
                <select style={{flex:2, padding:'0.8rem', background:'#1a1a1a', color:'white', border:'2px solid #ffb4a2'}}
                        value={item.product_id} 
                        onChange={e => {
                          const newItems = [...formItems];
                          newItems[idx].product_id = e.target.value;
                          setFormItems(newItems);
                        }}>
                  <option value="">-- Select Product --</option>
                  {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                </select>
                <input type="number" min="1" style={{flex:1, padding:'0.8rem', background:'#1a1a1a', color:'white', border:'2px solid #ffb4a2'}}
                       value={item.quantity} 
                       onChange={e => {
                          const newItems = [...formItems];
                          newItems[idx].quantity = e.target.value;
                          setFormItems(newItems);
                       }} />
              </div>
            ))}
            <button type="button" className="small-btn" onClick={() => setFormItems([...formItems, {product_id: '', quantity: 1}])}>+ Add Line</button>
            <br/><br/>
            <button type="submit" className="primary-btn">Save Transfer</button>
          </form>
        </>
      )}

      {/* ---------- DETAIL VIEW ---------- */}
      {view === 'detail' && selectedTransfer && (
        <>
          <div className="page-header" style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
              <h2>{selectedTransfer.reference}</h2>
              <button className="small-btn" onClick={() => setView('list')}>Back to List</button>
            </div>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#242424', padding:'1rem', borderRadius:'8px', border:'1px solid #444'}}>
              <div style={{display:'flex', gap:'1rem'}}>
                {selectedTransfer.status === 'draft' && <button className="primary-btn" style={{marginTop:0}} onClick={handleCheckAvailability}>Check Availability</button>}
                {selectedTransfer.status === 'waiting' && <button className="primary-btn" style={{marginTop:0}} onClick={handleCheckAvailability}>Re-check Availability</button>}
                {selectedTransfer.status === 'ready' && <button className="primary-btn" style={{marginTop:0}} onClick={handleValidate}>Validate</button>}
                {selectedTransfer.status === 'done' && <button className="small-btn" onClick={() => window.print()}>Print</button>}
              </div>
              <div style={{color:'#ffb4a2', fontWeight:'bold', fontSize:'1.1rem'}}>
                <span style={{opacity: selectedTransfer.status === 'draft' ? 1 : 0.4}}>Draft</span> &gt; 
                <span style={{opacity: selectedTransfer.status === 'waiting' ? 1 : 0.4}}> Waiting</span> &gt; 
                <span style={{opacity: selectedTransfer.status === 'ready' ? 1 : 0.4}}> Ready</span> &gt; 
                <span style={{opacity: selectedTransfer.status === 'done' ? 1 : 0.4}}> Done</span>
              </div>
            </div>
          </div>

          <div className="auth-card" style={{width:'100%', padding:'2rem', textAlign:'left'}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginBottom:'2rem', borderBottom:'1px solid #444', paddingBottom:'2rem'}}>
              <div>
                <p style={{color:'#888', marginBottom:'0.5rem'}}>From (Source)</p>
                <p style={{fontSize:'1.2rem'}}>{selectedTransfer.source_location_name}</p>
              </div>
              <div>
                <p style={{color:'#888', marginBottom:'0.5rem'}}>To (Destination)</p>
                <p style={{fontSize:'1.2rem'}}>{selectedTransfer.dest_location_name}</p>
              </div>
              <div>
                <p style={{color:'#888', marginBottom:'0.5rem'}}>Schedule Date</p>
                <p style={{fontSize:'1.2rem'}}>{selectedTransfer.schedule_date ? new Date(selectedTransfer.schedule_date).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p style={{color:'#888', marginBottom:'0.5rem'}}>Responsible</p>
                <p style={{fontSize:'1.2rem'}}>{selectedTransfer.created_by}</p>
              </div>
            </div>

            <h3 style={{color:'#ffb4a2', marginBottom:'1rem'}}>Products</h3>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>{selectedTransfer.status === 'done' ? 'Transferred' : 'Available in Source'}</th>
                </tr>
              </thead>
              <tbody>
                {selectedTransfer.items.map((item, idx) => {
                  const outOfStock = (item.quantity > item.on_hand) && (selectedTransfer.status !== 'done');
                  return (
                    <tr key={idx}>
                      <td style={{color: outOfStock ? '#ff4d4d' : 'inherit'}}>
                        [{item.sku}] {item.product_name}
                        {outOfStock && <span style={{marginLeft:'10px', fontSize:'0.8rem', background:'#ff4d4d', color:'white', padding:'2px 6px', borderRadius:'4px'}}>Not enough stock!</span>}
                      </td>
                      <td style={{color: outOfStock ? '#ff4d4d' : 'inherit'}}>{item.quantity}</td>
                      <td style={{color: outOfStock ? '#ff4d4d' : 'inherit'}}>
                        {selectedTransfer.status === 'done' ? item.quantity : item.on_hand}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}
