import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validation from wireframe description
    if (loginId.length < 6 || loginId.length > 12) {
      return setError("Login ID must be between 6 and 12 characters.");
    }
    
    // Password complexity: 1 small, 1 large, 1 special, length > 8
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{9,}$/;
    if (!pwdRegex.test(password)) {
      return setError("Password must contain a small case, a large case, a special character, and be more than 8 characters.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match!");
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          login_id: loginId, 
          email: email, 
          password: password 
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to sign up.");
      }

      // Automatically redirect to login after successful signup
      navigate('/login');
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>App Logo</h2>
        
        <form onSubmit={handleSignup} className="auth-form">
          <div className="input-group">
            <label>Enter Login Id</label>
            <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Enter Email Id</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Enter Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Re-Enter Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="primary-btn">SIGN UP</button>
        </form>

        <div className="auth-links" style={{marginTop: '1rem'}}>
          <Link to="/login">Already have an account? Sign In</Link>
        </div>
      </div>
    </div>
  );
}
