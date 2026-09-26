import { useState, useEffect } from 'react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', uom: 'Units', unit_cost: 0, initial_stock: 0, location_id: ''
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [prodRes, locRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/products', { headers }),
        fetch('http://127.0.0.1:8000/locations', { headers })
      ]);
      
      if (prodRes.ok) setProducts(await prodRes.json());
      if (locRes.ok) setLocations(await locRes.json());
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        uom: formData.uom,
        unit_cost: parseInt(formData.unit_cost) || 0,
        initial_stock: parseInt(formData.initial_stock) || 0
      };
      
      if (payload.initial_stock > 0) {
        if (!formData.location_id) return alert("Please select a location for the initial stock!");
        payload.location_id = parseInt(formData.location_id);
      }

      const res = await fetch('http://127.0.0.1:8000/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create product");
      }
      
      alert("Product Created successfully!");
      setShowForm(false);
      setFormData({ name: '', sku: '', category: '', uom: 'Units', unit_cost: 0, initial_stock: 0, location_id: '' });
      fetchData();
      
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p className="subtitle">Manage your product catalog and initial stock.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowForm(!showForm)} style={{marginTop:0}}>
          {showForm ? 'Close Form' : '+ New Product'}
        </button>
      </div>

      {showForm && (
        <div className="auth-card" style={{width: '100%', marginBottom: '2rem', textAlign: 'left', padding: '2rem'}}>
          <h3 style={{color:'#ffb4a2', marginBottom: '1rem'}}>Create New Product</h3>
          <form onSubmit={handleSubmit} style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: '1rem'}}>
            <div className="input-group">
              <label>Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="input-group">
              <label>SKU / Code</label>
              <input type="text" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Category</label>
              <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Unit of Measure (UOM)</label>
              <input type="text" value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Per Unit Cost (Rs)</label>
              <input type="number" min="0" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Initial Stock (Optional)</label>
              <input type="number" min="0" value={formData.initial_stock} onChange={e => setFormData({...formData, initial_stock: e.target.value})} />
            </div>
            
            {formData.initial_stock > 0 && (
              <div className="input-group">
                <label>Select Location for Initial Stock</label>
                <div style={{display:'flex', gap:'0.5rem'}}>
                  <select 
                    style={{flex:1, padding:'0.8rem', borderRadius:'8px', background:'#1a1a1a', color:'white', border:'2px solid #ffb4a2'}}
                    value={formData.location_id} 
                    onChange={e => setFormData({...formData, location_id: e.target.value})}
                  >
                    <option value="">-- Choose Location --</option>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
              </div>
            )}
            
            <div style={{gridColumn: '1 / -1', marginTop: '1rem'}}>
              <button type="submit" className="primary-btn" style={{width: '100%'}}>Save Product</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>UOM</th>
              <th>Unit Cost</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem'}}>No products yet. Click "+ New Product" to add one!</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.id}>
                  <td>{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category || '-'}</td>
                  <td>{p.uom}</td>
                  <td>{p.unit_cost} Rs</td>
                  <td>{p.created_by}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
