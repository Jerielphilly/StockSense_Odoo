import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building, MapPin, Plus } from 'lucide-react';

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
      setWhForm({ name: '', short_code: '', address: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...locForm, warehouse_id: parseInt(locForm.warehouse_id) })
      });
      if (!res.ok) throw new Error("Failed to create location");
      setLocForm({ name: '', short_code: '', warehouse_id: '' });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="max-w-7xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-flux-textMain flex items-center gap-3">
          <SettingsIcon className="text-flux-purple" size={32} /> System Settings
        </h1>
        <p className="text-flux-textSub text-sm mt-1">Configure your physical warehouses and logical bins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Warehouses Section */}
        <div>
          <div className="bg-white rounded-3xl p-8 shadow-soft mb-8">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-flux-textMain flex items-center gap-2"><Building size={20}/> Add Warehouse</h3>
            </div>
            
            <form onSubmit={handleWarehouseSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Warehouse Name</label>
                <input required type="text" value={whForm.name} onChange={e => setWhForm({...whForm, name: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm" placeholder="Main Warehouse" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Short Code</label>
                <input required type="text" value={whForm.short_code} onChange={e => setWhForm({...whForm, short_code: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm" placeholder="WH" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                <input type="text" value={whForm.address} onChange={e => setWhForm({...whForm, address: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm" placeholder="123 Stock St." />
              </div>
              <button type="submit" className="w-full bg-flux-dark text-white font-bold py-3 rounded-xl mt-4 hover:bg-gray-800 transition-colors flex justify-center items-center gap-2">
                <Plus size={18} /> Create Warehouse
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <h3 className="text-lg font-bold text-flux-textMain mb-4">Existing Warehouses</h3>
            <ul className="space-y-3">
              {warehouses.map(wh => (
                <li key={wh.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-xl">
                  <div>
                    <span className="font-bold text-sm text-flux-textMain">{wh.name}</span>
                    <span className="text-xs text-gray-500 block">{wh.address || 'No address provided'}</span>
                  </div>
                  <span className="bg-flux-neon/20 text-flux-dark px-2 py-1 rounded text-xs font-mono font-bold">{wh.short_code}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Locations Section */}
        <div>
          <div className="bg-white rounded-3xl p-8 shadow-soft mb-8">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-flux-textMain flex items-center gap-2"><MapPin size={20}/> Add Location (Bin)</h3>
            </div>
            
            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Parent Warehouse</label>
                <select required value={locForm.warehouse_id} onChange={e => setLocForm({...locForm, warehouse_id: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-purple text-sm">
                  <option value="">Select Warehouse...</option>
                  {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Location Name</label>
                <input required type="text" value={locForm.name} onChange={e => setLocForm({...locForm, name: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-purple text-sm" placeholder="Shelf A1" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Short Code</label>
                <input required type="text" value={locForm.short_code} onChange={e => setLocForm({...locForm, short_code: e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-purple text-sm" placeholder="A1" />
              </div>
              <button type="submit" className="w-full bg-flux-purple text-white font-bold py-3 rounded-xl mt-4 hover:bg-[#a395e9] transition-colors flex justify-center items-center gap-2">
                <Plus size={18} /> Create Location
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <h3 className="text-lg font-bold text-flux-textMain mb-4">Existing Locations</h3>
            <ul className="space-y-3">
              {locations.map(loc => (
                <li key={loc.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-xl">
                  <div>
                    <span className="font-bold text-sm text-flux-textMain">{loc.name}</span>
                    <span className="text-xs text-gray-500 block uppercase">{loc.type}</span>
                  </div>
                  <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-mono font-bold">{loc.full_code}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
