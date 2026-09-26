import { useState, useEffect } from 'react';
import { Package, Plus, Search } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      const payload = { ...formData, unit_cost: parseInt(formData.unit_cost) || 0, initial_stock: parseInt(formData.initial_stock) || 0 };
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
        const d = await res.json();
        throw new Error(d.detail || "Error adding product");
      }
      setFormData({ name: '', sku: '', category: '', uom: 'Units', unit_cost: 0, initial_stock: 0, location_id: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="text-gray-500 p-8">Loading products...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* Header Area */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-flux-textMain flex items-center gap-3">
            <Package className="text-flux-purple" size={32} /> Products Master
          </h1>
          <p className="text-flux-textSub text-sm mt-1">Manage all items, SKUs, and categories.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="bg-flux-neon text-flux-dark font-bold px-6 py-3 rounded-xl shadow-sm hover:bg-[#c6e541] transition-colors flex items-center gap-2"
        >
          {showForm ? 'Cancel' : <><Plus size={20} /> New Product</>}
        </button>
      </div>

      {/* Form Modal / Dropdown */}
      {showForm && (
        <div className="bg-white rounded-3xl p-8 shadow-soft mb-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-flux-purple opacity-5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h3 className="text-xl font-bold mb-6 text-flux-textMain relative z-10">Add New Product</h3>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Product Name *</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm transition-all" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">SKU (Internal Ref) *</label>
              <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm transition-all" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
              <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm transition-all" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Unit Cost ($)</label>
              <input type="number" min="0" value={formData.unit_cost} onChange={e => setFormData({...formData, unit_cost: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm transition-all" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase">Initial Stock (Optional)</label>
              <input type="number" min="0" value={formData.initial_stock} onChange={e => setFormData({...formData, initial_stock: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm transition-all" />
            </div>

            {formData.initial_stock > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Storage Location *</label>
                <select value={formData.location_id} onChange={e => setFormData({...formData, location_id: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm transition-all">
                  <option value="">Select Location</option>
                  {locations.filter(l => l.type === 'internal').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="lg:col-span-3 flex justify-end mt-4">
              <button type="submit" className="bg-flux-dark text-white px-8 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-800 transition-colors">
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Area */}
      <div className="bg-white rounded-3xl p-6 shadow-soft">
        
        {/* Table Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-72 rounded-full border border-gray-200 outline-none focus:border-flux-neon text-sm" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">SKU</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Name</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cost</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Unit</th>
              </tr>
            </thead>
            <tbody>
              {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())).map(prod => (
                <tr key={prod.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-4">
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-mono font-medium group-hover:bg-white">{prod.sku}</span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-flux-textMain">{prod.name}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">{prod.category || '-'}</td>
                  <td className="py-4 px-4 text-sm font-medium text-flux-textMain">${prod.unit_cost}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">{prod.uom}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">No products found. Create one above!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
