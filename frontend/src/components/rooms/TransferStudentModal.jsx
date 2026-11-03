import { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function TransferStudentModal({ show, onClose, onDone, student, rooms }) {
  const toast = useToast();
  const [toRoomId, setToRoomId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) setToRoomId('');
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toRoomId) return;
    setSaving(true);
    const res = await api.rooms.transfer(student.id, Number(toRoomId));
    setSaving(false);
    if (res.error) {
      toast(res.error.message, 'danger');
      return;
    }
    toast(`Transferred ${student.name}`);
    onDone();
  };

  const availableRooms = rooms.filter((r) => r.id !== student?.room_id && r.current_strength < r.capacity);

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Transfer {student?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Destination Room</Form.Label>
            <Form.Select value={toRoomId} onChange={(e) => setToRoomId(e.target.value)} required>
              <option value="">Select a room with free beds...</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} ({r.current_strength}/{r.capacity})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || !toRoomId}>
            {saving ? 'Transferring...' : 'Transfer'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
