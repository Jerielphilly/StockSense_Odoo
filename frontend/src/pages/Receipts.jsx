import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDownToLine, Plus, Search, Calendar, User, MapPin } from 'lucide-react';

export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const [view, setView] = useState('list');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

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

  useEffect(() => { fetchReceipts(); fetchDropdowns(); }, []);

  const openDetail = async (ref) => {
    try {
      const token = localStorage.getItem('token');
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
    
    const validItems = formItems.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) return alert("Add at least one product.");

    try {
      const token = localStorage.getItem('token');
      const payload = { ...formData, dest_location_id: parseInt(formData.dest_location_id), items: validItems.map(i => ({...i, product_id: parseInt(i.product_id)})) };
      const res = await fetch('http://127.0.0.1:8000/receipts', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create receipt");
      
      setFormData({ contact: '', schedule_date: '', dest_location_id: '' });
      setFormItems([{ product_id: '', quantity: 1 }]);
      setView('list');
      fetchReceipts();
    } catch (err) { alert(err.message); }
  };

  const updateStatus = async (action) => {
    try {
      const token = localStorage.getItem('token');
      const url = action === 'ready' 
        ? `http://127.0.0.1:8000/receipts/${encodeURIComponent(selectedReceipt.reference)}/ready`
        : `http://127.0.0.1:8000/moves/${selectedReceipt.items[0].move_id}/validate`; 
      
      const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
      if (!res.ok) throw new Error(`Failed to mark as ${action}`);
      
      openDetail(selectedReceipt.reference); // refresh
      fetchReceipts();
    } catch (err) { alert(err.message); }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-500',
      'waiting': 'bg-yellow-100 text-yellow-600',
      'ready': 'bg-blue-100 text-blue-600',
      'done': 'bg-flux-neon/20 text-flux-dark'
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${colors[status] || colors.draft}`}>{status}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-flux-textMain flex items-center gap-3">
            <ArrowDownToLine className="text-flux-neon" size={32} /> Receipts
          </h1>
          <p className="text-flux-textSub text-sm mt-1">Receive incoming stock from vendors.</p>
        </div>
        {view === 'list' ? (
          <button onClick={() => setView('create')} className="bg-flux-dark text-white font-bold px-6 py-3 rounded-xl shadow-sm hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Plus size={20} /> New Receipt
          </button>
        ) : (
          <button onClick={() => setView('list')} className="text-gray-500 hover:text-flux-dark font-medium px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
            <ArrowLeft size={18} /> Back to List
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reference</th>
                  <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor / Contact</th>
                  <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Schedule Date</th>
                  <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map(r => (
                  <tr key={r.reference} onClick={() => openDetail(r.reference)} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors group">
                    <td className="py-4 px-4 font-bold text-flux-textMain group-hover:text-flux-purple transition-colors">{r.reference}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{r.contact || '-'}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{r.schedule_date ? new Date(r.schedule_date).toLocaleDateString() : '-'}</td>
                    <td className="py-4 px-4">{getStatusBadge(r.status)}</td>
                  </tr>
                ))}
                {receipts.length === 0 && <tr><td colSpan="4" className="py-12 text-center text-gray-400">No receipts found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="bg-white rounded-3xl p-8 shadow-soft max-w-4xl">
          <h3 className="text-xl font-bold mb-6 text-flux-textMain">Draft New Receipt</h3>
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2"><User size={14}/> Vendor / Contact</label>
                <input type="text" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2"><Calendar size={14}/> Scheduled Date</label>
                <input type="date" value={formData.schedule_date} onChange={e => setFormData({...formData, schedule_date: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm" />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2"><MapPin size={14}/> Destination Location *</label>
                <select required value={formData.dest_location_id} onChange={e => setFormData({...formData, dest_location_id: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm">
                  <option value="">Select Location</option>
                  {locations.filter(l => l.type === 'internal').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-flux-textMain mb-4">Operations (Products to Receive)</h4>
              <div className="space-y-3">
                {formItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <select required value={item.product_id} onChange={e => {
                      const newItems = [...formItems];
                      newItems[idx].product_id = e.target.value;
                      setFormItems(newItems);
                    }} className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm">
                      <option value="">Select Product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                    </select>
                    <input type="number" required min="1" value={item.quantity} onChange={e => {
                      const newItems = [...formItems];
                      newItems[idx].quantity = e.target.value;
                      setFormItems(newItems);
                    }} className="w-32 px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm" />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setFormItems([...formItems, { product_id: '', quantity: 1 }])} className="mt-4 text-sm font-bold text-flux-purple hover:text-flux-dark transition-colors">
                + Add another line
              </button>
            </div>

            <div className="flex justify-end pt-6">
              <button type="submit" className="bg-flux-neon text-flux-dark px-8 py-3 rounded-xl font-bold shadow-sm hover:bg-[#c6e541] transition-colors">
                Save as Draft
              </button>
            </div>
          </form>
        </div>
      )}

      {view === 'detail' && selectedReceipt && (
        <div className="bg-white rounded-3xl p-8 shadow-soft">
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-100">
            <div>
              <h2 className="text-3xl font-bold text-flux-textMain mb-2">{selectedReceipt.reference}</h2>
              <p className="text-gray-500 text-sm">Vendor: {selectedReceipt.contact || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(selectedReceipt.status)}
              
              {selectedReceipt.status === 'draft' && (
                <button onClick={() => updateStatus('ready')} className="bg-flux-dark text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">
                  Mark as To-Do
                </button>
              )}
              {selectedReceipt.status === 'ready' && (
                <button onClick={() => updateStatus('validate')} className="bg-flux-neon text-flux-dark px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#c6e541] transition-colors">
                  Validate
                </button>
              )}
              {selectedReceipt.status === 'done' && (
                <button onClick={() => window.print()} className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-2 rounded-xl font-bold text-sm hover:border-gray-300 transition-colors">
                  Print PDF
                </button>
              )}
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {selectedReceipt.items.map(item => (
                <tr key={item.move_id} className="border-b border-gray-50">
                  <td className="py-4 px-4 font-semibold text-flux-textMain">[{item.sku}] {item.product_name}</td>
                  <td className="py-4 px-4 text-right font-bold text-flux-textMain">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
