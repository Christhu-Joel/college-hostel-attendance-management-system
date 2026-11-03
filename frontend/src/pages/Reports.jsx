import { useEffect, useState } from 'react';
import { Button, ButtonGroup, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { api } from '../api';
import Loading from '../components/common/Loading';
import EmptyState from '../components/common/EmptyState';
import { PercentBadge } from '../components/common/Badges';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportCSV, exportExcel, exportPDF, printPage } from '../utils/exportUtils';

const PERIODS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'academic_year', label: 'Academic Year' },
];

const PERIOD_TITLES = {
  daily: 'Daily Attendance Report',
  weekly: 'Weekly Attendance Report',
  monthly: 'Monthly Attendance Report',
  academic_year: 'Academic Year Attendance Report',
};

export default function Reports() {
  const [reportType, setReportType] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ departments: [], rooms: [], academicYears: [] });

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const [yearId, setYearId] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    api.reports.meta().then((res) => {
      if (!res.error) setMeta(res.data.data);
    });
  }, []);

  const loadReport = async (type) => {
    setLoading(true);
    setError(null);
    let res;
    if (type === 'students') {
      res = await api.reports.students({
        from: dateRange.from || undefined,
        to: dateRange.to || undefined,
        academic_year_id: yearId || undefined,
        department: department || undefined,
        category: category || undefined,
      });
    } else if (type === 'rooms') {
      res = await api.reports.rooms({
        from: dateRange.from || undefined,
        to: dateRange.to || undefined,
        academic_year_id: yearId || undefined,
      });
    } else if (type === 'daily') {
      res = await api.reports.daily({
        from: dateRange.from || undefined,
        to: dateRange.to || undefined,
        academic_year_id: yearId || undefined,
      });
    } else {
      res = await api.reports.period(type, { academic_year_id: yearId || undefined });
    }
    setLoading(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setData(res.data.data);
  };

  useEffect(() => {
    loadReport(reportType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, dateRange.from, dateRange.to, yearId, department, category]);

  const isDailyTable = reportType === 'daily' || PERIODS.some((p) => p.key === reportType);

  const dailyRows = (Array.isArray(data?.data) ? data.data : []).map((d) => [d.attendance_date, d.total_students, d.present, d.absent, `${d.rate}%`]);
  const studentRows = (Array.isArray(data) ? data : []).map((s) => [s.register_no, s.name, s.category, s.department, s.room_number || '—', s.total_days, s.present_days, s.absent_days, `${s.percentage}%`]);
  const roomRows = (Array.isArray(data) ? data : []).map((r) => [r.room_number, r.capacity, r.current_strength, r.students_recorded, r.total_records, r.present_records, r.absent_records, `${r.attendance_rate}%`]);

  const getFileName = () =>
    `hostel-attendance-${reportType}-${new Date().toISOString().slice(0, 10)}`;

  const exportData = (kind) => {
    if (reportType === 'students') {
      const headers = ['Register No', 'Name', 'Category', 'Department', 'Room', 'Total Days', 'Present', 'Absent', '%'];
      if (kind === 'csv') exportCSV(headers, studentRows, getFileName());
      if (kind === 'excel') exportExcel(headers, studentRows, getFileName(), 'Student Report');
      if (kind === 'pdf') exportPDF(headers, studentRows, getFileName(), { title: 'Student Attendance Report', subtitle: `${dateRange.from} to ${dateRange.to}` });
    } else if (reportType === 'rooms') {
      const headers = ['Room', 'Capacity', 'Occupied', 'Students Recorded', 'Records', 'Present', 'Absent', 'Rate'];
      if (kind === 'csv') exportCSV(headers, roomRows, getFileName());
      if (kind === 'excel') exportExcel(headers, roomRows, getFileName(), 'Room Report');
      if (kind === 'pdf') exportPDF(headers, roomRows, getFileName(), { title: 'Room-wise Attendance Report', subtitle: `${dateRange.from} to ${dateRange.to}` });
    } else {
      const headers = ['Date', 'Students', 'Present', 'Absent', 'Rate'];
      const period = reportType === 'daily' ? `${dateRange.from} to ${dateRange.to}` : '';
      if (kind === 'csv') exportCSV(headers, dailyRows, getFileName());
      if (kind === 'excel') exportExcel(headers, dailyRows, getFileName(), `${PERIOD_TITLES[reportType]}`);
      if (kind === 'pdf') {
        if (reportType === 'daily') {
          exportDailyReportPDF(dailyRows, data?.students || {}, dateRange, getFileName());
        } else {
          exportPDF(headers, dailyRows, getFileName(), { title: PERIOD_TITLES[reportType], subtitle: period });
        }
      }
    }
  };

  const exportDailyReportPDF = (summaryRows, studentsByDate, range, filename) => {
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.text('Daily Attendance Report', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`${range.from} → ${range.to}`, 14, 24);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.setTextColor(0);
    doc.setFontSize(11);

    autoTable(doc, {
      head: [['Date', 'Students', 'Present', 'Absent', 'Rate']],
      body: summaryRows,
      startY: 36,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [27, 42, 74] },
    });

    const presentHeaders = ['S.No', 'Student Name', 'Register No', 'Room No', 'Category', 'Department', 'Attendance'];
    for (const row of summaryRows) {
      const dateKey = row[0] && row[0].slice && row[0].slice(0, 10);
      const students = dateKey ? studentsByDate[dateKey] : undefined;
      if (!students || !students.length) continue;

      const body = students.map((s, i) => [
        i + 1, s.student_name, s.register_no, s.room_number || '—', s.category, s.department, 'Present',
      ]);

      let startY = doc.lastAutoTable.finalY + 10;
      if (startY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        startY = 20;
      }
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Present Students - ${dateKey}`, 14, startY);
      autoTable(doc, {
        head: [presentHeaders],
        body,
        startY: startY + 3,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [27, 42, 74] },
        alternateRowStyles: { fillColor: [245, 246, 250] },
      });
    }

    doc.save(`${filename}.pdf`);
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h4 className="mb-0">Reports</h4>
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-success" onClick={() => exportData('excel')} disabled={loading}>
            <i className="bi bi-file-earmark-excel me-1" />Excel
          </Button>
          <Button size="sm" variant="outline-danger" onClick={() => exportData('pdf')} disabled={loading}>
            <i className="bi bi-file-earmark-pdf me-1" />PDF
          </Button>
          <Button size="sm" variant="outline-primary" onClick={() => exportData('csv')} disabled={loading}>
            <i className="bi bi-filetype-csv me-1" />CSV
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={printPage}>
            <i className="bi bi-printer me-1" />Print
          </Button>
        </div>
      </div>

      <Card className="ha-card mb-3">
        <Card.Body className="py-3">
          <Row className="g-2 align-items-end">
            <Col xs={12} md={4} lg={2}>
              <Form.Label className="small text-muted mb-1">Report Type</Form.Label>
              <Form.Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="academic_year">Academic Year</option>
                <option value="students">Student Report</option>
                <option value="rooms">Room-wise Report</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Form.Label className="small text-muted mb-1">From</Form.Label>
              <Form.Control type="date" value={dateRange.from} onChange={(e) => setDateRange((d) => ({ ...d, from: e.target.value }))} />
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Form.Label className="small text-muted mb-1">To</Form.Label>
              <Form.Control type="date" value={dateRange.to} onChange={(e) => setDateRange((d) => ({ ...d, to: e.target.value }))} />
            </Col>
            <Col xs={6} md={4} lg={2}>
              <Form.Label className="small text-muted mb-1">Academic Year</Form.Label>
              <Form.Select value={yearId} onChange={(e) => setYearId(e.target.value)}>
                <option value="">All</option>
                {meta.academicYears.map((y) => (
                  <option key={y.id} value={y.id}>{y.year_name}</option>
                ))}
              </Form.Select>
            </Col>
            {reportType === 'students' && (
              <>
                <Col xs={6} md={4} lg={2}>
                  <Form.Label className="small text-muted mb-1">Department</Form.Label>
                  <Form.Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="">All</option>
                    {meta.departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={6} md={4} lg={2}>
                  <Form.Label className="small text-muted mb-1">Category</Form.Label>
                  <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">All</option>
                    <option value="UG">UG</option>
                    <option value="PG">PG</option>
                  </Form.Select>
                </Col>
              </>
            )}
          </Row>
        </Card.Body>
      </Card>

      <Card className="ha-card">
        <Card.Header className="bg-white d-flex justify-content-between align-items-center">
          <strong>
            {reportType === 'students'
              ? 'Student Attendance Report'
              : reportType === 'rooms'
                ? 'Room-wise Report'
                : PERIOD_TITLES[reportType]}
          </strong>
          <span className="text-muted small">
            {(reportType === 'students' || reportType === 'daily') && `${dateRange.from} → ${dateRange.to}`}
            {reportType !== 'students' && reportType !== 'daily' && reportType !== 'rooms' && 'Last 30 days'}
          </span>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <Loading />
          ) : error ? (
            <EmptyState icon="bi-exclamation-triangle" title="Failed to load report" message={error} />
          ) : isDailyTable ? (
            data?.data.length ? (
              <div className="table-responsive">
                <Table hover size="sm" className="ha-table mb-0">
                  <thead>
                    <tr><th>Date</th><th>Students</th><th>Present</th><th>Absent</th><th>Rate</th></tr>
                  </thead>
                  <tbody>
                    {data.data.map((d) => (
                      <tr key={d.attendance_date}>
                        <td>{d.attendance_date}</td>
                        <td>{d.total_students}</td>
                        <td className="text-success">{d.present}</td>
                        <td className="text-danger">{d.absent}</td>
                        <td><PercentBadge value={d.rate} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <EmptyState icon="bi-calendar-x" title="No records in this range" />
            )
          ) : reportType === 'rooms' ? (
            data?.length ? (
              <div className="table-responsive">
                <Table hover size="sm" className="ha-table mb-0">
                  <thead>
                    <tr><th>Room</th><th>Capacity</th><th>Occupied</th><th>Students Recorded</th><th>Records</th><th>Present</th><th>Absent</th><th>Rate</th></tr>
                  </thead>
                  <tbody>
                    {data.map((r) => (
                      <tr key={r.id}>
                        <td className="fw-semibold">{r.room_number}</td>
                        <td>{r.capacity}</td>
                        <td>{r.current_strength}</td>
                        <td>{r.students_recorded}</td>
                        <td>{r.total_records}</td>
                        <td className="text-success">{r.present_records}</td>
                        <td className="text-danger">{r.absent_records}</td>
                        <td><PercentBadge value={r.attendance_rate} /></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <EmptyState icon="bi-building" title="No room data" />
            )
          ) : data?.length ? (
            <div className="table-responsive">
              <Table hover size="sm" className="ha-table mb-0">
                <thead>
                  <tr><th>Register No</th><th>Name</th><th>Cat</th><th>Dept</th><th>Room</th><th>Days</th><th>Present</th><th>Absent</th><th>%</th></tr>
                </thead>
                <tbody>
                  {data.map((s) => (
                    <tr key={s.id}>
                      <td className="text-primary">{s.register_no}</td>
                      <td>{s.name}</td>
                      <td>{s.category}</td>
                      <td>{s.department}</td>
                      <td>{s.room_number || '—'}</td>
                      <td>{s.total_days}</td>
                      <td className="text-success">{s.present_days}</td>
                      <td className="text-danger">{s.absent_days}</td>
                      <td><PercentBadge value={s.percentage} /></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <EmptyState icon="bi-people" title="No data for the selected filters" />
          )}
        </Card.Body>
      </Card>
    </>
  );
}
