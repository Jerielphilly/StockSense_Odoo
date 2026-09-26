import { useState, useEffect } from 'react';
import { FileText, Search, ArrowUpRight, ArrowDownRight, RefreshCcw, Wrench } from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://127.0.0.1:8000/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setHistory(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading history...</div>;

  const getTypeIcon = (type) => {
    if (type === 'receipt') return <ArrowDownRight size={16} className="text-flux-neon" />;
    if (type === 'delivery') return <ArrowUpRight size={16} className="text-red-500" />;
    if (type === 'internal') return <RefreshCcw size={16} className="text-gray-500" />;
    return <Wrench size={16} className="text-flux-purple" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-flux-textMain flex items-center gap-3">
            <FileText className="text-flux-purple" size={32} /> Stock Move History (Ledger)
          </h1>
          <p className="text-flux-textSub text-sm mt-1">Immutable ledger of all inventory transactions.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-soft">
        
        <div className="flex justify-between items-center mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search references..." 
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
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reference</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Quantity</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">From</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">To</th>
                <th className="py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.filter(h => h.reference.toLowerCase().includes(searchTerm.toLowerCase()) || h.product_name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                        {getTypeIcon(item.type)}
                      </div>
                      <span className="font-bold text-flux-textMain">{item.reference}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                  <td className="py-4 px-4 font-semibold text-flux-textMain">[{item.sku}] {item.product_name}</td>
                  <td className="py-4 px-4 text-sm font-bold text-right">{item.quantity}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">{item.from_location}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">{item.to_location}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      item.status === 'done' ? 'bg-flux-neon/20 text-flux-dark' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">No history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
