import { useEffect, useState } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

const initialForm = {
  register_no: '',
  name: '',
  category: 'UG',
  department: '',
  study_year: 1,
  room_id: '',
  status: 'active',
};

export default function StudentFormModal({ show, onClose, onSaved, student, rooms }) {
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) {
      setErrors({});
      if (student) {
        setForm({
          register_no: student.register_no,
          name: student.name,
          category: student.category,
          department: student.department,
          study_year: student.study_year,
          room_id: student.room_id ?? '',
          status: student.status,
        });
      } else {
        setForm(initialForm);
      }
    }
  }, [show, student]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.register_no.trim()) er.register_no = 'Register number is required';
    if (!form.name.trim()) er.name = 'Student name is required';
    if (!form.department.trim()) er.department = 'Department is required';
    const yr = Number(form.study_year);
    if (!Number.isInteger(yr) || yr < 1 || yr > 6) er.study_year = 'Study year must be 1-6';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      ...form,
      study_year: Number(form.study_year),
      room_id: form.room_id === '' ? null : Number(form.room_id),
    };
    const res = student
      ? await api.students.update(student.id, payload)
      : await api.students.create(payload);
    setSaving(false);
    if (res.error) {
      setErrors({ form: res.error.message });
      return;
    }
    toast(student ? 'Student updated' : 'Student created');
    onSaved();
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>{student ? 'Edit Student' : 'Add Student'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errors.form && (
            <div className="alert alert-danger py-2">{errors.form}</div>
          )}
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Register Number <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  value={form.register_no}
                  onChange={set('register_no')}
                  isInvalid={!!errors.register_no}
                  placeholder="e.g. REG2021001"
                />
                <Form.Control.Feedback type="invalid">{errors.register_no}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Student Name <span className="text-danger">*</span></Form.Label>
                <Form.Control value={form.name} onChange={set('name')} isInvalid={!!errors.name} placeholder="Full name" />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Select value={form.category} onChange={set('category')}>
                  <option value="UG">UG</option>
                  <option value="PG">PG</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Department <span className="text-danger">*</span></Form.Label>
                <Form.Control value={form.department} onChange={set('department')} isInvalid={!!errors.department} placeholder="e.g. CSE" />
                <Form.Control.Feedback type="invalid">{errors.department}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Study Year</Form.Label>
                <Form.Select value={form.study_year} onChange={set('study_year')} isInvalid={!!errors.study_year}>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Room</Form.Label>
                <Form.Select value={form.room_id} onChange={set('room_id')}>
                  <option value="">— Not assigned —</option>
                  {rooms?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_number} ({r.current_strength}/{r.capacity})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select value={form.status} onChange={set('status')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : student ? 'Save Changes' : 'Add Student'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
