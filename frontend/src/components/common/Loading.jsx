import Spinner from 'react-bootstrap/Spinner';

export default function Loading({ text = 'Loading...', fullPage = false }) {
  return (
    <div className={`text-center ${fullPage ? 'py-5' : 'py-4'}`}>
      <Spinner animation="border" variant="primary" />
      <div className="text-muted mt-2">{text}</div>
    </div>
  );
}
