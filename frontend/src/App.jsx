import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import DashboardLayout from './components/DashboardLayout';
import './App.css';

// Simple Route Protector
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') {
    localStorage.removeItem('token');
    return <Navigate to="/login" />;
  }

  let role = 'staff';
  try {
    role = JSON.parse(atob(token.split('.')[1])).role;
  } catch(e) {
    localStorage.removeItem('token');
    return <Navigate to="/login" />;
  }

  return <DashboardLayout role={role}>{children}</DashboardLayout>;
};

// Check if user is logged in for public routes
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><Hero /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/stock" element={<PrivateRoute><Stock /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        
        {/* Operations & Subpages */}
        <Route path="/operations" element={<PrivateRoute><Operations /></PrivateRoute>} />
        <Route path="/operations/receipts" element={<PrivateRoute><Receipts /></PrivateRoute>} />
        <Route path="/operations/deliveries" element={<PrivateRoute><Deliveries /></PrivateRoute>} />
        <Route path="/operations/transfers" element={<PrivateRoute><Transfers /></PrivateRoute>} />
        
        <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
