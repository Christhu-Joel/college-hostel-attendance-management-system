import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Form, Modal, Table } from 'react-bootstrap';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function AcademicYears() {
  const toast = useToast();
  const [years, setYears] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [yearName, setYearName] = useState('');
  const [activateTarget, setActivateTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const fetchYears = useCallback(async () => {
    setLoading(true);
    const res = await api.academicYears.list();
    setLoading(false);
    if (!res.error) setYears(res.data.data);
    else toast(res.error.message, 'danger');
  }, [toast]);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const createYear = async (e) => {
    e.preventDefault();
    const res = await api.academicYears.create({ year_name: yearName });
    if (res.error) {
      toast(res.error.message, 'danger');
      return;
    }
    toast('Academic year created');
    setShowCreate(false);
    setYearName('');
    fetchYears();
  };

  const activate = async () => {
    const res = await api.academicYears.activate(activateTarget.id);
    setActivateTarget(null);
    if (res.error) {
      toast(res.error.message, 'danger');
      return;
    }
    toast(`Activated ${activateTarget.year_name}`);
    fetchYears();
  };

  const archive = async () => {
    const res = await api.academicYears.archive(archiveTarget.id);
    setArchiveTarget(null);
    if (res.error) {
      toast(res.error.message, 'danger');
      return;
    }
    toast(`Archived ${archiveTarget.year_name}`);
    fetchYears();
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="mb-0">Academic Years</h4>
        <Button onClick={() => setShowCreate(true)}>
          <i className="bi bi-plus-lg me-1" /> Create Academic Year
        </Button>
      </div>

      <div className="alert alert-info d-flex align-items-center gap-2">
        <i className="bi bi-info-circle" />
        <div>
          Archived academic years keep all attendance records. The active year is used for new attendance marking.
          Records are never deleted automatically.
        </div>
      </div>

      <Card className="ha-card">
        <Card.Body className="p-0">
          {loading ? (
            <Loading />
          ) : years?.length === 0 ? (
            <EmptyState icon="bi-calendar-plus" title="No academic years" message='Click "Create Academic Year" to add one.' />
          ) : (
            <div className="table-responsive">
              <Table hover size="sm" className="ha-table mb-0">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Attendance Records</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {years?.map((y) => (
                    <tr key={y.id}>
                      <td className="fw-semibold">{y.year_name}</td>
                      <td>
                        {y.is_active ? (
                          <Badge bg="success-subtle" text="success"><i className="bi bi-check-circle me-1" />Active</Badge>
                        ) : (
                          <Badge bg="secondary-subtle" text="secondary">Archived</Badge>
                        )}
                      </td>
                      <td>{y.attendance_count}</td>
                      <td>{new Date(y.created_at).toLocaleDateString()}</td>
                      <td className="text-end text-nowrap">
                        {!y.is_active && (
                          <>
                            <Button size="sm" variant="outline-success" className="me-1" onClick={() => setActivateTarget(y)}>
                              <i className="bi bi-check2-circle me-1" />Activate
                            </Button>
                            <Button size="sm" variant="outline-secondary" onClick={() => setArchiveTarget(y)}>
                              <i className="bi bi-archive me-1" />Archive
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Form onSubmit={createYear}>
          <Modal.Header closeButton>
            <Modal.Title>Create Academic Year</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Year Name</Form.Label>
              <Form.Control
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
                placeholder="e.g. 2026-2027"
                required
              />
              <Form.Text className="text-muted">Format: YYYY-YYYY</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmDialog
        show={!!activateTarget}
        title="Activate academic year?"
        message={`Set ${activateTarget?.year_name} as the active academic year? New attendance will be linked to it.`}
        confirmText="Activate"
        variant="primary"
        onConfirm={activate}
        onCancel={() => setActivateTarget(null)}
      />

      <ConfirmDialog
        show={!!archiveTarget}
        title="Archive academic year?"
        message={`Archive ${archiveTarget?.year_name}? Attendance records will be preserved.`}
        confirmText="Archive"
        onConfirm={archive}
        onCancel={() => setArchiveTarget(null)}
      />
    </>
  );
}
