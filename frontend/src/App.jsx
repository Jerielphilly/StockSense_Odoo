import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        
        {/* Top Navigation Bar from Wireframe */}
        <nav className="navbar">
          <div className="nav-links">
            <Link to="/" className="active">Dashboard</Link>
            <Link to="/operations">Operations</Link>
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
            <Route path="/" element={<Dashboard />} />
            {/* We will add other routes here later as you send wireframes! */}
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;
