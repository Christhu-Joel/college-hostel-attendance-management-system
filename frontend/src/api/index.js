import http from './http';

const wrap = (promise) =>
  promise.then((res) => ({ data: res, error: null })).catch((error) => ({ data: null, error }));

export const api = {
  auth: {
    login: (body) => wrap(http.post('/auth/login', body)),
    me: () => wrap(http.get('/auth/me')),
    changePassword: (body) => wrap(http.post('/auth/change-password', body)),
  },

  students: {
    list: (params) => wrap(http.get('/students', { params })),
    get: (id) => wrap(http.get(`/students/${id}`)),
    create: (body) => wrap(http.post('/students', body)),
    update: (id, body) => wrap(http.put(`/students/${id}`, body)),
    remove: (id) => wrap(http.delete(`/students/${id}`)),
    setStatus: (id, status) => wrap(http.patch(`/students/${id}/status`, { status })),
    departments: () => wrap(http.get('/students/departments')),
  },

  rooms: {
    list: (params) => wrap(http.get('/rooms', { params })),
    get: (id) => wrap(http.get(`/rooms/${id}`)),
    create: (body) => wrap(http.post('/rooms', body)),
    update: (id, body) => wrap(http.put(`/rooms/${id}`, body)),
    remove: (id) => wrap(http.delete(`/rooms/${id}`)),
    assign: (roomId, studentId) => wrap(http.post(`/rooms/${roomId}/assign`, { student_id: studentId })),
    transfer: (studentId, toRoomId) => wrap(http.post(`/rooms/students/${studentId}/transfer`, { to_room_id: toRoomId })),
    unassign: (studentId) => wrap(http.post(`/rooms/students/${studentId}/unassign`)),
    summary: () => wrap(http.get('/rooms/summary')),
  },

  attendance: {
    mark: (body) => wrap(http.post('/attendance/mark', body)),
    getForDate: (date, params) => wrap(http.get(`/attendance/${date}`, { params })),
    update: (id, status) => wrap(http.put(`/attendance/${id}`, { status })),
    history: (params) => wrap(http.get('/attendance/history', { params })),
  },

  academicYears: {
    list: () => wrap(http.get('/academic-years')),
    active: () => wrap(http.get('/academic-years/active')),
    create: (body) => wrap(http.post('/academic-years', body)),
    activate: (id) => wrap(http.post(`/academic-years/${id}/activate`)),
    archive: (id) => wrap(http.post(`/academic-years/${id}/archive`)),
  },

  dashboard: {
    overview: () => wrap(http.get('/dashboard')),
    charts: (params) => wrap(http.get('/dashboard/charts', { params })),
  },

  reports: {
    daily: (params) => wrap(http.get('/reports/daily', { params })),
    period: (period, params) => wrap(http.get(`/reports/period/${period}`, { params })),
    students: (params) => wrap(http.get('/reports/students', { params })),
    rooms: (params) => wrap(http.get('/reports/rooms', { params })),
    charts: (params) => wrap(http.get('/reports/charts', { params })),
    meta: () => wrap(http.get('/reports/meta')),
  },
};
