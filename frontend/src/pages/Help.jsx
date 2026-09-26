export default function Help() {
  const faqs = [
    { q: 'How do I add a new product?', a: 'Go to Stock → click "Add Product". Fill in the name, SKU, category, and optionally set an initial quantity with a location.' },
    { q: 'How do I receive stock from a vendor?', a: 'Go to Operations → Receipt → click "New Receipt". Select the product, quantity, and the destination location. Then click Validate to update the stock.' },
    { q: 'How do I record a delivery to a customer?', a: 'Go to Operations → Delivery → "New Delivery". Select the product, quantity, and the source location. Validate to deduct from stock.' },
    { q: 'What is an Adjustment?', a: 'An adjustment lets you manually correct the stock count — for instance after a physical inventory count. Select a location and enter the corrected quantity.' },
    { q: 'How do I add a warehouse location?', a: 'Go to Settings → Locations → fill in the location name (e.g. "Rack A-01") and type (Internal, Vendor, Customer) → Add Location.' },
    { q: 'What does Validate do?', a: '"Validate" confirms a move. For receipts it adds stock to the destination. For deliveries it deducts stock from the source. This cannot be undone.' },
    { q: 'What is Low Stock?', a: 'Any product with 10 or fewer units across all locations is flagged as Low Stock on the dashboard.' },
  ];

  return (
    <div className="dashboard-content-layout">
      <div className="dashboard-sub-header">
        <div className="greeting-box"><h2>Help & Documentation</h2></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="interoly-card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Quick Start Guide</h3>
          <div className="help-steps">
            {[
              { step: '1', title: 'Create Locations', desc: 'Go to Settings → Locations and add your warehouse racks, shelves, and bins.' },
              { step: '2', title: 'Add Products', desc: 'Go to Stock → Add Product. Set a SKU, category, and initial stock quantity.' },
              { step: '3', title: 'Record Receipts', desc: 'When goods arrive, go to Operations → Receipt → New Receipt → Validate.' },
              { step: '4', title: 'Record Deliveries', desc: 'When shipping goods out, go to Operations → Delivery → New Delivery → Validate.' },
              { step: '5', title: 'Monitor Dashboard', desc: 'The Dashboard shows live KPIs: pending operations, low stock alerts, and total units.' },
            ].map(s => (
              <div key={s.step} className="help-step-row">
                <span className="help-step-num">{s.step}</span>
                <div><strong style={{ fontSize: 13, color: '#0f172a' }}>{s.title}</strong><p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="interoly-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Frequently Asked Questions</h3>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">{f.q}</summary>
                <p className="faq-answer">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="interoly-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>API Reference</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { method: 'GET', path: '/dashboard', desc: 'Live KPI metrics' },
              { method: 'GET', path: '/products', desc: 'List all products' },
              { method: 'POST', path: '/products', desc: 'Create a product' },
              { method: 'GET', path: '/stock', desc: 'Stock levels per location' },
              { method: 'GET', path: '/moves', desc: 'All stock movements' },
              { method: 'POST', path: '/moves', desc: 'Create a move' },
              { method: 'POST', path: '/moves/{id}/validate', desc: 'Validate a move' },
              { method: 'GET', path: '/locations', desc: 'List locations' },
              { method: 'POST', path: '/locations', desc: 'Create a location' },
            ].map(r => (
              <div key={r.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: r.method === 'GET' ? '#dbeafe' : '#dcfce7', color: r.method === 'GET' ? '#2563eb' : '#16a34a', minWidth: 40, textAlign: 'center' }}>{r.method}</span>
                <code style={{ fontSize: 12, color: '#0f172a', fontFamily: 'monospace' }}>{r.path}</code>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>{r.desc}</span>
              </div>
            ))}
          </div>
          <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'inline-flex', marginTop: 14, textDecoration: 'none' }}>
            Open Interactive API Docs →
          </a>
        </div>
      </div>
    </div>
  );
}
