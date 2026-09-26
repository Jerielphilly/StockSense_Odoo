import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Package, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState({ total_products: 0, pending_receipts: 0, pending_deliveries: 0, pending_transfers: 0 });
  const [recentHistory, setRecentHistory] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch KPIs
        const resKpi = await fetch('http://127.0.0.1:8000/dashboard', { headers });
        if (resKpi.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        if (resKpi.ok) {
          const dataKpi = await resKpi.json();
          setKpis(dataKpi.kpis);
        }
        
        // Fetch Chart Data
        const resChart = await fetch('http://127.0.0.1:8000/analytics/flow', { headers });
        if (resChart.ok) setChartData(await resChart.json());
        
        // Fetch History for Activity Feed
        const resHist = await fetch('http://127.0.0.1:8000/history', { headers });
        if (resHist.ok) {
          const histData = await resHist.json();
          setRecentHistory(histData.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-flux-textMain mb-2">Inventory Overview</h1>
        <p className="text-flux-textSub text-sm">Take control of your warehouse operations today!</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Total Products" value={kpis.total_products} icon={Package} bg="bg-white" />
        <KpiCard title="Pending Receipts" value={kpis.pending_receipts} icon={ArrowDownRight} bg="bg-flux-neon" text="text-flux-dark" />
        <KpiCard title="Pending Deliveries" value={kpis.pending_deliveries} icon={ArrowUpRight} bg="bg-flux-purple" text="text-white" />
        <KpiCard title="Internal Transfers" value={kpis.pending_transfers} icon={Activity} bg="bg-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-flux-textMain text-lg">Stock Flow Analysis</h3>
            <span className="text-xs font-medium text-gray-500">Last 7 Days</span>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} 
                />
                <Bar dataKey="IN" name="Stock In" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-in-${index}`} fill="#b4a7f9" />
                  ))}
                </Bar>
                <Bar dataKey="OUT" name="Stock Out" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-out-${index}`} fill="#1c1c1e" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center gap-6 mt-4 pl-8">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-flux-purple"></div>
              <span className="text-xs font-medium text-gray-500">Stock IN</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-flux-dark"></div>
              <span className="text-xs font-medium text-gray-500">Stock OUT</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#1c1c1e] rounded-3xl p-6 shadow-soft text-white relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-flux-neon opacity-5 rounded-full blur-3xl"></div>
          
          <h3 className="font-bold text-lg mb-6 relative z-10">Recent Activity</h3>
          
          <div className="flex-1 overflow-y-auto space-y-4 relative z-10 pr-2">
            {recentHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent activity.</p>
            ) : recentHistory.map((move, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className={`p-2 rounded-xl flex-shrink-0 ${
                  move.type === 'receipt' ? 'bg-flux-neon/20 text-flux-neon' :
                  move.type === 'delivery' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{move.reference}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">[{move.sku}] {move.product_name} ({move.quantity})</p>
                  <span className="text-[10px] uppercase font-bold text-gray-500 mt-2 block">{move.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, bg, text = "text-flux-textMain" }) {
  return (
    <div className={`${bg} ${text} rounded-3xl p-6 shadow-soft flex flex-col justify-between h-40`}>
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
          <Icon size={20} className={bg === 'bg-white' ? 'text-gray-500' : 'text-current'} />
        </div>
        <div className="bg-black/10 px-2 py-1 rounded-full text-[10px] font-bold">
          Live
        </div>
      </div>
      <div>
        <h2 className="text-4xl font-bold mb-1">{value}</h2>
        <p className={`text-xs font-medium ${bg === 'bg-white' ? 'text-gray-500' : 'opacity-80'}`}>{title}</p>
      </div>
    </div>
  );
}
