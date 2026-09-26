import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowDownToLine, ArrowUpFromLine, Repeat } from 'lucide-react';

export default function Operations() {
  const [stats, setStats] = useState({ pending_receipts: 0, pending_deliveries: 0, pending_transfers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://127.0.0.1:8000/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setStats(data.kpis);
        }
      } catch (err) {
        console.error("Failed to fetch operations stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-gray-500">Loading Operations...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-flux-textMain flex items-center gap-3">
          <Activity className="text-flux-purple" size={32} /> Operations Center
        </h1>
        <p className="text-flux-textSub text-sm mt-1">Select an operation type to manage stock movements.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Receipts Card */}
        <Link to="/operations/receipts" className="block group">
          <div className="bg-white rounded-3xl p-8 shadow-soft border border-transparent group-hover:border-flux-neon transition-all">
            <div className="w-16 h-16 rounded-2xl bg-flux-neon/20 text-flux-dark flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ArrowDownToLine size={32} />
            </div>
            <h3 className="text-2xl font-bold text-flux-textMain mb-2">Receipts</h3>
            <p className="text-gray-500 text-sm mb-6">Receive incoming stock from vendors.</p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${stats.pending_receipts > 0 ? 'bg-flux-neon text-flux-dark' : 'bg-gray-100 text-gray-500'}`}>
                {stats.pending_receipts} To Process
              </span>
            </div>
          </div>
        </Link>

        {/* Deliveries Card */}
        <Link to="/operations/deliveries" className="block group">
          <div className="bg-white rounded-3xl p-8 shadow-soft border border-transparent group-hover:border-flux-purple transition-all">
            <div className="w-16 h-16 rounded-2xl bg-flux-purple/20 text-flux-purple flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ArrowUpFromLine size={32} />
            </div>
            <h3 className="text-2xl font-bold text-flux-textMain mb-2">Deliveries</h3>
            <p className="text-gray-500 text-sm mb-6">Ship outgoing stock to customers.</p>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${stats.pending_deliveries > 0 ? 'bg-flux-purple text-white' : 'bg-gray-100 text-gray-500'}`}>
                {stats.pending_deliveries} To Process
              </span>
            </div>
          </div>
        </Link>

        {/* Transfers Card */}
        <Link to="/operations/transfers" className="block group">
          <div className="bg-[#1c1c1e] rounded-3xl p-8 shadow-soft border border-transparent group-hover:border-gray-500 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="w-16 h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
              <Repeat size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Transfers</h3>
            <p className="text-gray-400 text-sm mb-6 relative z-10">Move stock between internal bins.</p>
            <div className="flex items-center gap-2 relative z-10">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${stats.pending_transfers > 0 ? 'bg-white text-flux-dark' : 'bg-gray-800 text-gray-400'}`}>
                {stats.pending_transfers} To Process
              </span>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
