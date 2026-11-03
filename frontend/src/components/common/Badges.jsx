export function StatusBadge({ status }) {
  const map = {
    active: 'bg-success-subtle text-success border-success-subtle',
    inactive: 'bg-secondary-subtle text-secondary border-secondary-subtle',
    present: 'bg-success-subtle text-success border-success-subtle',
    absent: 'bg-danger-subtle text-danger border-danger-subtle',
    full: 'bg-danger-subtle text-danger border-danger-subtle',
    available: 'bg-success-subtle text-success border-success-subtle',
  };
  return (
    <span className={`badge rounded-pill border ${map[status] || 'bg-light-subtle text-dark'}`}>
      {status}
    </span>
  );
}

export function PercentBadge({ value }) {
  const color = value >= 75 ? 'success' : value >= 50 ? 'warning' : 'danger';
  return <span className={`badge text-bg-${color} rounded-pill`}>{value}%</span>;
}
