import { Link } from 'react-router-dom';
import { PackageOpen, TrendingUp, RefreshCcw } from 'lucide-react';

export default function Hero() {
  return (
    <div className="min-h-screen bg-flux-light flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-flux-neon opacity-10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-flux-purple opacity-10 rounded-full blur-[100px] -ml-40 -mb-40"></div>

      <div className="max-w-4xl w-full text-center relative z-10">
        <div className="w-16 h-16 bg-flux-dark rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-soft">
          <span className="text-3xl font-bold text-flux-neon">S</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-flux-textMain tracking-tight mb-6">
          Smarter Inventory.<br/>
          <span className="text-flux-purple">Faster Operations.</span>
        </h1>
        
        <p className="text-lg text-flux-textSub max-w-2xl mx-auto mb-12">
          The ultimate modular Inventory Management System. Replace manual registers and scattered Excel sheets with a centralized, real-time platform.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-flux-dark text-white font-bold rounded-full hover:bg-gray-800 transition-colors shadow-lg">
            Login to Dashboard
          </Link>
          <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-white text-flux-dark font-bold rounded-full border border-gray-200 hover:border-flux-neon transition-colors shadow-sm">
            Create an Account
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-8 rounded-3xl shadow-soft">
            <div className="w-12 h-12 bg-flux-neon/20 text-flux-dark rounded-xl flex items-center justify-center mb-6">
              <PackageOpen size={24} />
            </div>
            <h3 className="text-xl font-bold text-flux-textMain mb-2">Real-Time Stock</h3>
            <p className="text-gray-500 text-sm">Know exactly what is on your shelves at any given second.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-soft">
            <div className="w-12 h-12 bg-flux-purple/20 text-flux-purple rounded-xl flex items-center justify-center mb-6">
              <RefreshCcw size={24} />
            </div>
            <h3 className="text-xl font-bold text-flux-textMain mb-2">Smooth Operations</h3>
            <p className="text-gray-500 text-sm">Manage Receipts, Deliveries, and Internal Transfers seamlessly.</p>
          </div>
          <div className="bg-[#1c1c1e] p-8 rounded-3xl shadow-soft">
            <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center mb-6">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Dynamic Analytics</h3>
            <p className="text-gray-400 text-sm">Track low-stock alerts and analyze inventory flow automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
