import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export default function ConfirmDialog({ show, title = 'Are you sure?', message, confirmText = 'Confirm', variant = 'danger', onConfirm, onCancel }) {
  return (
    <Modal show={show} onHide={onCancel} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
