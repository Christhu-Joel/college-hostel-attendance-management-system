import Card from 'react-bootstrap/Card';

export default function StatCard({ icon, iconClass, label, value, sub, valueClass }) {
  return (
    <Card className="ha-card h-100">
      <Card.Body className="d-flex align-items-center gap-3">
        <div className={`ha-stat-icon ${iconClass || 'bg-primary-subtle text-primary'}`}>
          <i className={`bi ${icon}`} />
        </div>
        <div className="overflow-hidden">
          <div className="text-muted small text-truncate">{label}</div>
          <div className={`fs-4 fw-bold ${valueClass || ''}`}>{value ?? '—'}</div>
          {sub && <div className="small text-muted">{sub}</div>}
        </div>
      </Card.Body>
    </Card>
  );
}
