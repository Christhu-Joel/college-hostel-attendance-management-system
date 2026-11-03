import Pagination from 'react-bootstrap/Pagination';

export default function PaginationBar({ page, pages, onPageChange }) {
  if (!pages || pages <= 1) return null;

  const items = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);

  items.push(
    <Pagination.Prev key="prev" disabled={page <= 1} onClick={() => onPageChange(page - 1)} />
  );
  if (start > 1) {
    items.push(<Pagination.Item key={1} onClick={() => onPageChange(1)}>1</Pagination.Item>);
    if (start > 2) items.push(<Pagination.Ellipsis key="ell1" disabled />);
  }
  for (let i = start; i <= end; i += 1) {
    items.push(
      <Pagination.Item key={i} active={i === page} onClick={() => onPageChange(i)}>
        {i}
      </Pagination.Item>
    );
  }
  if (end < pages) {
    if (end < pages - 1) items.push(<Pagination.Ellipsis key="ell2" disabled />);
    items.push(<Pagination.Item key={pages} onClick={() => onPageChange(pages)}>{pages}</Pagination.Item>);
  }
  items.push(
    <Pagination.Next key="next" disabled={page >= pages} onClick={() => onPageChange(page + 1)} />
  );

  return <Pagination size="sm" className="mb-0">{items}</Pagination>;
}
