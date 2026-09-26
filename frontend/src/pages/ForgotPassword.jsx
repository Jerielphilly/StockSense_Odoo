import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, User, Hash, Lock } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [loginId, setLoginId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await fetch('http://127.0.0.1:8000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId })
      });

      if (!res.ok) throw new Error("Failed to send OTP. Please check your username.");

      setMessage("A 6-digit OTP has been sent to your email.");
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const isReset = newPassword.trim() !== '';
      const url = isReset ? 'http://127.0.0.1:8000/auth/reset-password' : 'http://127.0.0.1:8000/auth/verify-otp';
      const payload = { login_id: loginId, otp };
      if (isReset) payload.new_password = newPassword;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Invalid or expired OTP");
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-flux-light flex items-center justify-center p-8 relative overflow-hidden">
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-flux-dark opacity-5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-white rounded-3xl shadow-soft w-full max-w-md p-10 relative z-10 border border-gray-100">
        
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-flux-dark rounded-2xl flex items-center justify-center shadow-soft">
            <KeyRound className="text-white" size={28} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-flux-textMain mb-2">Account Recovery</h2>
          <p className="text-flux-textSub text-sm">
            {step === 1 ? "Enter your Login ID to receive an OTP" : "Enter OTP to login or reset password"}
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-500 text-sm font-semibold p-4 rounded-xl mb-6 text-center">{error}</div>}
        {message && <div className="bg-green-50 text-green-600 text-sm font-semibold p-4 rounded-xl mb-6 text-center">{message}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Login ID (Username)" 
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-dark text-sm font-medium"
              />
            </div>

            <button type="submit" className="w-full bg-flux-dark text-white font-bold py-4 rounded-xl shadow-sm hover:bg-gray-800 transition-colors mt-4">
              Send OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="6-Digit OTP" 
                required
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-dark text-sm font-medium tracking-widest"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                placeholder="New Password (Optional)" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-flux-dark text-sm font-medium"
              />
            </div>
            <p className="text-xs text-gray-500 font-medium px-2">Leave password blank to just sign in directly with the OTP.</p>

            <button type="submit" className="w-full bg-flux-neon text-flux-dark font-bold py-4 rounded-xl shadow-sm hover:bg-[#c6e541] transition-colors mt-4">
              {newPassword ? "Reset & Login" : "Login with OTP"}
            </button>
          </form>
        )}

        <p className="text-center mt-8 text-sm text-gray-500 font-medium">
          Remembered your password? <Link to="/login" className="text-flux-dark hover:text-flux-purple font-bold ml-1">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
