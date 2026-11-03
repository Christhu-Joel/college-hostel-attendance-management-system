import { useEffect, useState } from 'react';
import { Card, Col, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api } from '../api';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/Badges';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [overview, chartRes] = await Promise.all([
        api.dashboard.overview(),
        api.dashboard.charts({ days: 14, top: 8 }),
      ]);
      if (!mounted) return;
      if (overview.error || chartRes.error) {
        setError(overview.error?.message || chartRes.error?.message || 'Failed to load dashboard');
        return;
      }
      setData(overview.data.data);
      setCharts(chartRes.data.data);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="alert alert-warning d-flex align-items-center gap-2">
        <i className="bi bi-exclamation-triangle" />
        <div>
          <strong>Could not load dashboard.</strong> {error}. Make sure the backend is running
          (npm run dev in /backend) and the database is imported.
        </div>
      </div>
    );
  }

  if (!data || !charts) return <Loading fullPage text="Loading dashboard..." />;

  const trendData = charts.dailyTrend.map((d) => ({
    date: d.date.slice(5),
    present: d.present,
    absent: d.absent,
  }));

  const pieData = [
    { name: 'Present', value: charts.presentVsAbsent.present, color: '#198754' },
    { name: 'Absent', value: charts.presentVsAbsent.absent, color: '#dc3545' },
  ];

  return (
    <>
      <h4 className="mb-3">Dashboard</h4>

      <Row className="g-3 mb-3">
        <Col xs={6} md={4} xl={2}>
          <StatCard icon="bi-people" iconClass="bg-primary-subtle text-primary" label="Total Students" value={data.students.totalStudents} />
        </Col>
        <Col xs={6} md={4} xl={2}>
          <StatCard icon="bi-person-check" iconClass="bg-success-subtle text-success" label="Active Students" value={data.students.activeStudents} />
        </Col>
        <Col xs={6} md={4} xl={2}>
          <StatCard icon="bi-person-dash" iconClass="bg-secondary-subtle text-secondary" label="Inactive Students" value={data.students.inactiveStudents} />
        </Col>
        <Col xs={6} md={4} xl={2}>
          <StatCard icon="bi-check-circle" iconClass="bg-success-subtle text-success" label="Today Present" value={data.today.present} />
        </Col>
        <Col xs={6} md={4} xl={2}>
          <StatCard icon="bi-x-circle" iconClass="bg-danger-subtle text-danger" label="Today Absent" value={data.today.absent} />
        </Col>
        <Col xs={6} md={4} xl={2}>
          <StatCard icon="bi-building" iconClass="bg-info-subtle text-info" label="Hostel Occupancy" value={`${data.rooms.occupancyRate}%`} sub={`${data.rooms.occupied}/${data.rooms.totalCapacity} beds`} />
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={8}>
          <Card className="ha-card h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <strong>Daily Attendance Trend (14 days)</strong>
            </Card.Header>
            <Card.Body style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="present" name="Present" fill="#198754" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#dc3545" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="ha-card h-100">
            <Card.Header className="bg-white">
              <strong>Present vs Absent</strong>
            </Card.Header>
            <Card.Body style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="ha-card h-100">
            <Card.Header className="bg-white">
              <strong>Frequently Absent Students</strong>
            </Card.Header>
            <Card.Body>
              {charts.frequentlyAbsent.length === 0 ? (
                <EmptyState icon="bi-emoji-smile" title="No absences recorded" />
              ) : (
                <Table size="sm" hover className="ha-table mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Dept</th>
                      <th className="text-center">Absent Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charts.frequentlyAbsent.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="fw-semibold">{s.name}</div>
                          <small className="text-muted">{s.register_no}</small>
                        </td>
                        <td>{s.department}</td>
                        <td className="text-center">
                          <span className="badge text-bg-danger rounded-pill">{s.absent_days}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="ha-card h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <strong>Recent Attendance Activity</strong>
              <Link to="/attendance" className="btn btn-sm btn-outline-primary">View Attendance</Link>
            </Card.Header>
            <Card.Body>
              {data.recentActivity.length === 0 ? (
                <EmptyState icon="bi-check2-square" title="No activity yet" />
              ) : (
                <Table size="sm" hover className="ha-table mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Room</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentActivity.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <div className="fw-semibold">{a.name}</div>
                          <small className="text-muted">{a.register_no}</small>
                        </td>
                        <td>{a.room_number || '—'}</td>
                        <td>{a.attendance_date}</td>
                        <td><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
