import { useState, useEffect } from 'react';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Navigation State: 'list' | 'create' | 'detail'
  const [view, setView] = useState('list');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Create Form State
  const [formData, setFormData] = useState({ contact: '', schedule_date: '', dest_location_id: '' });
  const [formItems, setFormItems] = useState([{ product_id: '', quantity: 1 }]);

  const fetchReceipts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/receipts', { headers: { 'Authorization': `Bearer ${token}` }});
      if (res.ok) setReceipts(await res.json());
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
    fetchReceipts();
    fetchDropdowns();
  }, []);

  const openDetail = async (ref) => {
    try {
      const token = localStorage.getItem('token');
      // encodeURIComponent because ref is WH/IN/0001
      const res = await fetch(`http://127.0.0.1:8000/receipts/${encodeURIComponent(ref)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedReceipt(await res.json());
        setView('detail');
      }
    } catch (err) { alert("Failed to fetch receipt details."); }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dest_location_id) return alert("Select a destination location!");
    
    // Filter out incomplete items
    const items = formItems.filter(i => i.product_id && i.quantity > 0).map(i => ({
      product_id: parseInt(i.product_id),
      quantity: parseInt(i.quantity)
    }));
    
    if (items.length === 0) return alert("Add at least one valid product!");

    const payload = {
      contact: formData.contact,
      schedule_date: formData.schedule_date ? new Date(formData.schedule_date).toISOString() : null,
      dest_location_id: parseInt(formData.dest_location_id),
      items: items
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create receipt");
      
      alert("Receipt created successfully!");
      setFormData({ contact: '', schedule_date: '', dest_location_id: '' });
      setFormItems([{ product_id: '', quantity: 1 }]);
      setView('list');
      fetchReceipts();
    } catch (err) { alert(err.message); }
  };

  const handleMarkReady = async () => {
    try {
      const token = localStorage.getItem('token');
      // Mark all items in the receipt as ready
      for (const item of selectedReceipt.items) {
        await fetch(`http://127.0.0.1:8000/moves/${item.move_id}/ready`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      openDetail(selectedReceipt.reference); // Refresh
    } catch (err) { alert("Error marking as ready"); }
  };

  const handleValidate = async () => {
    try {
      const token = localStorage.getItem('token');
      for (const item of selectedReceipt.items) {
        await fetch(`http://127.0.0.1:8000/moves/${item.move_id}/validate`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      openDetail(selectedReceipt.reference); // Refresh
    } catch (err) { alert("Error validating: " + err.message); }
  };

  return (
    <div className="page-container">
      
      {/* ---------- LIST VIEW ---------- */}
      {view === 'list' && (
        <>
          <div className="page-header">
            <div>
              <h2>Receipts</h2>
              <p className="subtitle">List of incoming stock.</p>
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
                  <th>Contact</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr><td colSpan="5" style={{textAlign:'center'}}>No receipts found.</td></tr>
                ) : receipts.map((r, idx) => (
                  <tr key={idx} style={{cursor:'pointer'}} onClick={() => openDetail(r.reference)}>
                    <td style={{color: '#ffb4a2'}}>{r.reference}</td>
                    <td>Vendor</td>
                    <td>{r.dest_location_name}</td>
                    <td>{r.contact}</td>
                    <td>{r.status.toUpperCase()}</td>
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
            <h2>New Receipt</h2>
            <button className="small-btn" onClick={() => setView('list')}>Cancel</button>
          </div>
          <form className="auth-card" style={{width: '100%', padding: '2rem'}} onSubmit={handleCreateSubmit}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginBottom: '2rem'}}>
              <div className="input-group">
                <label>Receive From (Contact)</label>
                <input type="text" required value={formData.contact} onChange={e=>setFormData({...formData, contact: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Schedule Date</label>
                <input type="date" required value={formData.schedule_date} onChange={e=>setFormData({...formData, schedule_date: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Destination Location</label>
                <select required value={formData.dest_location_id} onChange={e=>setFormData({...formData, dest_location_id: e.target.value})} style={{padding:'0.8rem', background:'#1a1a1a', color:'white', border:'2px solid #ffb4a2'}}>
                  <option value="">-- Choose --</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>

            <h3 style={{color:'#ffb4a2', marginBottom:'1rem'}}>Products</h3>
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
            <button type="submit" className="primary-btn">Save Receipt</button>
          </form>
        </>
      )}

      {/* ---------- DETAIL VIEW ---------- */}
      {view === 'detail' && selectedReceipt && (
        <>
          <div className="page-header" style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
              <h2>{selectedReceipt.reference}</h2>
              <button className="small-btn" onClick={() => setView('list')}>Back to List</button>
            </div>
            
            {/* Status Bar */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'#242424', padding:'1rem', borderRadius:'8px', border:'1px solid #444'}}>
              <div style={{display:'flex', gap:'1rem'}}>
                {selectedReceipt.status === 'draft' && <button className="primary-btn" style={{marginTop:0}} onClick={handleMarkReady}>Mark as TODO</button>}
                {selectedReceipt.status === 'ready' && <button className="primary-btn" style={{marginTop:0}} onClick={handleValidate}>Validate</button>}
                {selectedReceipt.status === 'done' && <button className="small-btn" onClick={() => window.print()}>Print</button>}
                <button className="small-btn">Cancel</button>
              </div>
              <div style={{color:'#ffb4a2', fontWeight:'bold', fontSize:'1.1rem'}}>
                <span style={{opacity: selectedReceipt.status === 'draft' ? 1 : 0.4}}>Draft</span> &gt; 
                <span style={{opacity: selectedReceipt.status === 'ready' ? 1 : 0.4}}> Ready</span> &gt; 
                <span style={{opacity: selectedReceipt.status === 'done' ? 1 : 0.4}}> Done</span>
              </div>
            </div>
          </div>

          <div className="auth-card" style={{width:'100%', padding:'2rem', textAlign:'left'}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem', marginBottom:'2rem', borderBottom:'1px solid #444', paddingBottom:'2rem'}}>
              <div>
                <p style={{color:'#888', marginBottom:'0.5rem'}}>Receive From</p>
                <p style={{fontSize:'1.2rem'}}>{selectedReceipt.contact}</p>
              </div>
              <div>
                <p style={{color:'#888', marginBottom:'0.5rem'}}>Schedule Date</p>
                <p style={{fontSize:'1.2rem'}}>{selectedReceipt.schedule_date ? new Date(selectedReceipt.schedule_date).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p style={{color:'#888', marginBottom:'0.5rem'}}>Responsible</p>
                <p style={{fontSize:'1.2rem'}}>{selectedReceipt.created_by}</p>
              </div>
            </div>

            <h3 style={{color:'#ffb4a2', marginBottom:'1rem'}}>Products</h3>
            <table className="custom-table">
              <thead><tr><th>Product</th><th>Quantity</th></tr></thead>
              <tbody>
                {selectedReceipt.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>[{item.sku}] {item.product_name}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}
