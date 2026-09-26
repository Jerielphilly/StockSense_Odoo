import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: loginId, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Invalid Login Id or Password");
      }

      const data = await res.json();
      // Save token and go to Dashboard
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
        
        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group">
            <label>Login Id</label>
            <input 
              type="text" 
              value={loginId} 
              onChange={(e) => setLoginId(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="primary-btn">SIGN IN</button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forget Password ?</Link>
          <span> | </span>
          <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}
