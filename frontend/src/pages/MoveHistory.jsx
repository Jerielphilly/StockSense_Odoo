import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { IconSearch, IconBox, IconReceipt, IconDelivery, IconAdjustment, IconMoreHorizontal, IconChevronDown, IconTrendUp, IconTrendDown } from '../components/Icons';

const TYPE_COLORS = { receipt: 'op-receipt', delivery: 'op-delivery', adjustment: 'op-adjustment', internal: 'op-internal' };
const STATUS_COLORS = { done: 'status-done', draft: 'status-draft', waiting: 'status-waiting', ready: 'status-ready', canceled: 'status-canceled' };

export default function MoveHistory() {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await api.get('/moves'); setMoves(data); }
    catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const validate = async (id) => {
    try { await api.post(`/moves/${id}/validate`, {}); showToast('Move validated — stock updated!'); load(); }
    catch (e) { showToast(`Error: ${e.message}`); }
  };

  const deleteMove = async (id) => {
    if (!confirm('Delete this move record?')) return;
    try { await api.del(`/moves/${id}`); showToast('Move deleted.'); load(); }
    catch (e) { showToast(`Error: ${e.message}`); }
  };

  const filtered = moves.filter(m => {
    const q = search.toLowerCase();
    const ms = m.reference.toLowerCase().includes(q) || m.product_name.toLowerCase().includes(q);
    const mf = filterType === 'All' || m.type === filterType.toLowerCase();
    return ms && mf;
  });

  const inbound = moves.filter(m => m.type === 'receipt').length;
  const outbound = moves.filter(m => m.type === 'delivery').length;
  const pending = moves.filter(m => m.status !== 'done' && m.status !== 'canceled').length;
  const totalQty = moves.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="dashboard-content-layout">
      {toast && <div className="toast-bar">{toast}</div>}

      <div className="dashboard-sub-header">
        <div className="greeting-box">
          <h2>Move History</h2>
          <span className="live-status-pill">Stock Movements</span>
        </div>
      </div>

      <div className="stocks-summary-row">
        {[
          { label: 'Inbound (Receipts)', val: inbound, icon: <IconReceipt size={18} />, cls: 'kpi-green', circle: 'green-circle', trend: <IconTrendUp size={13} color="#22c55e" />, sub: 'Stock received' },
          { label: 'Outbound (Deliveries)', val: outbound, icon: <IconDelivery size={18} />, cls: 'kpi-blue', circle: 'blue-circle', trend: <IconTrendDown size={13} color="#3b82f6" />, sub: 'Stock dispatched' },
          { label: 'Pending Validation', val: pending, icon: <IconAdjustment size={18} />, cls: 'kpi-amber', circle: 'amber-circle', trend: <IconTrendDown size={13} color="#f59e0b" />, sub: 'Awaiting action' },
          { label: 'Total Units Moved', val: totalQty.toLocaleString(), icon: <IconBox size={18} />, cls: 'kpi-purple', circle: 'purple-circle', trend: <IconTrendUp size={13} color="#8b5cf6" />, sub: 'Cumulative throughput' },
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
          <h3>Movement Log {loading && <span className="loading-dot">...</span>}</h3>
          <div className="table-filter-bar">
            <div className="mini-search-pill">
              <IconSearch size={14} color="#94a3b8" />
              <input type="text" placeholder="Search reference or product..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {['All', 'Receipt', 'Delivery', 'Adjustment', 'Internal'].map(f => (
              <button key={f} className={`filter-tab-btn ${filterType === f ? 'active' : ''}`} onClick={() => setFilterType(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="table-responsive-box">
          <table className="clean-orders-table">
            <thead><tr>
              <th>Reference</th><th>Type</th><th>Product</th><th>From</th><th>To</th>
              <th>Qty</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td className="ref-cell">{m.reference}</td>
                  <td><span className={`op-type-pill ${TYPE_COLORS[m.type] || 'op-adjustment'}`}>{m.type}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '12px' }}>{m.product_name}</span>
                      <span className="sku-badge" style={{ width: 'fit-content' }}>{m.product_sku}</span>
                    </div>
                  </td>
                  <td className="location-cell">{m.source_location}</td>
                  <td className="location-cell">{m.dest_location}</td>
                  <td>
                    <span className={`direction-pill ${m.type === 'receipt' || m.type === 'internal' ? 'dir-in' : 'dir-out'}`}>
                      {m.type === 'receipt' || m.type === 'internal' ? '+' : '-'}{m.quantity}
                    </span>
                  </td>
                  <td><span className={`status-pill ${STATUS_COLORS[m.status] || 'status-draft'}`}>{m.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cluster">
                      {m.status !== 'done' && m.status !== 'canceled' && (
                        <button className="validate-btn" onClick={() => validate(m.id)} title="Validate — update stock">Validate</button>
                      )}
                      <button className="action-icon-btn danger-btn" onClick={() => deleteMove(m.id)} title="Delete">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  {moves.length === 0 ? 'No movements recorded yet.' : 'No matching records.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
