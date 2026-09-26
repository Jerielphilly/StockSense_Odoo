import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [loginId, setLoginId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
      setMessage(data.message); // e.g. "OTP sent to your_email@gmail.com"
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyOtpOnly = async () => {
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId, otp: otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid OTP");
      
      // Log them in and go to dashboard
      localStorage.setItem('token', data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId, otp: otp, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to reset password");
      
      // Log them in and go to dashboard
      localStorage.setItem('token', data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>App Logo</h2>

        {/* STEP 1: Get Login ID */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="auth-form">
            <p style={{marginBottom: '1rem'}}>Enter your Login ID to receive an OTP.</p>
            <div className="input-group">
              <label>Login Id</label>
              <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="primary-btn">SEND OTP</button>
          </form>
        )}

        {/* STEP 2: Enter OTP & Choose Action */}
        {step === 2 && (
          <div className="auth-form">
            <p style={{color: '#8be9fd', marginBottom: '1rem'}}>{message}</p>
            <div className="input-group">
              <label>Enter 6-Digit OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
            </div>
            {error && <p className="error-text">{error}</p>}
            
            <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
              <button onClick={handleVerifyOtpOnly} className="primary-btn" style={{flex: 1}}>
                LOGIN TO DASHBOARD
              </button>
              <button onClick={() => setStep(3)} className="primary-btn" style={{flex: 1, backgroundColor: '#ffb4a2', color: '#1a1a1a'}}>
                RESET PASSWORD
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="input-group">
              <label>Enter New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="primary-btn">CONFIRM RESET</button>
          </form>
        )}

        <div className="auth-links" style={{marginTop: '2rem'}}>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
