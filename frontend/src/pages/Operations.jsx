import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { IconReceipt, IconDelivery, IconAdjustment, IconPlus, IconSearch } from '../components/Icons';

const TYPE_META = {
  receipt:    { label: 'Receipt',    icon: <IconReceipt size={16} />,    color: '#22c55e', bg: '#ecfdf5', pill: 'op-receipt',    desc: 'Goods received from a vendor into a location.' },
  delivery:   { label: 'Delivery',   icon: <IconDelivery size={16} />,   color: '#3b82f6', bg: '#eff6ff', pill: 'op-delivery',   desc: 'Goods sent out from a location to a customer.' },
  adjustment: { label: 'Adjustment', icon: <IconAdjustment size={16} />, color: '#f59e0b', bg: '#fffbeb', pill: 'op-adjustment', desc: 'Manual correction of stock quantity.' },
};

const STATUS_COLORS = { done: 'status-done', draft: 'status-draft', waiting: 'status-waiting', ready: 'status-ready', canceled: 'status-canceled' };

function CreateMoveModal({ type, products, locations, onClose, onSaved }) {
  const meta = TYPE_META[type];
  const [form, setForm] = useState({ product_id: '', quantity: 1, source_location_id: '', dest_location_id: '', reference: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.product_id || !form.quantity) { setError('Product and quantity are required.'); return; }
    if (type === 'delivery' && !form.source_location_id) { setError('Source location is required for delivery.'); return; }
    if (type === 'receipt' && !form.dest_location_id) { setError('Destination location is required for receipt.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/moves', {
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
        source_location_id: form.source_location_id ? Number(form.source_location_id) : null,
        dest_location_id: form.dest_location_id ? Number(form.dest_location_id) : null,
        type,
        reference: form.reference || undefined,
        status: 'draft',
      });
      onSaved();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderLeft: `4px solid ${meta.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: meta.bg, color: meta.color, padding: '6px', borderRadius: 4 }}>{meta.icon}</span>
            <h3>New {meta.label}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: '#64748b', padding: '8px 20px 0' }}>{meta.desc}</p>
        <form onSubmit={submit} className="modal-form">
          {error && <div className="form-error">{error}</div>}
          <div className="form-row">
            <label>Reference (optional)</label>
            <input value={form.reference} onChange={e => set('reference', e.target.value)} placeholder={`e.g. WH/${type.toUpperCase().slice(0,3)}/00001`} />
          </div>
          <div className="form-row">
            <label>Product *</label>
            <select value={form.product_id} onChange={e => set('product_id', e.target.value)}>
              <option value="">— Select product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Quantity *</label>
            <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
          </div>
          {(type === 'delivery' || type === 'adjustment' || type === 'internal') && (
            <div className="form-row">
              <label>From Location {type === 'delivery' ? '*' : ''}</label>
              <select value={form.source_location_id} onChange={e => set('source_location_id', e.target.value)}>
                <option value="">— None (Vendor / External) —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}
          {(type === 'receipt' || type === 'adjustment' || type === 'internal') && (
            <div className="form-row">
              <label>To Location {type === 'receipt' ? '*' : ''}</label>
              <select value={form.dest_location_id} onChange={e => set('dest_location_id', e.target.value)}>
                <option value="">— None (Customer / External) —</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating…' : `Create ${meta.label}`}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OperationTab({ type }) {
  const [moves, setMoves] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const meta = TYPE_META[type];

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allMoves, prods, locs] = await Promise.all([api.get('/moves'), api.get('/products'), api.get('/locations')]);
      setMoves(allMoves.filter(m => m.type === type));
      setProducts(prods);
      setLocations(locs);
    } catch { }
    setLoading(false);
  }, [type]);

  useEffect(() => { load(); }, [load]);

  const validate = async (id) => {
    try { await api.post(`/moves/${id}/validate`, {}); showToast('Validated! Stock updated.'); load(); }
    catch (e) { showToast(`Error: ${e.message}`); }
  };

  const deleteMove = async (id) => {
    if (!confirm('Delete this record?')) return;
    try { await api.del(`/moves/${id}`); showToast('Deleted.'); load(); }
    catch (e) { showToast(`Error: ${e.message}`); }
  };

  const filtered = moves.filter(m => m.product_name.toLowerCase().includes(search.toLowerCase()) || m.reference.toLowerCase().includes(search.toLowerCase()));

  const pending = moves.filter(m => m.status !== 'done' && m.status !== 'canceled').length;
  const done = moves.filter(m => m.status === 'done').length;

  return (
    <div>
      {toast && <div className="toast-bar">{toast}</div>}
      {showModal && <CreateMoveModal type={type} products={products} locations={locations} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); showToast(`${meta.label} created!`); load(); }} />}

      <div className="ops-tab-header">
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="ops-stat-box" style={{ borderColor: meta.color }}>
            <span className="ops-stat-val" style={{ color: meta.color }}>{pending}</span>
            <span className="ops-stat-lbl">Pending</span>
          </div>
          <div className="ops-stat-box">
            <span className="ops-stat-val">{done}</span>
            <span className="ops-stat-lbl">Completed</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="mini-search-pill">
            <IconSearch size={14} color="#94a3b8" />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary-header" onClick={() => setShowModal(true)}>
            <IconPlus size={14} /> New {meta.label}
          </button>
        </div>
      </div>

      <div className="table-responsive-box">
        <table className="clean-orders-table">
          <thead><tr>
            <th>Reference</th><th>Product</th><th>SKU</th><th>From</th><th>To</th><th>Qty</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td className="ref-cell">{m.reference}</td>
                <td style={{ fontWeight: 600, color: '#0f172a', fontSize: 12 }}>{m.product_name}</td>
                <td><span className="sku-badge">{m.product_sku}</span></td>
                <td className="location-cell">{m.source_location}</td>
                <td className="location-cell">{m.dest_location}</td>
                <td style={{ fontWeight: 700 }}>{m.quantity}</td>
                <td><span className={`status-pill ${STATUS_COLORS[m.status] || 'status-draft'}`}>{m.status}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div className="actions-cluster">
                    {m.status !== 'done' && m.status !== 'canceled' && (
                      <button className="validate-btn" onClick={() => validate(m.id)}>Validate</button>
                    )}
                    <button className="action-icon-btn danger-btn" onClick={() => deleteMove(m.id)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                No {meta.label.toLowerCase()} records yet.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Operations({ defaultTab }) {
  const tabs = ['receipt', 'delivery', 'adjustment'];
  const [activeTab, setActiveTab] = useState(defaultTab || 'receipt');

  return (
    <div className="dashboard-content-layout">
      <div className="dashboard-sub-header">
        <div className="greeting-box">
          <h2>Operations</h2>
          <span className="live-status-pill">Inventory Movements</span>
        </div>
      </div>

      <div className="interoly-card" style={{ padding: 0 }}>
        <div className="ops-tab-nav">
          {tabs.map(t => {
            const m = TYPE_META[t];
            return (
              <button key={t} className={`ops-tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}
                style={activeTab === t ? { borderBottom: `3px solid ${m.color}`, color: m.color } : {}}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{m.icon} {m.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ padding: '16px 20px' }}>
          <OperationTab key={activeTab} type={activeTab} />
        </div>
      </div>
    </div>
  );
}
