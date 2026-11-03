import { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function AssignStudentModal({ show, onClose, onAssigned, room, unassignedStudents }) {
  const toast = useToast();
  const [studentId, setStudentId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) setStudentId('');
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) return;
    setSaving(true);
    const res = await api.rooms.assign(room.id, Number(studentId));
    setSaving(false);
    if (res.error) {
      toast(res.error.message, 'danger');
      return;
    }
    toast(`Assigned to ${room.room_number}`);
    onAssigned();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Student to {room?.room_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2 small text-muted">
            {room?.current_strength}/{room?.capacity} occupied · {room && room.capacity - room.current_strength} bed(s) free
          </div>
          <Form.Group>
            <Form.Label>Student</Form.Label>
            <Form.Select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              <option value="">Select a student without a room...</option>
              {unassignedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.register_no} — {s.name} ({s.department})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || !studentId}>
            {saving ? 'Assigning...' : 'Assign'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
