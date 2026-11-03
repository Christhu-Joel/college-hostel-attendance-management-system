export default function EmptyState({ icon = 'bi-inbox', title = 'Nothing here yet', message }) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon} d-block mb-3`} />
      <h6 className="fw-semibold text-dark">{title}</h6>
      {message && <div className="small">{message}</div>}
    </div>
  );
}
