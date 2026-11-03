import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import PaginationBar from '../components/common/PaginationBar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { StatusBadge } from '../components/common/Badges';
import StudentFormModal from '../components/students/StudentFormModal';

const EMPTY_FILTERS = { search: '', category: '', department: '', study_year: '', status: '' };

export default function Students() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [details, setDetails] = useState(null);
  const searchTimer = useRef(null);

  const fetchMeta = useCallback(async () => {
    const [deptRes, roomRes] = await Promise.all([
      api.students.departments(),
      api.rooms.list({ size: 500 }),
    ]);
    if (!deptRes.error) setDepartments(deptRes.data.data);
    if (!roomRes.error) setRooms(roomRes.data.data);
  }, []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.students.list({ page, size: 10, ...filters });
    setLoading(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setData(res.data);
  }, [page, filters]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const onFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const onSearchChange = (e) => {
    const value = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: value }));
      setPage(1);
    }, 400);
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditing(null);
    fetchStudents();
  };

  const handleDelete = async () => {
    const res = await api.students.remove(deleteTarget.id);
    setDeleteTarget(null);
    if (res.error) {
      toast(res.error.message, 'danger');
      return;
    }
    toast('Student deleted');
    fetchStudents();
  };

  const handleStatusToggle = async (student) => {
    const next = student.status === 'active' ? 'inactive' : 'active';
    const res = await api.students.setStatus(student.id, next);
    if (res.error) {
      toast(res.error.message, 'danger');
      return;
    }
    toast(`Student ${next === 'active' ? 'activated' : 'deactivated'}`);
    fetchStudents();
  };

  const hasFilters = Object.values(filters).some((v) => v !== '' && v !== null && v !== undefined);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="mb-0">Students</h4>
        <Button onClick={() => { setEditing(null); setShowModal(true); }}>
          <i className="bi bi-person-plus me-1" /> Add Student
        </Button>
      </div>

      <Card className="ha-card mb-3">
        <Card.Body className="py-3">
          <Row className="g-2 align-items-center">
            <Col xs={12} md={4} lg={3}>
              <Form.Control placeholder="Search name, register no, dept..." onChange={onSearchChange} />
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Form.Select value={filters.category} onChange={(e) => onFilterChange('category', e.target.value)}>
                <option value="">Category: All</option>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Form.Select value={filters.department} onChange={(e) => onFilterChange('department', e.target.value)}>
                <option value="">Department: All</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Form.Select value={filters.study_year} onChange={(e) => onFilterChange('study_year', e.target.value)}>
                <option value="">Year: All</option>
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Form.Select value={filters.status} onChange={(e) => onFilterChange('status', e.target.value)}>
                <option value="">Status: All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Col>
            <Col xs={12} md={4} lg={1}>
              {hasFilters && (
                <Button variant="outline-secondary" className="w-100" onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }}>
                  <i className="bi bi-x-lg" />
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="ha-card">
        <Card.Body className="p-0">
          {loading ? (
            <Loading />
          ) : error ? (
            <EmptyState icon="bi-exclamation-triangle" title="Failed to load students" message={error} />
          ) : data?.data.length === 0 ? (
            <EmptyState
              icon="bi-people"
              title={hasFilters ? 'No students match the filters' : 'No students yet'}
              message={hasFilters ? 'Try adjusting the search or filters.' : 'Click "Add Student" to get started.'}
            />
          ) : (
            <>
              <div className="table-responsive">
                <Table hover size="sm" className="ha-table mb-0">
                  <thead>
                    <tr>
                      <th>Register No</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Room</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.map((s) => (
                      <tr key={s.id} className="cursor-pointer" onClick={() => setDetails(s)}>
                        <td className="fw-semibold text-primary">{s.register_no}</td>
                        <td>{s.name}</td>
                        <td>{s.category}</td>
                        <td>{s.department}</td>
                        <td>{s.study_year}</td>
                        <td>{s.room_number || '—'}</td>
                        <td><StatusBadge status={s.status} /></td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant={s.status === 'active' ? 'outline-secondary' : 'outline-success'}
                            className="me-1"
                            title={s.status === 'active' ? 'Deactivate' : 'Activate'}
                            onClick={() => handleStatusToggle(s)}
                          >
                            <i className={`bi ${s.status === 'active' ? 'bi-person-dash' : 'bi-person-check'}`} />
                          </Button>
                          <Button size="sm" variant="outline-primary" className="me-1" title="Edit" onClick={() => { setEditing(s); setShowModal(true); }}>
                            <i className="bi bi-pencil" />
                          </Button>
                          <Button size="sm" variant="outline-danger" title="Delete" onClick={() => setDeleteTarget(s)}>
                            <i className="bi bi-trash" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="d-flex justify-content-between align-items-center p-2 border-top">
                <small className="text-muted ps-2">
                  Showing {data?.data.length} of {data?.pagination.total}
                </small>
                <PaginationBar page={page} pages={data?.pagination.pages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <StudentFormModal
        show={showModal}
        onClose={() => { setShowModal(false); setEditing(null); }}
        onSaved={handleSaved}
        student={editing}
        rooms={rooms}
      />

      <ConfirmDialog
        show={!!deleteTarget}
        title="Delete student?"
        message={`This will permanently remove ${deleteTarget?.name} (${deleteTarget?.register_no}) and their attendance history.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        show={!!details}
        title={details?.name}
        message={
          details
            ? `${details.register_no} · ${details.category} · ${details.department} · Year ${details.study_year} · Room ${details.room_number || 'Not assigned'} · ${details.status}`
            : ''
        }
        confirmText="Close"
        variant="primary"
        onConfirm={() => setDetails(null)}
        onCancel={() => setDetails(null)}
      />
    </>
  );
}
