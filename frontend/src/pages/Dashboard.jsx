import { useState, useEffect } from 'react';
import {
  IconSun,
  IconReceipt,
  IconDelivery,
  IconAdjustment,
  IconArrowRight,
  IconMoreHorizontal,
  IconChevronDown,
  IconBox,
  IconTag,
  IconAlertTriangle,
  IconTrash,
  IconLink,
  IconTrendUp,
  IconTrendDown
} from '../components/Icons';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    // Fetch live backend metrics
    fetch('http://127.0.0.1:8000/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setKpis(data.kpis))
      .catch((err) => {
        console.warn("Backend not running or offline:", err);
      });
  }, []);

  // Safe defaults matching wireframe if database is fresh
  const receiptCount = kpis?.pending_receipts ?? 4;
  const deliveryCount = kpis?.pending_deliveries ?? 4;
  const transferCount = kpis?.pending_transfers ?? 2;

  // Monthly segmented bar chart data for Total Product Details
  const monthlyData = [
    { month: 'Jan', bars: [1, 2, 1] },
    { month: 'Feb', bars: [2, 1, 2] },
    { month: 'Mar', bars: [2, 3, 1] },
    { month: 'Apr', bars: [1, 1, 2] },
    { month: 'May', bars: [3, 2, 1] },
    { month: 'Jun', bars: [4, 5, 2] },
    { month: 'Jul', bars: [3, 6, 2], active: true },
    { month: 'Aug', bars: [2, 3, 4] },
    { month: 'Sep', bars: [3, 2, 1] },
    { month: 'Oct', bars: [5, 4, 3] },
    { month: 'Nov', bars: [3, 2, 2] },
    { month: 'Dec', bars: [4, 3, 3] },
  ];

  // Recent Stock Operations (matching "Display the history of In/Out stocks" from wireframe)
  const recentOperations = [
    {
      id: 1,
      reference: 'WH/IN/00012',
      type: 'Receipt',
      partner: 'Steel Corp Ltd',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      date: 'Feb 01, 2025',
      items: 4,
      status: 'Ready',
      location: 'Main Warehouse'
    },
    {
      id: 2,
      reference: 'WH/OUT/00008',
      type: 'Delivery',
      partner: 'Apex Logistics',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      date: 'Feb 01, 2025',
      items: 3,
      status: 'Waiting',
      location: 'Rack A-04'
    },
    {
      id: 3,
      reference: 'WH/INT/00005',
      type: 'Adjustment',
      partner: 'Inventory Audit',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
      date: 'Jan 28, 2025',
      items: 2,
      status: 'Done',
      location: 'Shelf B-12'
    }
  ];

  return (
    <div className="dashboard-content-layout">
      {/* Top Greeting & Live Stats Strip */}
      <div className="dashboard-sub-header">
        <div className="greeting-box">
          <IconSun size={20} color="#f59e0b" />
          <h2>Hello, Abinaya S!</h2>
          <span className="live-status-pill">Warehouse Active</span>
        </div>

        <div className="quick-summary-stats">
          <div className="stat-badge-chip">
            <span className="chip-icon green"><IconBox size={14} /></span>
            <span className="chip-label">Total SKUs:</span>
            <strong className="chip-value">{kpis?.total_products ?? 18}</strong>
          </div>
          <div className="stat-badge-chip">
            <span className="chip-icon teal"><IconTag size={14} /></span>
            <span className="chip-label">In Stock:</span>
            <strong className="chip-value">{(kpis?.total_items_in_stock ?? 1420).toLocaleString()}</strong>
          </div>
          <div className="stat-badge-chip">
            <span className="chip-icon amber"><IconAlertTriangle size={14} /></span>
            <span className="chip-label">Alerts:</span>
            <strong className="chip-value">{kpis?.low_or_out_of_stock ?? 3}</strong>
          </div>
        </div>
      </div>

      {/* Row 1: The Core Kanban Cards from Excalidraw Wireframe */}
      <div className="operations-kanban-row">
        {/* ================= 1. Receipt Card ================= */}
        <div className="interoly-card kanban-operation-card receipt-border">
          <div className="interoly-card-header">
            <div className="card-heading-left">
              <span className="icon-pill receipt-icon-pill">
                <IconReceipt size={17} />
              </span>
              <h3>Receipt</h3>
            </div>
            <div className="card-heading-right">
              <span className="tag-pill tag-inbound">Inbound</span>
              <button className="card-menu-btn" title="Options">
                <IconMoreHorizontal size={16} />
              </button>
            </div>
          </div>

          <div className="kanban-inner-content">
            {/* Left Action Box with micro-chart */}
            <div className="action-sub-panel">
              <div className="action-header-meta">
                <span className="action-sub-title">To be Shipped / Received</span>
                <span className="trend-badge positive">
                  <IconTrendUp size={11} /> +3.4%
                </span>
              </div>

              {/* Action Button from Wireframe */}
              <button className="wireframe-action-btn btn-receipt-emerald">
                <span>{receiptCount} to receive</span>
                <IconArrowRight size={14} />
              </button>

              {/* Sparkline chart matching screenshot */}
              <div className="sparkline-chart-box">
                <div className="sparkline-tooltip-badge">$3,345</div>
                <svg viewBox="0 0 120 38" className="sparkline-svg">
                  <path
                    d="M 5,26 Q 20,30 35,20 T 65,22 T 95,12 T 115,20"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="80" cy="14" r="3.5" fill="#22c55e" stroke="#ffffff" strokeWidth="2" />
                </svg>
                <div className="chart-days-row">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                </div>
              </div>
            </div>

            {/* Right Stats Breakdown matching Wireframe */}
            <div className="wireframe-stats-panel">
              <div className="stats-item item-late">
                <span className="indicator-bullet bullet-late"></span>
                <div className="stats-text-group">
                  <span className="stats-number">1</span>
                  <span className="stats-label">Late</span>
                </div>
              </div>

              <div className="stats-item item-operations">
                <span className="indicator-bullet bullet-ops"></span>
                <div className="stats-text-group">
                  <span className="stats-number">{receiptCount > 0 ? receiptCount + 2 : 6}</span>
                  <span className="stats-label">operations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. Delivery Card ================= */}
        <div className="interoly-card kanban-operation-card delivery-border">
          <div className="interoly-card-header">
            <div className="card-heading-left">
              <span className="icon-pill delivery-icon-pill">
                <IconDelivery size={17} />
              </span>
              <h3>Delivery</h3>
            </div>
            <div className="card-heading-right">
              <span className="tag-pill tag-outbound">Outbound</span>
              <button className="card-menu-btn" title="Options">
                <IconMoreHorizontal size={16} />
              </button>
            </div>
          </div>

          <div className="kanban-inner-content">
            {/* Left Action Box with vertical bars */}
            <div className="action-sub-panel">
              <div className="action-header-meta">
                <span className="action-sub-title">To be Packed / Delivered</span>
                <span className="trend-badge positive">
                  <IconTrendUp size={11} /> +4.5%
                </span>
              </div>

              {/* Action Button from Wireframe */}
              <button className="wireframe-action-btn btn-delivery-blue">
                <span>{deliveryCount} to Deliver</span>
                <IconArrowRight size={14} />
              </button>

              {/* Vertical blue bars chart matching screenshot */}
              <div className="mini-bars-box">
                <div className="vertical-blue-bars">
                  <span style={{ height: '35%' }}></span>
                  <span style={{ height: '55%' }}></span>
                  <span style={{ height: '80%' }}></span>
                  <span style={{ height: '60%' }}></span>
                  <span style={{ height: '90%' }}></span>
                  <span style={{ height: '70%' }}></span>
                  <span style={{ height: '45%' }}></span>
                  <span style={{ height: '75%' }}></span>
                  <span style={{ height: '50%' }}></span>
                  <span style={{ height: '30%' }}></span>
                </div>
              </div>
            </div>

            {/* Right Stats Breakdown matching Wireframe */}
            <div className="wireframe-stats-panel">
              <div className="stats-item item-late">
                <span className="indicator-bullet bullet-late"></span>
                <div className="stats-text-group">
                  <span className="stats-number">1</span>
                  <span className="stats-label">Late</span>
                </div>
              </div>

              <div className="stats-item item-waiting">
                <span className="indicator-bullet bullet-waiting"></span>
                <div className="stats-text-group">
                  <span className="stats-number">2</span>
                  <span className="stats-label">waiting</span>
                </div>
              </div>

              <div className="stats-item item-operations">
                <span className="indicator-bullet bullet-ops"></span>
                <div className="stats-text-group">
                  <span className="stats-number">{deliveryCount > 0 ? deliveryCount + 2 : 6}</span>
                  <span className="stats-label">operations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. Adjustment Card (from Submenu note) ================= */}
        <div className="interoly-card kanban-operation-card adjustment-border">
          <div className="interoly-card-header">
            <div className="card-heading-left">
              <span className="icon-pill adjustment-icon-pill">
                <IconAdjustment size={17} />
              </span>
              <h3>Adjustment</h3>
            </div>
            <div className="card-heading-right">
              <span className="tag-pill tag-internal">Internal</span>
              <button className="card-menu-btn" title="Options">
                <IconMoreHorizontal size={16} />
              </button>
            </div>
          </div>

          <div className="kanban-inner-content">
            {/* Left Action Box with radial donut */}
            <div className="action-sub-panel">
              <div className="action-header-meta">
                <span className="action-sub-title">To be Invoiced / Moved</span>
                <span className="trend-badge negative">
                  <IconTrendDown size={11} /> -1.6%
                </span>
              </div>

              {/* Action Button from Wireframe */}
              <button className="wireframe-action-btn btn-adjustment-amber">
                <span>{transferCount} to Adjust</span>
                <IconArrowRight size={14} />
              </button>

              {/* Donut progress ring matching screenshot */}
              <div className="donut-progress-box">
                <svg viewBox="0 0 54 54" className="donut-svg">
                  <circle cx="27" cy="27" r="20" fill="none" stroke="#f1f5f9" strokeWidth="5.5" />
                  <circle
                    cx="27"
                    cy="27"
                    r="20"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="5.5"
                    strokeDasharray="125"
                    strokeDashoffset="75"
                    strokeLinecap="round"
                    transform="rotate(-90 27 27)"
                  />
                  <text x="27" y="31" textAnchor="middle" className="donut-text">
                    40%
                  </text>
                </svg>
              </div>
            </div>

            {/* Right Stats Breakdown matching Wireframe */}
            <div className="wireframe-stats-panel">
              <div className="stats-item item-late">
                <span className="indicator-bullet bullet-neutral"></span>
                <div className="stats-text-group">
                  <span className="stats-number">0</span>
                  <span className="stats-label">Late</span>
                </div>
              </div>

              <div className="stats-item item-operations">
                <span className="indicator-bullet bullet-ops"></span>
                <div className="stats-text-group">
                  <span className="stats-number">{transferCount > 0 ? transferCount : 2}</span>
                  <span className="stats-label">operations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Total Product Details & Operation Definitions (Wireframe Annotations) */}
      <div className="dashboard-middle-row">
        {/* Total Product Details (Segmented Bar Chart from Screenshot) */}
        <div className="interoly-card product-details-chart-card">
          <div className="interoly-card-header">
            <h3>Total Product Details</h3>
            <button className="dropdown-pill-btn">
              <span>This Years</span>
              <IconChevronDown size={13} />
            </button>
          </div>

          <div className="legend-strip-row">
            <span className="legend-item"><span className="dot dot-green"></span> Total Stock Items</span>
            <span className="legend-item"><span className="dot dot-purple"></span> High Stock Items</span>
            <span className="legend-item"><span className="dot dot-blue"></span> Low Stock Items</span>
          </div>

          <div className="segmented-barchart-wrap">
            <div className="axis-labels-col">
              <span>4 K</span>
              <span>3 K</span>
              <span>2 K</span>
              <span>1 K</span>
              <span>0 K</span>
            </div>

            <div className="bars-columns-row">
              {monthlyData.map((d, idx) => (
                <div key={idx} className={`month-bar-col ${d.active ? 'active' : ''}`}>
                  <div className="brick-stack">
                    <span className="brick brick-purple"></span>
                    <span className="brick brick-blue"></span>
                    <span className="brick brick-teal"></span>
                    {d.active && <span className="brick brick-dark-blue"></span>}
                    {d.active && <span className="brick brick-dark-purple"></span>}
                  </div>
                  <span className="month-label">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Business Logic Rules Card (From Excalidraw Wireframe Right-side Note) */}
        <div className="interoly-card business-rules-card">
          <div className="interoly-card-header">
            <h3>Operation Definitions</h3>
            <span className="rule-badge-static">Warehouse Logic</span>
          </div>

          <p className="rules-lead-text">
            Standard operating conditions defined in the warehouse blueprint:
          </p>

          <div className="rules-cards-stack">
            <div className="rule-entry-card rule-entry-late">
              <div className="rule-top-line">
                <span className="rule-tag tag-late">Late</span>
                <span className="rule-status-text">Attention Required</span>
              </div>
              <code className="rule-condition-code">schedule date &lt; today&apos;s date</code>
            </div>

            <div className="rule-entry-card rule-entry-waiting">
              <div className="rule-top-line">
                <span className="rule-tag tag-waiting">Waiting</span>
                <span className="rule-status-text">Pending Inbound</span>
              </div>
              <code className="rule-condition-code">Waiting for the stocks</code>
            </div>

            <div className="rule-entry-card rule-entry-ops">
              <div className="rule-top-line">
                <span className="rule-tag tag-ops">Operations</span>
                <span className="rule-status-text">Scheduled Normal</span>
              </div>
              <code className="rule-condition-code">schedule date &gt; today&apos;s date</code>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Move History / Operations Table ("Display the history of In/Out stocks") */}
      <div className="interoly-card table-section-card">
        <div className="interoly-card-header">
          <h3>Recent Operations &amp; Move History</h3>
          <button className="dropdown-pill-btn">
            <span>This Month</span>
            <IconChevronDown size={13} />
          </button>
        </div>

        <div className="table-responsive-box">
          <table className="clean-orders-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><input type="checkbox" className="table-chk" /></th>
                <th>Reference</th>
                <th>Operation</th>
                <th>Partner / Customer</th>
                <th>Location</th>
                <th>Date</th>
                <th>Items</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOperations.map((op) => (
                <tr key={op.id}>
                  <td><input type="checkbox" className="table-chk" /></td>
                  <td className="ref-cell">{op.reference}</td>
                  <td>
                    <span className={`op-type-pill op-${op.type.toLowerCase()}`}>
                      {op.type}
                    </span>
                  </td>
                  <td>
                    <div className="partner-cell">
                      <img src={op.avatar} alt={op.partner} className="partner-avatar" />
                      <span className="partner-name">{op.partner}</span>
                    </div>
                  </td>
                  <td className="location-cell">{op.location}</td>
                  <td className="date-cell">{op.date}</td>
                  <td>
                    <span className={`count-pill items-${op.items}`}>
                      {op.items}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill status-${op.status.toLowerCase()}`}>
                      {op.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="actions-cluster">
                      <button className="action-icon-btn" title="Trash"><IconTrash size={14} /></button>
                      <button className="action-icon-btn" title="Link"><IconLink size={14} /></button>
                      <button className="action-icon-btn" title="More"><IconMoreHorizontal size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
