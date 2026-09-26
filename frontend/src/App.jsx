import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Hero from './pages/Hero';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Stock from './pages/Stock';
import Products from './pages/Products';
import Operations from './pages/Operations';
import Receipts from './pages/Receipts';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        
        {/* Top Navigation Bar from Wireframe */}
        <nav className="navbar">
          <div className="nav-links">
            <Link to="/dashboard" className="active">Dashboard</Link>
            <Link to="/operations">Operations</Link>
            <Link to="/products">Products</Link>
            <Link to="/stock">Stock</Link>
            <Link to="/history">Move History</Link>
            <Link to="/settings">Settings</Link>
          </div>
          
          <div className="nav-right">
            <h2>Dashboard</h2>
            <div className="profile-icon">A</div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Hero />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/products" element={<Products />} />
            <Route path="/operations" element={<Operations />} />
            <Route path="/operations/receipts" element={<Receipts />} />
            {/* We will add other routes here later as you send wireframes! */}
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;
