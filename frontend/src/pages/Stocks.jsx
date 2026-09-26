import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { IconSearch, IconBox, IconAlertTriangle, IconTag, IconMoreHorizontal, IconTrendUp, IconTrendDown, IconPlus } from '../components/Icons';

function AddProductModal({ locations, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', sku: '', category: '', uom: 'Units', initial_stock: 0, location_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku) { setError('Name and SKU are required.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/products', { ...form, initial_stock: Number(form.initial_stock), location_id: form.location_id ? Number(form.location_id) : null });
      onSaved();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Product</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="modal-form">
          {error && <div className="form-error">{error}</div>}
          <div className="form-row">
            <label>Product Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Steel Rod 12mm" />
          </div>
          <div className="form-row">
            <label>SKU *</label>
            <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="e.g. SKU-001" />
          </div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Category</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Raw Material" />
            </div>
            <div className="form-row">
              <label>Unit (UOM)</label>
              <select value={form.uom} onChange={e => set('uom', e.target.value)}>
                {['Units', 'pcs', 'kg', 'liters', 'meters', 'rolls', 'sheets', 'boxes'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row-2col">
            <div className="form-row">
              <label>Initial Stock Qty</label>
              <input type="number" min="0" value={form.initial_stock} onChange={e => set('initial_stock', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Location (for initial stock)</label>
              <select value={form.location_id} onChange={e => set('location_id', e.target.value)}>
                <option value="">— Select location —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Product'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Stocks() {
  const [stocks, setStocks] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stockData, locData] = await Promise.all([api.get('/stock'), api.get('/locations')]);
      // Group by product
      const map = {};
      for (const s of stockData) {
        if (!map[s.product_id]) {
          map[s.product_id] = {
            id: s.product_id, name: s.product_name, sku: s.product_sku,
            category: s.product_category || '—', uom: s.product_uom,
            quantity: 0, locations: []
          };
        }
        map[s.product_id].quantity += s.quantity;
        map[s.product_id].locations.push(`${s.location_name} (${s.quantity})`);
      }
      // Also get products with 0 stock via /products
      const allProds = await api.get('/products');
      for (const p of allProds) {
        if (!map[p.id]) {
          map[p.id] = { id: p.id, name: p.name, sku: p.sku, category: p.category || '—', uom: p.uom, quantity: 0, locations: [] };
        }
      }
      const list = Object.values(map).map(p => ({
        ...p,
        locationLabel: p.locations.length ? p.locations.join(', ') : 'No location',
        status: p.quantity === 0 ? 'Out of Stock' : p.quantity <= 10 ? 'Low Stock' : 'In Stock'
      }));
      setStocks(list);
      setLocations(locData);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product and all its stock records?')) return;
    try { await api.del(`/products/${id}`); showToast('Product deleted.'); load(); }
    catch (e) { showToast(`Error: ${e.message}`); }
  };

  const filtered = stocks.filter(s => {
    const q = search.toLowerCase();
    const ms = s.name.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q);
    const mf = filterStatus === 'All' || s.status === filterStatus;
    return ms && mf;
  });

  const inStock = stocks.filter(s => s.status === 'In Stock').length;
  const lowStock = stocks.filter(s => s.status === 'Low Stock').length;
  const outOfStock = stocks.filter(s => s.status === 'Out of Stock').length;
  const totalUnits = stocks.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="dashboard-content-layout">
      {toast && <div className="toast-bar">{toast}</div>}
      {showModal && <AddProductModal locations={locations} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); showToast('Product added!'); load(); }} />}

      <div className="dashboard-sub-header">
        <div className="greeting-box">
          <h2>Stock Inventory</h2>
          <span className="live-status-pill">Live</span>
        </div>
        <button className="btn-primary-header" onClick={() => setShowModal(true)}>
          <IconPlus size={14} /> Add Product
        </button>
      </div>

      <div className="stocks-summary-row">
        {[
          { label: 'In Stock', val: inStock, icon: <IconBox size={18} />, cls: 'kpi-green', circle: 'green-circle', trend: <IconTrendUp size={13} color="#22c55e" />, sub: 'Products healthy' },
          { label: 'Low Stock', val: lowStock, icon: <IconAlertTriangle size={18} />, cls: 'kpi-amber', circle: 'amber-circle', trend: <IconTrendDown size={13} color="#f59e0b" />, sub: 'Needs reorder' },
          { label: 'Out of Stock', val: outOfStock, icon: <IconTag size={18} />, cls: 'kpi-red', circle: 'red-circle', trend: <IconTrendDown size={13} color="#ef4444" />, sub: 'Immediate action' },
          { label: 'Total Units', val: totalUnits.toLocaleString(), icon: <IconBox size={18} />, cls: 'kpi-blue', circle: 'blue-circle', trend: <IconTrendUp size={13} color="#3b82f6" />, sub: 'Across all locations' },
        ].map(k => (
          <div key={k.label} className={`interoly-card stock-kpi-card ${k.cls}`}>
            <div className={`kpi-icon-circle ${k.circle}`}>{k.icon}</div>
            <div className="kpi-text-block"><span className="kpi-label">{k.label}</span><span className="kpi-number">{k.val}</span></div>
            <div className="kpi-trend-row">{k.trend}<span className="kpi-trend-val positive">{k.sub}</span></div>
          </div>
        ))}
      </div>

      <div className="interoly-card table-section-card">
        <div className="interoly-card-header">
          <h3>Available Stock {loading && <span className="loading-dot">...</span>}</h3>
          <div className="table-filter-bar">
            <div className="mini-search-pill">
              <IconSearch size={14} color="#94a3b8" />
              <input type="text" placeholder="Search SKU or product..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(f => (
              <button key={f} className={`filter-tab-btn ${filterStatus === f ? 'active' : ''}`} onClick={() => setFilterStatus(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="table-responsive-box">
          <table className="clean-orders-table">
            <thead><tr>
              <th>SKU</th><th>Product Name</th><th>Category</th><th>Location</th>
              <th>Quantity</th><th>Unit</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td><span className="sku-badge">{item.sku}</span></td>
                  <td className="ref-cell">{item.name}</td>
                  <td><span className="category-pill">{item.category}</span></td>
                  <td className="location-cell">{item.locationLabel}</td>
                  <td><span className={`qty-value ${item.quantity === 0 ? 'qty-zero' : item.quantity <= 10 ? 'qty-low' : 'qty-ok'}`}>{item.quantity.toLocaleString()}</span></td>
                  <td className="date-cell">{item.uom}</td>
                  <td><span className={`status-pill status-${item.status.toLowerCase().replace(/ /g, '-')}`}>{item.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="action-icon-btn danger-btn" title="Delete product" onClick={() => deleteProduct(item.id)}>✕</button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  {stocks.length === 0 ? 'No products yet. Add your first product!' : 'No matching stock items.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
