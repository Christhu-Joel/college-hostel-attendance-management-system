import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Col, Form, Row, Table, Tabs, Tab } from 'react-bootstrap';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import PaginationBar from '../components/common/PaginationBar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { StatusBadge } from '../components/common/Badges';

const today = () => new Date().toISOString().slice(0, 10);

function MarkAttendanceTab() {
  const toast = useToast();
  const [date, setDate] = useState(today());
  const [records, setRecords] = useState(null);
  const [students, setStudents] = useState(null);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const attRes = await api.attendance.getForDate(date);
    setLoading(false);
    if (attRes.error) {
      setError(attRes.error?.message || 'Failed to load');
      return;
    }
    const sheet = attRes.data.data.data || [];
    const active = sheet.map((s) => ({
      id: s.student_id,
      register_no: s.register_no,
      name: s.name,
      category: s.category,
      department: s.department,
      study_year: s.study_year,
      room_number: s.room_number,
    }));
    setStudents(active);
    setCounts(attRes.data.data.counts);
    setRecords(
      active.map((s, i) => {
        const row = sheet[i];
        return {
          student: s,
          status: row.attendance_status || 'present',
          saved: !!row.attendance_id,
          savedStatus: row.attendance_status || null,
        };
      })
    );
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id, status) => {
    setRecords((rs) => rs.map((r) => (r.student.id === id ? { ...r, status } : r)));
  };

  const presentCount = records?.filter((r) => r.status === 'present').length ?? 0;
  const absentCount = records?.filter((r) => r.status === 'absent').length ?? 0;
  const alreadySaved = records?.some((r) => r.saved) ?? false;

  const save = async () => {
    setSaving(true);
    const payload = {
      date,
      records: records
        .filter((r) => !r.saved || r.status !== r.savedStatus)
        .map((r) => ({ student_id: r.student.id, status: r.status })),
    };
    if (payload.records.length === 0) {
      setSaving(false);
      setConfirmOpen(false);
      toast('No changes to save');
      return;
    }
    const res = await api.attendance.mark(payload);
    setSaving(false);
    setConfirmOpen(false);
    if (res.error) {
      toast(res.error.message, 'danger');
      return;
    }
    toast(alreadySaved ? 'Attendance updated' : `Attendance recorded for ${payload.records.length} student(s)`);
    load();
  };

  return (
    <>
      <Card className="ha-card mb-3">
        <Card.Body className="py-3">
          <Row className="g-2 align-items-center">
            <Col xs={12} md={4} lg={3}>
              <Form.Control type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Button variant="outline-success" size="sm" onClick={() => setRecords((rs) => rs.map((r) => ({ ...r, status: 'present' })))}>
                  <i className="bi bi-check-all me-1" />All Present
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => setRecords((rs) => rs.map((r) => ({ ...r, status: 'absent' })))}>
                  <i className="bi bi-x-octagon me-1" />All Absent
                </Button>
              </div>
            </Col>
            <Col xs="auto" className="ms-auto d-flex gap-3">
              <span className="text-success fw-semibold"><i className="bi bi-check-circle me-1" />{presentCount} present</span>
              <span className="text-danger fw-semibold"><i className="bi bi-x-circle me-1" />{absentCount} absent</span>
              {counts?.total > 0 && (
                <span className="text-muted small align-self-center">
                  {alreadySaved ? `${counts.present} present / ${counts.absent} absent already recorded` : 'No record for this date yet'}
                </span>
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
          ) : !records?.length ? (
            <EmptyState icon="bi-people" title="No active students" message="Add students first." />
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
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.student.id} className={r.saved ? 'bg-white' : 'bg-warning-subtle'}>
                        <td className="fw-semibold text-primary">{r.student.register_no}</td>
                        <td>{r.student.name}</td>
                        <td>{r.student.category}</td>
                        <td>{r.student.department}</td>
                        <td>{r.student.study_year}</td>
                        <td>{r.student.room_number || '—'}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className={`btn ${r.status === 'present' ? 'btn-success' : 'btn-outline-success'}`}
                              onClick={() => toggle(r.student.id, 'present')}
                            >
                              <i className="bi bi-check-lg" /> Present
                            </button>
                            <button
                              type="button"
                              className={`btn ${r.status === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`}
                              onClick={() => toggle(r.student.id, 'absent')}
                            >
                              <i className="bi bi-x-lg" /> Absent
                            </button>
                          </div>
                          {r.saved && <small className="text-muted ms-2">saved</small>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="p-3 border-top d-flex justify-content-end">
                <Button variant="primary" size="lg" onClick={() => setConfirmOpen(true)} disabled={saving}>
                  {saving ? 'Saving...' : alreadySaved ? 'Update Attendance' : 'Save Attendance'}
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      <ConfirmDialog
        show={confirmOpen}
        title={alreadySaved ? 'Update attendance?' : 'Save attendance?'}
        message={`Save attendance for ${date}? (${presentCount} present, ${absentCount} absent)`}
        confirmText="Save"
        variant="primary"
        onConfirm={save}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function HistoryTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', date: '', room_id: '', status: '' });
  const [rooms, setRooms] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [newStatus, setNewStatus] = useState('present');
  const searchTimer = useRef(null);
  const toast = useToast();

  useEffect(() => {
    api.rooms.list({ size: 500 }).then((res) => {
      if (!res.error) setRooms(res.data.data);
    });
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = { page, size: 20, ...filters, search: filters.search || undefined, room_id: filters.room_id || undefined, status: filters.status || undefined, date: filters.date || undefined };
    const res = await api.attendance.history(params);
    setLoading(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setData(res.data);
  }, [page, filters]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onSearchChange = (e) => {
    const value = e.target.value;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: value }));
      setPage(1);
    }, 400);
  };

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };

  const handleEdit = async () => {
    const res = await api.attendance.update(editTarget.id, newStatus);
    setEditTarget(null);
    if (res.error) {
      toast(res.error.message, 'danger');
      return;
    }
    toast('Attendance updated');
    fetchHistory();
  };

  return (
    <Card className="ha-card">
      <Card.Body className="py-3">
        <Row className="g-2 mb-3">
          <Col xs={12} md={3}>
            <Form.Control placeholder="Search student..." onChange={onSearchChange} />
          </Col>
          <Col xs={6} md={3}>
            <Form.Control type="date" value={filters.date} onChange={setFilter('date')} />
          </Col>
          <Col xs={6} md={3}>
            <Form.Select value={filters.room_id} onChange={setFilter('room_id')}>
              <option value="">Room: All</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.room_number}</option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={3}>
            <Form.Select value={filters.status} onChange={setFilter('status')}>
              <option value="">Status: All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </Form.Select>
          </Col>
        </Row>
      </Card.Body>
      <Card.Body className="p-0">
        {loading ? (
          <Loading />
        ) : error ? (
          <EmptyState icon="bi-exclamation-triangle" title="Failed to load history" message={error} />
        ) : !data?.data.length ? (
          <EmptyState icon="bi-clock-history" title="No attendance records" message="Try different filters or mark attendance first." />
        ) : (
          <>
            <div className="table-responsive">
              <Table hover size="sm" className="ha-table mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Register No</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Room</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((a) => (
                    <tr key={a.id}>
                      <td className="text-nowrap">{a.attendance_date}</td>
                      <td className="text-primary">{a.register_no}</td>
                      <td>{a.name}</td>
                      <td>{a.department}</td>
                      <td>{a.room_number || '—'}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" onClick={() => { setEditTarget(a); setNewStatus(a.status === 'present' ? 'absent' : 'present'); }}>
                          <i className="bi bi-pencil" /> Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="d-flex justify-content-between align-items-center p-2 border-top">
              <small className="text-muted ps-2">Showing {data.data.length} of {data.pagination.total}</small>
              <PaginationBar page={page} pages={data.pagination.pages} onPageChange={setPage} />
            </div>
          </>
        )}
      </Card.Body>

      <ConfirmDialog
        show={!!editTarget}
        title="Edit attendance"
        message={`Change ${editTarget?.name} (${editTarget?.attendance_date}) to ${newStatus}?`}
        confirmText="Save"
        variant="primary"
        onConfirm={handleEdit}
        onCancel={() => setEditTarget(null)}
      />
    </Card>
  );
}

export default function Attendance() {
  return (
    <>
      <h4 className="mb-3">Attendance</h4>
      <Tabs defaultActiveKey="mark" className="mb-3">
        <Tab eventKey="mark" title={<span><i className="bi bi-clipboard-check me-1" />Mark Attendance</span>}>
          <MarkAttendanceTab />
        </Tab>
        <Tab eventKey="history" title={<span><i className="bi bi-clock-history me-1" />History</span>}>
          <HistoryTab />
        </Tab>
      </Tabs>
    </>
  );
}
