import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import MoveHistory from './pages/MoveHistory';
import Operations from './pages/Operations';
import Settings from './pages/Settings';
import Help from './pages/Help';
import {
  IconLogo, IconSidebarToggle, IconSpeedometer, IconBox, IconCart,
  IconShoppingBag, IconHelpCircle, IconSettings, IconPlus,
  IconMoreVertical, IconSearch, IconCalendar, IconBell
} from './components/Icons';
import './App.css';

function FloatingSidebar() {
  const location = useLocation();
  const [operationsOpen, setOperationsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const startsWith = (prefix) => location.pathname.startsWith(prefix);

  return (
    <aside className="floating-sidebar">
      <div className="sidebar-brand-row">
        <div className="brand-logo-group">
          <div className="brand-logo-badge"><IconLogo size={20} /></div>
          <span className="brand-name-text">Interoly</span>
        </div>
        <button className="sidebar-collapse-btn" title="Toggle sidebar">
          <IconSidebarToggle size={15} color="#64748b" />
        </button>
      </div>

      <div className="sidebar-dashed-divider" />

      <div className="sidebar-scrollable-menu">
        <div className="nav-group-section">
          <span className="group-heading-title">Main</span>

          <Link to="/" className={`floating-nav-item ${isActive('/') ? 'active' : ''}`}>
            <span className="item-icon-wrap"><IconSpeedometer size={16} /></span>
            <span className="item-label-text">Dashboard</span>
          </Link>

          <div className="nav-item-collapsible">
            <button
              className={`floating-nav-item collapsible-trigger ${startsWith('/operations') ? 'active' : ''}`}
              onClick={() => setOperationsOpen(!operationsOpen)}
            >
              <span className="item-icon-wrap"><IconBox size={16} /></span>
              <span className="item-label-text">Operations</span>
              <span className={`plus-icon-pill ${operationsOpen ? 'rotated' : ''}`}>
                <IconPlus size={12} color="#64748b" />
              </span>
            </button>

            {operationsOpen && (
              <div className="nested-sub-menu">
                <Link to="/operations/receipt" className={`nested-sub-item ${isActive('/operations/receipt') ? 'nested-active' : ''}`}>
                  <span>Receipt</span>
                </Link>
                <Link to="/operations/delivery" className={`nested-sub-item ${isActive('/operations/delivery') ? 'nested-active' : ''}`}>
                  <span>Delivery</span>
                </Link>
                <Link to="/operations/adjustment" className={`nested-sub-item ${isActive('/operations/adjustment') ? 'nested-active' : ''}`}>
                  <span>Adjustment</span>
                </Link>
              </div>
            )}
          </div>

          <Link to="/stock" className={`floating-nav-item ${isActive('/stock') ? 'active' : ''}`}>
            <span className="item-icon-wrap"><IconCart size={16} /></span>
            <span className="item-label-text">Stock</span>
          </Link>

          <Link to="/history" className={`floating-nav-item ${isActive('/history') ? 'active' : ''}`}>
            <span className="item-icon-wrap"><IconShoppingBag size={16} /></span>
            <span className="item-label-text">Move History</span>
          </Link>
        </div>

        <div className="nav-group-section others-section">
          <span className="group-heading-title">Others</span>

          <Link to="/help" className={`floating-nav-item ${isActive('/help') ? 'active' : ''}`}>
            <span className="item-icon-wrap"><IconHelpCircle size={16} /></span>
            <span className="item-label-text">Help</span>
          </Link>

          <div className="nav-item-collapsible">
            <button
              className={`floating-nav-item collapsible-trigger ${startsWith('/settings') ? 'active' : ''}`}
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <span className="item-icon-wrap"><IconSettings size={16} /></span>
              <span className="item-label-text">Settings</span>
              <span className={`plus-icon-pill ${settingsOpen ? 'rotated' : ''}`}>
                <IconPlus size={12} color="#64748b" />
              </span>
            </button>

            {settingsOpen && (
              <div className="nested-sub-menu">
                <Link to="/settings/locations" className={`nested-sub-item ${isActive('/settings/locations') ? 'nested-active' : ''}`}>
                  <span>Locations</span>
                </Link>
                <Link to="/settings/warehouse" className={`nested-sub-item ${isActive('/settings/warehouse') ? 'nested-active' : ''}`}>
                  <span>Warehouse</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sidebar-bottom-profile">
        <div className="profile-avatar-box">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" alt="User" className="avatar-photo" />
          <span className="online-indicator-dot" />
        </div>
        <div className="profile-text-meta">
          <span className="profile-name">Abinaya S</span>
          <span className="profile-email">abinaya@stocksense.com</span>
        </div>
        <button className="profile-options-btn" title="Profile options">
          <IconMoreVertical size={16} color="#64748b" />
        </button>
      </div>
    </aside>
  );
}

function MainHeader() {
  return (
    <header className="main-content-header">
      <div className="header-search-pill">
        <IconSearch size={16} color="#94a3b8" />
        <input type="text" placeholder="Search anything" />
        <span className="search-kbd-shortcut">⌘ F</span>
      </div>
      <div className="header-actions-right">
        <button className="round-action-btn" title="Calendar"><IconCalendar size={17} color="#64748b" /></button>
        <button className="round-action-btn" title="Notifications">
          <IconBell size={17} color="#64748b" />
          <span className="bell-badge-dot" />
        </button>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="floating-app-layout">
        <FloatingSidebar />
        <div className="main-stage-container">
          <MainHeader />
          <main className="stage-content-scroll">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stock" element={<Stocks />} />
              <Route path="/history" element={<MoveHistory />} />
              <Route path="/operations" element={<Operations defaultTab="receipt" />} />
              <Route path="/operations/receipt" element={<Operations defaultTab="receipt" />} />
              <Route path="/operations/delivery" element={<Operations defaultTab="delivery" />} />
              <Route path="/operations/adjustment" element={<Operations defaultTab="adjustment" />} />
              <Route path="/settings" element={<Settings defaultTab="locations" />} />
              <Route path="/settings/locations" element={<Settings defaultTab="locations" />} />
              <Route path="/settings/warehouse" element={<Settings defaultTab="warehouse" />} />
              <Route path="/help" element={<Help />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
