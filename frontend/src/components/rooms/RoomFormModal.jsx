import { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function RoomFormModal({ show, onClose, onSaved, room }) {
  const toast = useToast();
  const [form, setForm] = useState({ room_number: '', capacity: 2 });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) {
      setErrors({});
      setForm(room ? { room_number: room.room_number, capacity: room.capacity } : { room_number: '', capacity: 2 });
    }
  }, [show, room]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.room_number.trim()) er.room_number = 'Room number is required';
    const cap = Number(form.capacity);
    if (!Number.isInteger(cap) || cap < 1 || cap > 20) er.capacity = 'Capacity must be 1-20';
    setErrors(er);
    if (Object.keys(er).length) return;

    setSaving(true);
    const res = room
      ? await api.rooms.update(room.id, { ...form, capacity: cap })
      : await api.rooms.create({ ...form, capacity: cap });
    setSaving(false);
    if (res.error) {
      setErrors({ form: res.error.message });
      return;
    }
    toast(room ? 'Room updated' : 'Room created');
    onSaved();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>{room ? 'Edit Room' : 'Create Room'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errors.form && <div className="alert alert-danger py-2">{errors.form}</div>}
          <Form.Group className="mb-3">
            <Form.Label>Room Number <span className="text-danger">*</span></Form.Label>
            <Form.Control
              value={form.room_number}
              onChange={(e) => setForm((f) => ({ ...f, room_number: e.target.value.toUpperCase() }))}
              isInvalid={!!errors.room_number}
              placeholder="e.g. A-101"
            />
            <Form.Control.Feedback type="invalid">{errors.room_number}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group>
            <Form.Label>Capacity (beds)</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="20"
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              isInvalid={!!errors.capacity}
            />
            <Form.Control.Feedback type="invalid">{errors.capacity}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : room ? 'Save Changes' : 'Create Room'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
