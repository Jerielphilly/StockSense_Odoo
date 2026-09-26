import { useState, useEffect } from 'react';
import { Layers, AlertCircle, Edit2, Search } from 'lucide-react';

export default function Stock() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStock = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://127.0.0.1:8000/stock', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setStockData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStock(); }, []);

  const handleUpdateStock = async (item) => {
    const newCountStr = window.prompt(`Physical count for ${item.product_name} at ${item.location_name}:`, item.on_hand);
    if (newCountStr === null || newCountStr === "") return;
    
    const newCount = parseInt(newCountStr, 10);
    if (isNaN(newCount) || newCount < 0) return alert("Invalid quantity!");

    const difference = newCount - item.on_hand;
    if (difference === 0) return;

    try {
      const token = localStorage.getItem('token');
      const movePayload = {
        product_id: item.product_id,
        type: 'adjustment',
        quantity: Math.abs(difference),
        reference: 'Manual Count Update'
      };
      
      if (difference > 0) movePayload.dest_location_id = item.location_id;
      else movePayload.source_location_id = item.location_id;

      const resMove = await fetch('http://127.0.0.1:8000/moves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(movePayload)
      });
      if (!resMove.ok) throw new Error("Failed to create adjustment");
      const moveData = await resMove.json();

      await fetch(`http://127.0.0.1:8000/moves/${moveData.id}/ready`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      
      const resVal = await fetch(`http://127.0.0.1:8000/moves/${moveData.id}/validate`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (!resVal.ok) throw new Error("Failed to validate adjustment");

      alert("Stock updated successfully!");
      fetchStock();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading stock...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-flux-textMain flex items-center gap-3">
          <Layers className="text-flux-purple" size={32} /> Real-Time Stock Levels
        </h1>
        <p className="text-flux-textSub text-sm mt-1">Monitor on-hand inventory and make physical adjustments.</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-soft">
        
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search inventory..." 
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
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">On Hand</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reserved</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Available</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockData.filter(s => s.product_name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => {
                const available = item.on_hand - item.reserved;
                const isLow = available < 5;
                
                return (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-flux-textMain">{item.product_name}</td>
                    <td className="py-4 px-4">
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">{item.location_name}</span>
                    </td>
                    <td className="py-4 px-4 text-sm font-bold">{item.on_hand}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{item.reserved}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isLow ? 'text-red-500' : 'text-green-500'}`}>
                          {available}
                        </span>
                        {isLow && <AlertCircle size={14} className="text-red-500" />}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => handleUpdateStock(item)}
                        className="text-flux-purple hover:text-flux-dark transition-colors p-2 rounded-lg hover:bg-gray-100"
                        title="Update Stock Count"
                      >
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {stockData.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">No stock found in any location.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
