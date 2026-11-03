import { useEffect, useState } from 'react';
import { Card, Col, Form, Row, Table } from 'react-bootstrap';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { api } from '../api';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { PercentBadge } from '../components/common/Badges';

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#0dcaf0', '#fd7e14', '#20c997'];

function ChartCard({ title, height = 280, children }) {
  return (
    <Card className="ha-card h-100">
      <Card.Header className="bg-white"><strong>{title}</strong></Card.Header>
      <Card.Body style={{ height }}>{children}</Card.Body>
    </Card>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [years, setYears] = useState([]);
  const [yearId, setYearId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.academicYears.list().then((res) => {
      if (!res.error) setYears(res.data.data);
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const params = yearId ? { academic_year_id: yearId } : {};
    Promise.all([api.reports.charts(params), api.dashboard.charts({ days: 30, top: 10 })]).then(([charts, dash]) => {
      if (!mounted) return;
      setLoading(false);
      if (charts.error || dash.error) {
        setError(charts.error?.message || dash.error?.message || 'Failed to load analytics');
        return;
      }
      setData({ ...charts.data.data, frequentlyAbsent: dash.data.data.frequentlyAbsent });
    });
    return () => {
      mounted = false;
    };
  }, [yearId]);

  const pieData = data
    ? [
        { name: 'Present', value: data.monthly.reduce((s, m) => s + m.present, 0) },
        { name: 'Absent', value: data.monthly.reduce((s, m) => s + m.absent, 0) },
      ]
    : [];

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="mb-0">Charts & Analytics</h4>
        <Form.Select style={{ width: 220 }} value={yearId} onChange={(e) => setYearId(e.target.value)}>
          <option value="">All time</option>
          {years.map((y) => (
            <option key={y.id} value={y.id}>{y.year_name}</option>
          ))}
        </Form.Select>
      </div>

      {loading ? (
        <Loading fullPage text="Loading analytics..." />
      ) : error ? (
        <div className="alert alert-warning">{error}</div>
      ) : (
        <>
          <Row className="g-3">
            <Col lg={8}>
              <ChartCard title="Monthly Attendance Trend (12 months)">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthly}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Legend />
                    <Bar dataKey="present" fill="#198754" name="Present" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="absent" fill="#dc3545" name="Absent" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
            <Col lg={4}>
              <ChartCard title="Present vs Absent (overall)">
                {pieData.every((d) => d.value === 0) ? (
                  <EmptyState icon="bi-pie-chart" title="No attendance data" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                        {pieData.map((e, i) => (
                          <Cell key={e.name} fill={i === 0 ? '#198754' : '#dc3545'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </Col>

            <Col lg={6}>
              <ChartCard title="Room Occupancy">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.roomOccupancy} margin={{ left: -10 }}>
                    <XAxis dataKey="room_number" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Legend />
                    <Bar dataKey="occupied" name="Occupied" stackId="a" fill="#0d6efd" />
                    <Bar dataKey="available" name="Available" stackId="a" fill="#cfe2ff" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>

            <Col lg={6}>
              <ChartCard title="Hall-wise Attendance">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hallWise} margin={{ left: -10 }}>
                    <XAxis dataKey="hall" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Legend />
                    <Bar dataKey="present" name="Present" stackId="a" fill="#198754" />
                    <Bar dataKey="absent" name="Absent" stackId="a" fill="#dc3545" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>

            <Col lg={7}>
              <ChartCard title="Attendance Percentage per Student (lowest first)" height={360}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.percentages} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="percentage" name="Attendance %" radius={[0, 4, 4, 0]}>
                      {data.percentages.map((p, i) => (
                        <Cell key={p.id} fill={p.percentage >= 75 ? '#198754' : p.percentage >= 50 ? '#ffc107' : '#dc3545'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>

            <Col lg={5}>
              <Card className="ha-card h-100">
                <Card.Header className="bg-white"><strong>Frequently Absent Students</strong></Card.Header>
                <Card.Body>
                  {data.frequentlyAbsent.length === 0 ? (
                    <EmptyState icon="bi-emoji-smile" title="No absences" />
                  ) : (
                    <Table size="sm" hover className="ha-table mb-0">
                      <thead>
                        <tr><th>Student</th><th>Absent Days</th><th>Rate</th></tr>
                      </thead>
                      <tbody>
                        {data.frequentlyAbsent.map((s) => {
                          const rate = s.total_days ? Math.round((s.absent_days / s.total_days) * 100) : 0;
                          return (
                            <tr key={s.id}>
                              <td>
                                <div className="fw-semibold">{s.name}</div>
                                <small className="text-muted">{s.department}</small>
                              </td>
                              <td className="text-danger fw-semibold">{s.absent_days}</td>
                              <td><PercentBadge value={100 - rate} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
