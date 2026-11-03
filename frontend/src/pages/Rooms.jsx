import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Form, ProgressBar, Row, Table } from 'react-bootstrap';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import PaginationBar from '../components/common/PaginationBar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RoomFormModal from '../components/rooms/RoomFormModal';
import AssignStudentModal from '../components/rooms/AssignStudentModal';
import TransferStudentModal from '../components/rooms/TransferStudentModal';

export default function Rooms() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [unassigned, setUnassigned] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = { page, size: 10, search: search || undefined, status: statusFilter || undefined };
    const res = await api.rooms.list(params);
    setLoading(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setData(res.data);
  }, [page, search, statusFilter]);

  const fetchMeta = useCallback(async () => {
    const [sumRes, unassignedRes] = await Promise.all([
      api.rooms.summary(),
      api.students.list({ size: 500, status: 'active', room_id: '' }),
    ]);
    if (!sumRes.error) setSummary(sumRes.data.data);
    const all = unassignedRes.data?.data || [];
    setUnassigned(all.filter((s) => s.room_id === null));
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const reload = () => {
    fetchRooms();
    fetchMeta();
  };

  const handleDelete = async () => {
    const res = await api.rooms.remove(deleteTarget.id);
    setDeleteTarget(null);
    if (res.error) {
      toast(res.error.message, 'danger');
      return;
    }
    toast('Room deleted');
    reload();
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="mb-0">Rooms</h4>
        <Button onClick={() => { setEditing(null); setShowCreate(true); }}>
          <i className="bi bi-plus-lg me-1" /> Create Room
        </Button>
      </div>

      <Row className="g-3 mb-3">
        <Col xs={6} md={3}>
          <Card className="ha-card"><Card.Body className="py-2"><div className="small text-muted">Total Rooms</div><div className="fs-4 fw-bold">{summary?.totalRooms ?? '—'}</div></Card.Body></Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="ha-card"><Card.Body className="py-2"><div className="small text-muted">Total Beds</div><div className="fs-4 fw-bold">{summary?.totalCapacity ?? '—'}</div></Card.Body></Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="ha-card"><Card.Body className="py-2"><div className="small text-muted">Occupied Beds</div><div className="fs-4 fw-bold text-success">{summary?.occupied ?? '—'}</div></Card.Body></Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="ha-card"><Card.Body className="py-2"><div className="small text-muted">Available Beds</div><div className="fs-4 fw-bold text-info">{summary?.available ?? '—'}</div></Card.Body></Card>
        </Col>
      </Row>

      <Card className="ha-card mb-3">
        <Card.Body className="py-3">
          <Row className="g-2">
            <Col xs={12} md={6} lg={4}>
              <Form.Control placeholder="Search room number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </Col>
            <Col xs={12} md={6} lg={4}>
              <Form.Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">Status: All</option>
                <option value="available">Available</option>
                <option value="full">Full</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="ha-card">
        <Card.Body className="p-0">
          {loading ? (
            <Loading />
          ) : error ? (
            <EmptyState icon="bi-exclamation-triangle" title="Failed to load rooms" message={error} />
          ) : data?.data.length === 0 ? (
            <EmptyState icon="bi-bed" title="No rooms found" message='Click "Create Room" to add one.' />
          ) : (
            <>
              <div className="table-responsive">
                <Table hover size="sm" className="ha-table mb-0">
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Capacity</th>
                      <th style={{ minWidth: 160 }}>Occupancy</th>
                      <th>Available Beds</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.data.map((r) => {
                      const full = r.current_strength >= r.capacity;
                      const pct = r.capacity ? Math.round((r.current_strength / r.capacity) * 100) : 0;
                      return (
                        <tr key={r.id}>
                          <td className="fw-semibold text-primary">{r.room_number}</td>
                          <td>{r.capacity}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <ProgressBar now={pct} variant={full ? 'danger' : pct >= 75 ? 'warning' : 'success'} style={{ height: 8, flex: 1 }} />
                              <small className="text-muted text-nowrap">{r.current_strength}/{r.capacity}</small>
                            </div>
                          </td>
                          <td>
                            {r.available_beds > 0 ? (
                              <Badge bg="success-subtle" text="success">{r.available_beds} bed(s)</Badge>
                            ) : (
                              <Badge bg="danger-subtle" text="danger">Full</Badge>
                            )}
                          </td>
                          <td>
                            <Badge bg={full ? 'danger-subtle' : 'success-subtle'} text={full ? 'danger' : 'success'}>
                              {full ? 'Full' : 'Available'}
                            </Badge>
                          </td>
                          <td className="text-end text-nowrap">
                            <Button size="sm" variant="outline-success" className="me-1" title="Assign student"
                              onClick={() => setAssignTarget(r)}>
                              <i className="bi bi-person-plus" />
                            </Button>
                            <Button size="sm" variant="outline-primary" className="me-1" title="Edit"
                              onClick={() => { setEditing(r); setShowCreate(true); }}>
                              <i className="bi bi-pencil" />
                            </Button>
                            <Button size="sm" variant="outline-danger" title="Delete"
                              onClick={() => setDeleteTarget(r)}>
                              <i className="bi bi-trash" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              <div className="d-flex justify-content-between align-items-center p-2 border-top">
                <small className="text-muted ps-2">Showing {data?.data.length} of {data?.pagination.total}</small>
                <PaginationBar page={page} pages={data?.pagination.pages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Occupants of the currently selected room */}
      {assignTarget && (
        <Card className="ha-card mt-3">
          <Card.Header className="bg-white d-flex justify-content-between align-items-center">
            <strong>Room {assignTarget.room_number} — Occupants ({assignTarget.current_strength}/{assignTarget.capacity})</strong>
            <div>
              <Button size="sm" variant="outline-success" className="me-2" onClick={() => setShowAssign(true)}>
                <i className="bi bi-person-plus me-1" /> Assign
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={() => setAssignTarget(null)}>Close</Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {assignTarget.occupants?.length ? (
              <Table size="sm" className="ha-table mb-0">
                <thead>
                  <tr><th>Register No</th><th>Name</th><th>Dept</th><th>Year</th><th className="text-end">Actions</th></tr>
                </thead>
                <tbody>
                  {assignTarget.occupants.map((o) => (
                    <tr key={o.id}>
                      <td>{o.register_no}</td>
                      <td>{o.name}</td>
                      <td>{o.department}</td>
                      <td>{o.study_year}</td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-primary" className="me-1" onClick={() => { setTransferTarget(o); setShowAssign(false); }}>
                          <i className="bi bi-arrow-left-right" /> Transfer
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={async () => {
                          const res = await api.rooms.unassign(o.id);
                          if (res.error) toast(res.error.message, 'danger');
                          else { toast('Student removed from room'); reload(); }
                        }}>
                          <i className="bi bi-person-dash" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState icon="bi-person-x" title="No occupants" message="Assign a student to this room." />
            )}
          </Card.Body>
        </Card>
      )}

      <RoomFormModal
        show={showCreate}
        onClose={() => { setShowCreate(false); setEditing(null); }}
        onSaved={() => { setShowCreate(false); setEditing(null); reload(); }}
        room={editing}
      />

      <AssignStudentModal
        show={showAssign}
        onClose={() => setShowAssign(false)}
        onAssigned={() => { setShowAssign(false); reload(); }}
        room={assignTarget}
        unassignedStudents={unassigned || []}
      />

      <TransferStudentModal
        show={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        onDone={() => { setTransferTarget(null); reload(); }}
        student={transferTarget}
        rooms={data?.data || []}
      />

      <ConfirmDialog
        show={!!deleteTarget}
        title="Delete room?"
        message={`This will permanently remove room ${deleteTarget?.room_number}.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
