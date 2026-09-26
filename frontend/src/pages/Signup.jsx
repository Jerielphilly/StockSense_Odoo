import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Key, User } from 'lucide-react';

export default function Signup() {
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://127.0.0.1:8000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId, email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error during signup");
      }

      alert("Signup successful! Please log in.");
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-flux-light flex items-center justify-center p-8 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-flux-neon opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-white rounded-3xl shadow-soft w-full max-w-md p-10 relative z-10 border border-gray-100">
        
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-flux-dark rounded-2xl flex items-center justify-center shadow-soft">
            <span className="text-3xl font-bold text-flux-neon">S</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-flux-textMain mb-2">Create an Account</h2>
          <p className="text-flux-textSub text-sm">Join StockSense today</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 text-sm font-semibold p-4 rounded-xl mb-6 text-center">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Login ID (Username)" 
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm font-medium"
            />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="email" 
              placeholder="Email Address" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm font-medium"
            />
          </div>

          <div className="relative">
            <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-neon text-sm font-medium"
            />
          </div>

          <button type="submit" className="w-full bg-flux-neon text-flux-dark font-bold py-4 rounded-xl shadow-sm hover:bg-[#c6e541] transition-colors flex justify-center items-center gap-2 mt-4">
            <UserPlus size={18} /> Create Account
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500 font-medium">
          Already have an account? <Link to="/login" className="text-flux-dark hover:text-flux-purple font-bold ml-1">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
