import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Hero from './pages/Hero';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Stock from './pages/Stock';
import Products from './pages/Products';
import Operations from './pages/Operations';
import Receipts from './pages/Receipts';
import Deliveries from './pages/Deliveries';
import Transfers from './pages/Transfers';
import History from './pages/History';
import Settings from './pages/Settings';
import './App.css';

// Simple Route Protector
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  // Parse JWT for Role-Based Access Control (RBAC)
  const token = localStorage.getItem('token');
  let role = 'staff';
  try {
    if (token) role = JSON.parse(atob(token.split('.')[1])).role;
  } catch(e) {}

  return (
    <Router>
      <div className="app-container">
        
        {/* Only show the operational navbar if logged in */}
        {token && (
          <nav className="navbar">
            <div className="nav-links">
              {role === 'manager' && <Link to="/dashboard" className="active">Dashboard</Link>}
              
              <Link to="/operations">Operations</Link>
              <Link to="/products">Products</Link>
              <Link to="/stock">Stock</Link>
              
              {role === 'manager' && (
                <>
                  <Link to="/history">Move History</Link>
                  <Link to="/settings">Settings</Link>
                </>
              )}
            </div>
            
            <div className="nav-right" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <span style={{color: '#ffb4a2', fontSize: '0.9rem', textTransform: 'uppercase', border: '1px solid #ffb4a2', padding: '2px 8px', borderRadius: '12px'}}>{role}</span>
              <button 
                className="small-btn" 
                style={{background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', margin: 0}}
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }}
              >
                Logout
              </button>
              <div className="profile-icon">A</div>
            </div>
          </nav>
        )}

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Hero />} />
            <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/signup" element={token ? <Navigate to="/dashboard" /> : <Signup />} />
            <Route path="/forgot-password" element={token ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/stock" element={<PrivateRoute><Stock /></PrivateRoute>} />
            <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
            <Route path="/operations" element={<PrivateRoute><Operations /></PrivateRoute>} />
            <Route path="/operations/receipts" element={<PrivateRoute><Receipts /></PrivateRoute>} />
            <Route path="/operations/deliveries" element={<PrivateRoute><Deliveries /></PrivateRoute>} />
            <Route path="/operations/transfers" element={<PrivateRoute><Transfers /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
