import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { IconPlus } from '../components/Icons';

export default function Settings({ defaultTab }) {
  const [tab, setTab] = useState(defaultTab || 'locations');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', type: 'internal' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try { setLocations(await api.get('/locations')); }
    catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addLocation = async (e) => {
    e.preventDefault();
    if (!form.name) { setError('Location name is required.'); return; }
    setSaving(true); setError('');
    try { await api.post('/locations', form); showToast('Location added!'); setForm({ name: '', type: 'internal' }); load(); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const deleteLocation = async (id) => {
    if (!confirm('Delete this location?')) return;
    try { await api.del(`/locations/${id}`); showToast('Location deleted.'); load(); }
    catch (e) { showToast(`Error: ${e.message}`); }
  };

  const TYPE_BADGE = { internal: '#dcfce7|#16a34a', vendor: '#dbeafe|#2563eb', customer: '#fef3c7|#d97706' };

  return (
    <div className="dashboard-content-layout">
      {toast && <div className="toast-bar">{toast}</div>}

      <div className="dashboard-sub-header">
        <div className="greeting-box"><h2>Settings</h2></div>
      </div>

      <div className="interoly-card" style={{ padding: 0 }}>
        <div className="ops-tab-nav">
          <button className={`ops-tab-btn ${tab === 'locations' ? 'active' : ''}`} onClick={() => setTab('locations')}
            style={tab === 'locations' ? { borderBottom: '3px solid #22c55e', color: '#22c55e' } : {}}>
            Locations
          </button>
          <button className={`ops-tab-btn ${tab === 'warehouse' ? 'active' : ''}`} onClick={() => setTab('warehouse')}
            style={tab === 'warehouse' ? { borderBottom: '3px solid #22c55e', color: '#22c55e' } : {}}>
            Warehouse Info
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {tab === 'locations' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
              {/* Add Location Form */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Add New Location</h4>
                <form onSubmit={addLocation}>
                  {error && <div className="form-error">{error}</div>}
                  <div className="form-row">
                    <label>Location Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rack A-01" />
                  </div>
                  <div className="form-row">
                    <label>Location Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="internal">Internal (Warehouse)</option>
                      <option value="vendor">Vendor (Supplier)</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }} disabled={saving}>
                    <IconPlus size={14} /> {saving ? 'Adding…' : 'Add Location'}
                  </button>
                </form>
              </div>

              {/* Locations List */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
                  All Locations {loading && <span className="loading-dot">...</span>}
                </h4>
                {locations.length === 0 && !loading && (
                  <p style={{ color: '#94a3b8', fontSize: 13 }}>No locations created yet.</p>
                )}
                <div className="locations-list">
                  {locations.map(loc => {
                    const [bg, color] = (TYPE_BADGE[loc.type] || '#f1f5f9|#475569').split('|');
                    return (
                      <div key={loc.id} className="location-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{loc.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', background: bg, color, borderRadius: 3 }}>{loc.type}</span>
                        </div>
                        <button className="action-icon-btn danger-btn" onClick={() => deleteLocation(loc.id)} title="Delete">✕</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'warehouse' && (
            <div style={{ maxWidth: 480 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Warehouse Configuration</h4>
              <div className="form-row"><label>Warehouse Name</label><input defaultValue="Main Warehouse" /></div>
              <div className="form-row"><label>Short Code</label><input defaultValue="WH" /></div>
              <div className="form-row"><label>Address</label><input defaultValue="Telangana, India" /></div>
              <div className="form-row">
                <label>Default In Route</label>
                <select><option>Receive in 1 step (stock)</option><option>Receive in 2 steps</option></select>
              </div>
              <div className="form-row">
                <label>Default Out Route</label>
                <select><option>Ship in 1 step</option><option>Pick + Ship (2 steps)</option></select>
              </div>
              <button className="btn-primary" style={{ marginTop: 8 }}>Save Settings</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
