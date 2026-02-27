import { useState, useEffect } from 'react';
import api from '../api';
import { Doctor, Appointment, User, DoctorShift } from '../types';
import {
  Users, Clock, CalendarDays, Plus, Trash2, LogOut, CheckCircle2, AlertCircle,
  X, Stethoscope, Phone, ChevronDown, FileText, Download, RefreshCw,
  TrendingUp, UserCheck, Search, Edit3, UserPlus, Sun, Moon, Settings, Shield,
} from 'lucide-react';
import { useTheme } from '../theme';

export default function HospitalAdminDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { theme, toggle } = useTheme();
  const ThemeToggle = () => (
    <button onClick={toggle} className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-2" title="Toggle theme">
      {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
    </button>
  );
  const [tab, setTab] = useState<'doctors' | 'appointments' | 'shifts' | 'patients' | 'leaves' | 'settings'>('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [apptStats, setApptStats] = useState({ total: 0, completed: 0, booked: 0, called: 0, skipped: 0, cancelled: 0, pending: 0, totalRevenue: 0 });
  const [docForm, setDocForm] = useState({ phone: '', name: '', specialization: '', consultationFee: '' });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Appointment filters
  const [filterDoctor, setFilterDoctor] = useState<number>(0);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Shift management
  const [shiftDoctor, setShiftDoctor] = useState<number>(0);
  const [shifts, setShifts] = useState<DoctorShift[]>([]);
  const [shiftForm, setShiftForm] = useState({ shiftName: '', startTime: '', endTime: '', tokenLimit: '20' });
  const [showAddShift, setShowAddShift] = useState(false);

  // Patient management
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [patientForm, setPatientForm] = useState({ phone: '', name: '', age: '', gender: '', weight: '', city: '' });
  const [editingPatient, setEditingPatient] = useState<any>(null);

  // Leave management
  const [leaveDoctor, setLeaveDoctor] = useState<number>(0);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveForm, setLeaveForm] = useState({ leaveDate: '', shiftId: '', reason: '' });
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [leaveDoctorShifts, setLeaveDoctorShifts] = useState<DoctorShift[]>([]);

  // Doctor editing
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editDocForm, setEditDocForm] = useState({ name: '', specialization: '', consultationFee: '', isActive: true });

  // Settings
  const [maxBookingDays, setMaxBookingDays] = useState<number>(7);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadDoctors = async () => {
    try { const r = await api.get('/hospital-admin/doctors'); setDoctors(r.data.doctors || r.data || []); } catch {}
  };

  const loadAppointments = async () => {
    setRefreshing(true);
    try {
      const params: any = {};
      if (filterDoctor) params.doctorId = filterDoctor;
      if (filterDate) params.date = filterDate;
      if (filterStatus && filterStatus !== 'ALL') params.status = filterStatus;
      const r = await api.get('/hospital-admin/appointments', { params });
      setAppointments(r.data.appointments || []);
      setApptStats(r.data.stats || { total: 0, completed: 0, booked: 0, called: 0, skipped: 0, cancelled: 0, pending: 0, totalRevenue: 0 });
    } catch {
      setAppointments([]);
    }
    setRefreshing(false);
  };

  const loadShifts = async (doctorId: number) => {
    if (!doctorId) { setShifts([]); return; }
    try { const r = await api.get(`/hospital-admin/doctors/${doctorId}/shifts`); setShifts(r.data.shifts || r.data || []); } catch {}
  };

  const loadPatients = async () => {
    try {
      const params: any = {};
      if (patientSearch) params.search = patientSearch;
      const r = await api.get('/hospital-admin/patients', { params });
      setPatients(r.data.patients || []);
    } catch { setPatients([]); }
  };

  const loadLeaves = async (doctorId: number) => {
    if (!doctorId) { setLeaves([]); return; }
    try { const r = await api.get(`/hospital-admin/doctors/${doctorId}/leaves`); setLeaves(r.data.leaves || []); } catch { setLeaves([]); }
  };
  const loadLeaveDoctorShifts = async (doctorId: number) => {
    if (!doctorId) { setLeaveDoctorShifts([]); return; }
    try { const r = await api.get(`/hospital-admin/doctors/${doctorId}/shifts`); setLeaveDoctorShifts(r.data.shifts || r.data || []); } catch {}
  };
  const loadSettings = async () => {
    try { const r = await api.get('/hospital-admin/settings'); setMaxBookingDays(r.data.maxBookingDaysAhead ?? 7); } catch {}
  };

  useEffect(() => { loadDoctors(); }, []);
  useEffect(() => { if (tab === 'appointments') loadAppointments(); }, [tab, filterDoctor, filterDate, filterStatus]);
  useEffect(() => { if (tab === 'shifts') loadShifts(shiftDoctor); }, [tab, shiftDoctor]);
  useEffect(() => { if (tab === 'patients') loadPatients(); }, [tab]);
  useEffect(() => { if (tab === 'leaves') { loadLeaves(leaveDoctor); loadLeaveDoctorShifts(leaveDoctor); } }, [tab, leaveDoctor]);
  useEffect(() => { if (tab === 'settings') loadSettings(); }, [tab]);

  const addDoctor = async () => {
    if (!docForm.phone || !docForm.name || !docForm.specialization) return setMsg({ type: 'error', text: 'All fields are required' });
    if (docForm.phone.length !== 10) return setMsg({ type: 'error', text: 'Phone number must be exactly 10 digits' });
    setLoading(true);
    try {
      await api.post('/hospital-admin/doctors', { ...docForm, consultationFee: parseFloat(docForm.consultationFee) || 500 });
      setMsg({ type: 'success', text: 'Doctor added successfully!' }); setDocForm({ phone: '', name: '', specialization: '', consultationFee: '' }); setShowAddDoctor(false); loadDoctors();
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error adding doctor' }); }
    setLoading(false);
  };

  const startEditDoctor = (d: Doctor) => {
    setEditingDoctor(d);
    setEditDocForm({
      name: d.user?.name || '',
      specialization: d.specialization || '',
      consultationFee: d.consultationFee?.toString() || '500',
      isActive: d.isActive !== false,
    });
  };

  const updateDoctor = async () => {
    if (!editingDoctor) return;
    if (!editDocForm.name || !editDocForm.specialization) return setMsg({ type: 'error', text: 'Name and specialization are required' });
    setLoading(true);
    try {
      await api.patch(`/hospital-admin/doctors/${editingDoctor.id}`, {
        name: editDocForm.name,
        specialization: editDocForm.specialization,
        consultationFee: parseFloat(editDocForm.consultationFee) || 500,
        isActive: editDocForm.isActive,
      });
      setMsg({ type: 'success', text: 'Doctor updated successfully!' });
      setEditingDoctor(null);
      loadDoctors();
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error updating doctor' }); }
    setLoading(false);
  };

  const addShift = async () => {
    if (!shiftDoctor || !shiftForm.shiftName || !shiftForm.startTime || !shiftForm.endTime) return setMsg({ type: 'error', text: 'All shift fields are required' });
    setLoading(true);
    try {
      await api.post(`/hospital-admin/doctors/${shiftDoctor}/shifts`, { ...shiftForm, tokenLimit: parseInt(shiftForm.tokenLimit) || 20 });
      setMsg({ type: 'success', text: 'Shift created!' }); setShiftForm({ shiftName: '', startTime: '', endTime: '', tokenLimit: '20' }); setShowAddShift(false); loadShifts(shiftDoctor);
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
    setLoading(false);
  };

  const deleteShift = async (id: number) => {
    if (!confirm('Delete this shift?')) return;
    try { await api.delete(`/hospital-admin/shifts/${id}`); loadShifts(shiftDoctor); setMsg({ type: 'success', text: 'Shift deleted' }); } catch {}
  };

  // Delete appointments
  const deleteAppointment = async (id: number) => {
    if (!confirm('Delete this appointment?')) return;
    try {
      await api.delete(`/hospital-admin/appointments/${id}`);
      setMsg({ type: 'success', text: 'Appointment deleted' }); loadAppointments();
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const deleteBulkAppointments = async () => {
    const doctorName = filterDoctor ? doctors.find(d => d.id === filterDoctor)?.user?.name || 'selected doctor' : 'ALL doctors';
    const dateStr = filterDate || 'all dates';
    if (!confirm(`Delete ALL appointments for ${doctorName} on ${dateStr}? This cannot be undone!`)) return;
    try {
      const params: any = {};
      if (filterDoctor) params.doctorId = filterDoctor;
      if (filterDate) params.date = filterDate;
      const r = await api.delete('/hospital-admin/appointments', { params });
      setMsg({ type: 'success', text: `${r.data.deleted} appointment(s) deleted` }); loadAppointments();
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  // Patient CRUD
  const addPatient = async () => {
    if (!patientForm.phone) return setMsg({ type: 'error', text: 'Phone is required' });
    if (patientForm.phone.length !== 10) return setMsg({ type: 'error', text: 'Phone must be 10 digits' });
    setLoading(true);
    try {
      await api.post('/hospital-admin/patients', patientForm);
      setMsg({ type: 'success', text: 'Patient created!' }); setPatientForm({ phone: '', name: '', age: '', gender: '', weight: '', city: '' }); setShowAddPatient(false); loadPatients();
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
    setLoading(false);
  };

  const updatePatient = async () => {
    if (!editingPatient) return;
    setLoading(true);
    try {
      await api.patch(`/hospital-admin/patients/${editingPatient.id}`, patientForm);
      setMsg({ type: 'success', text: 'Patient updated!' }); setEditingPatient(null); setPatientForm({ phone: '', name: '', age: '', gender: '', weight: '', city: '' }); loadPatients();
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
    setLoading(false);
  };

  const deletePatient = async (id: number) => {
    if (!confirm('Delete this patient and their appointment records from your hospital?')) return;
    try {
      await api.delete(`/hospital-admin/patients/${id}`);
      setMsg({ type: 'success', text: 'Patient deleted' }); loadPatients();
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const startEditPatient = (p: any) => {
    setEditingPatient(p);
    setPatientForm({ phone: p.phone || '', name: p.name || '', age: p.age?.toString() || '', gender: p.gender || '', weight: p.weight?.toString() || '', city: p.city || '' });
    setShowAddPatient(true);
  };

  // Leave management
  const addLeave = async () => {
    if (!leaveDoctor || !leaveForm.leaveDate) return setMsg({ type: 'error', text: 'Doctor and date are required' });
    setLoading(true);
    try {
      await api.post(`/hospital-admin/doctors/${leaveDoctor}/leaves`, {
        leaveDate: leaveForm.leaveDate,
        shiftId: leaveForm.shiftId ? parseInt(leaveForm.shiftId) : undefined,
        reason: leaveForm.reason || undefined,
      });
      setMsg({ type: 'success', text: 'Leave added!' });
      setLeaveForm({ leaveDate: '', shiftId: '', reason: '' });
      setShowAddLeave(false);
      loadLeaves(leaveDoctor);
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error adding leave' }); }
    setLoading(false);
  };

  const deleteLeave = async (id: number) => {
    if (!confirm('Remove this leave?')) return;
    try { await api.delete(`/hospital-admin/leaves/${id}`); setMsg({ type: 'success', text: 'Leave removed' }); loadLeaves(leaveDoctor); }
    catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.patch('/hospital-admin/settings', { maxBookingDaysAhead: maxBookingDays });
      setMsg({ type: 'success', text: 'Settings saved!' });
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error saving settings' }); }
    setSavingSettings(false);
  };

  const updateWorkingDays = async (shiftId: number, workingDays: string) => {
    try {
      await api.patch(`/hospital-admin/shifts/${shiftId}/working-days`, { workingDays });
      setMsg({ type: 'success', text: 'Working days updated!' });
      loadShifts(shiftDoctor);
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const downloadCSV = () => {
    const params: any = {};
    if (filterDoctor) params.doctorId = String(filterDoctor);
    if (filterDate) params.date = filterDate;
    if (filterStatus && filterStatus !== 'ALL') params.status = filterStatus;
    api.get('/hospital-admin/appointments/export', { params, responseType: 'blob' })
      .then(r => {
        const blob = new Blob([r.data], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `appointments_${filterDate || 'all'}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => setMsg({ type: 'error', text: 'Export failed' }));
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700';
      case 'CALLED': return 'bg-blue-50 text-blue-700';
      case 'BOOKED': return 'bg-indigo-50 text-indigo-700';
      case 'SKIPPED': return 'bg-red-50 text-red-700';
      case 'PENDING': return 'bg-amber-50 text-amber-700';
      case 'CANCELLED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Hospital Admin</h1>
              <p className="text-[11px] text-gray-400 leading-tight">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Logout">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        {/* Toast */}
        {msg && (
          <div className={`mt-4 px-4 py-3 rounded-xl flex items-center gap-3 animate-slide-up ${msg.type === 'success' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
            <span className={`text-sm flex-1 ${msg.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{msg.text}</span>
            <button onClick={() => setMsg(null)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 mb-5 overflow-x-auto">
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1 w-fit">
            {([
              { key: 'doctors', label: 'Doctors', icon: <Users className="w-4 h-4" /> },
              { key: 'shifts', label: 'Shifts', icon: <Clock className="w-4 h-4" /> },
              { key: 'appointments', label: 'Appointments', icon: <CalendarDays className="w-4 h-4" /> },
              { key: 'patients', label: 'Patients', icon: <UserPlus className="w-4 h-4" /> },
              { key: 'leaves', label: 'Leaves', icon: <Shield className="w-4 h-4" /> },
              { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* DOCTORS TAB */}
        {tab === 'doctors' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Doctors ({doctors.length})</h2>
              <button onClick={() => setShowAddDoctor(!showAddDoctor)} className="px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-100 transition-colors flex items-center gap-1.5">
                <Plus className="w-4 h-4" />Add Doctor
              </button>
            </div>

            {showAddDoctor && (
              <div className="glass-card-dark p-5 mb-4 animate-scale-in">
                <h3 className="text-sm font-bold text-gray-900 mb-3">New Doctor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Phone</label>
                    <input placeholder="10-digit phone" value={docForm.phone} onChange={e => setDocForm({ ...docForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} maxLength={10} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                    <input placeholder="Doctor name" value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Specialization</label>
                    <input placeholder="e.g. Cardiology" value={docForm.specialization} onChange={e => setDocForm({ ...docForm, specialization: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Consultation Fee</label>
                    <input placeholder="500" type="number" value={docForm.consultationFee} onChange={e => setDocForm({ ...docForm, consultationFee: e.target.value })} className="input-field text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={addDoctor} disabled={loading} className="btn-primary text-sm px-5 py-2.5">{loading ? 'Adding...' : 'Add Doctor'}</button>
                  <button onClick={() => setShowAddDoctor(false)} className="btn-secondary text-sm px-4 py-2.5">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {doctors.length === 0 && (
                <div className="text-center py-12 animate-fade-in">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-7 h-7 text-gray-300" /></div>
                  <p className="text-gray-400 font-medium">No doctors added yet</p>
                </div>
              )}
              {doctors.map((d, i) => (
                <div key={d.id} className="glass-card-dark p-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold ${d.isActive ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {(d.user?.name || 'D')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{d.user?.name || 'Doctor'}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{d.specialization}</span>
                        <span className="text-xs text-emerald-600 font-semibold">{String.fromCharCode(8377)}{d.consultationFee}</span>
                      </div>
                      <span className="text-[11px] text-gray-300 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{d.user?.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEditDoctor(d)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Edit Doctor">
                      <Edit3 className="w-4 h-4 text-blue-500" />
                    </button>
                    <span className={`status-pill ${d.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Doctor Modal */}
            {editingDoctor && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setEditingDoctor(null)}>
                <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-auto animate-scale-in shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-blue-600" /> Edit Doctor
                      </h3>
                      <button onClick={() => setEditingDoctor(null)} className="p-1.5 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Doctor Name</label>
                        <input value={editDocForm.name} onChange={e => setEditDocForm({ ...editDocForm, name: e.target.value })} className="input-field text-sm" placeholder="Doctor name" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Specialization</label>
                        <input value={editDocForm.specialization} onChange={e => setEditDocForm({ ...editDocForm, specialization: e.target.value })} className="input-field text-sm" placeholder="e.g. Cardiology" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Consultation Fee ({String.fromCharCode(8377)})</label>
                        <input type="number" value={editDocForm.consultationFee} onChange={e => setEditDocForm({ ...editDocForm, consultationFee: e.target.value })} className="input-field text-sm" placeholder="500" />
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <label className="text-xs font-medium text-gray-500">Status</label>
                        <button onClick={() => setEditDocForm({ ...editDocForm, isActive: !editDocForm.isActive })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editDocForm.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editDocForm.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-xs font-semibold ${editDocForm.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {editDocForm.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-5">
                      <button onClick={() => setEditingDoctor(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                      <button onClick={updateDoctor} disabled={loading}
                        className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? (
                          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4" />Save Changes</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SHIFTS TAB */}
        {tab === 'shifts' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select value={shiftDoctor} onChange={e => setShiftDoctor(parseInt(e.target.value))} className="select-field text-sm">
                  <option value={0}>Select a doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.name} - {d.specialization}</option>)}
                </select>
              </div>
              {shiftDoctor > 0 && (
                <button onClick={() => setShowAddShift(!showAddShift)} className="px-4 py-3 bg-teal-50 text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-100 transition-colors flex items-center gap-1.5 flex-shrink-0">
                  <Plus className="w-4 h-4" />Add Shift
                </button>
              )}
            </div>

            {shiftDoctor > 0 && showAddShift && (
              <div className="glass-card-dark p-5 mb-4 animate-scale-in">
                <h3 className="text-sm font-bold text-gray-900 mb-3">New Shift</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Shift Name</label>
                    <input placeholder="e.g. Morning" value={shiftForm.shiftName} onChange={e => setShiftForm({ ...shiftForm, shiftName: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Token Limit</label>
                    <input placeholder="20" type="number" value={shiftForm.tokenLimit} onChange={e => setShiftForm({ ...shiftForm, tokenLimit: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Start Time</label>
                    <input type="time" value={shiftForm.startTime} onChange={e => setShiftForm({ ...shiftForm, startTime: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">End Time</label>
                    <input type="time" value={shiftForm.endTime} onChange={e => setShiftForm({ ...shiftForm, endTime: e.target.value })} className="input-field text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={addShift} disabled={loading} className="btn-primary text-sm px-5 py-2.5">{loading ? 'Creating...' : 'Create Shift'}</button>
                  <button onClick={() => setShowAddShift(false)} className="btn-secondary text-sm px-4 py-2.5">Cancel</button>
                </div>
              </div>
            )}

            {shiftDoctor > 0 && (
              <div className="space-y-2">
                {shifts.length === 0 && <p className="text-gray-400 text-center py-8 text-sm">No shifts configured. Add one above.</p>}
                {shifts.map((s, i) => {
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const currentDays = (s.workingDays || '1,2,3,4,5').split(',').map(Number);
                  return (
                  <div key={s.id} className="glass-card-dark p-4 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Clock className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{s.shiftName}</h4>
                        <p className="text-xs text-gray-400">{s.startTime} - {s.endTime} | {s.tokenLimit} tokens max</p>
                      </div>
                    </div>
                    <button onClick={() => deleteShift(s.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete shift">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                    </div>
                    {/* Working days selector */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Working Days</p>
                      <div className="flex gap-1">
                        {dayNames.map((name, idx) => {
                          const active = currentDays.includes(idx);
                          return (
                            <button key={idx} onClick={() => {
                              const newDays = active ? currentDays.filter(d => d !== idx) : [...currentDays, idx].sort();
                              if (newDays.length === 0) return;
                              updateWorkingDays(s.id, newDays.join(','));
                            }}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                active ? 'bg-indigo-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}>
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {!shiftDoctor && (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Clock className="w-7 h-7 text-gray-300" /></div>
                <p className="text-gray-400 font-medium">Select a doctor to manage shifts</p>
              </div>
            )}
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {tab === 'appointments' && (
          <div className="space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'Total', value: apptStats.total, icon: <FileText className="w-4 h-4" />, bg: 'bg-blue-50', text: 'text-blue-700', ic: 'text-blue-400' },
                { label: 'Completed', value: apptStats.completed, icon: <CheckCircle2 className="w-4 h-4" />, bg: 'bg-emerald-50', text: 'text-emerald-700', ic: 'text-emerald-400' },
                { label: 'In Queue', value: apptStats.booked + apptStats.called, icon: <UserCheck className="w-4 h-4" />, bg: 'bg-amber-50', text: 'text-amber-700', ic: 'text-amber-400' },
                { label: 'Revenue', value: `₹${apptStats.totalRevenue.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4" />, bg: 'bg-violet-50', text: 'text-violet-700', ic: 'text-violet-400' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 sm:p-4`}>
                  <div className={`text-xl sm:text-2xl font-extrabold ${s.text}`}>{s.value}</div>
                  <div className={`text-[10px] sm:text-[11px] font-medium ${s.ic} flex items-center gap-1 mt-0.5`}>{s.icon}{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters + Export */}
            <div className="glass-card-dark p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="input-field pl-10 text-sm" />
                </div>
                <div className="flex-1 relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select value={filterDoctor} onChange={e => setFilterDoctor(parseInt(e.target.value))} className="select-field text-sm">
                    <option value={0}>All Doctors</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.user?.name}</option>)}
                  </select>
                </div>
                <div className="flex-1 relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select-field text-sm">
                    <option value="ALL">All Status</option>
                    <option value="BOOKED">Booked</option>
                    <option value="CALLED">Called</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="SKIPPED">Skipped</option>
                    <option value="PENDING">Pending</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button onClick={loadAppointments} disabled={refreshing} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh">
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <span className="text-xs text-gray-400">{appointments.length} record{appointments.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={downloadCSV} disabled={appointments.length === 0}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Download className="w-4 h-4" />Export CSV
                  </button>
                  <button onClick={deleteBulkAppointments} disabled={appointments.length === 0}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Trash2 className="w-4 h-4" />Delete All
                  </button>
                </div>
              </div>
            </div>

            {/* Appointment records */}
            {appointments.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText className="w-7 h-7 text-gray-300" /></div>
                <p className="text-gray-400 font-medium">No appointments found</p>
                <p className="text-xs text-gray-300 mt-1">Try changing the date or filters</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block glass-card-dark overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Token</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Patient</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Doctor</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Shift</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                          <th className="text-right px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((a: any, i: number) => (
                          <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors animate-slide-up" style={{ animationDelay: `${i * 0.02}s` }}>
                            <td className="px-4 py-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                                a.paymentStatus === 'PAID' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {a.paymentStatus === 'PAID' ? `#${a.tokenNumber}` : '—'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{a.patient?.name || '—'}</div>
                              <div className="text-[11px] text-gray-400">{a.patient?.phone}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-700">Dr. {a.doctor?.user?.name || '—'}</div>
                              <div className="text-[11px] text-gray-400">{a.doctor?.specialization}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">{a.shift?.shiftName || '—'}</td>
                            <td className="px-4 py-3 text-gray-500">{a.appointmentDate}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold ${a.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                {a.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`status-pill ${statusColor(a.status)}`}>{a.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => deleteAppointment(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {appointments.map((a: any, i: number) => (
                    <div key={a.id} className="glass-card-dark p-3.5 animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            a.paymentStatus === 'PAID' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                          }`}>
                            {a.paymentStatus === 'PAID' ? `#${a.tokenNumber}` : '—'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">{a.patient?.name || 'Patient'}</h4>
                            <p className="text-[11px] text-gray-400">{a.patient?.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`status-pill text-[10px] ${statusColor(a.status)}`}>{a.status}</span>
                          <button onClick={() => deleteAppointment(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 pl-[50px]">
                        <span>Dr. {a.doctor?.user?.name || '—'}</span>
                        <span>•</span>
                        <span>{a.shift?.shiftName || '—'}</span>
                        <span>•</span>
                        <span>{a.appointmentDate}</span>
                        <span>•</span>
                        <span className={a.paymentStatus === 'PAID' ? 'text-emerald-500 font-semibold' : 'text-amber-500'}>{a.paymentStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* PATIENTS TAB */}
        {tab === 'patients' && (
          <div className="space-y-4">
            {/* Search + Add */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input placeholder="Search by name or phone..."
                  value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadPatients()}
                  className="input-field pl-10 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={loadPatients} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                  <Search className="w-4 h-4" />Search
                </button>
                <button onClick={() => { setEditingPatient(null); setPatientForm({ phone: '', name: '', age: '', gender: '', weight: '', city: '' }); setShowAddPatient(!showAddPatient); }}
                  className="px-4 py-2.5 bg-teal-50 text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-100 transition-colors flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />Add Patient
                </button>
              </div>
            </div>

            {/* Add/Edit Patient Form */}
            {showAddPatient && (
              <div className="glass-card-dark p-5 animate-scale-in">
                <h3 className="text-sm font-bold text-gray-900 mb-3">{editingPatient ? 'Edit Patient' : 'New Patient'}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Phone *</label>
                    <input placeholder="10-digit phone" value={patientForm.phone}
                      onChange={e => setPatientForm({ ...patientForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      maxLength={10} className="input-field text-sm" disabled={!!editingPatient} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                    <input placeholder="Patient name" value={patientForm.name} onChange={e => setPatientForm({ ...patientForm, name: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Age</label>
                    <input placeholder="Age" type="number" value={patientForm.age} onChange={e => setPatientForm({ ...patientForm, age: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Gender</label>
                    <select value={patientForm.gender} onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })} className="select-field text-sm">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Weight (kg)</label>
                    <input placeholder="Weight" type="number" value={patientForm.weight} onChange={e => setPatientForm({ ...patientForm, weight: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">City</label>
                    <input placeholder="City" value={patientForm.city} onChange={e => setPatientForm({ ...patientForm, city: e.target.value })} className="input-field text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={editingPatient ? updatePatient : addPatient} disabled={loading}
                    className="btn-primary text-sm px-5 py-2.5">{loading ? 'Saving...' : editingPatient ? 'Update Patient' : 'Add Patient'}</button>
                  <button onClick={() => { setShowAddPatient(false); setEditingPatient(null); }} className="btn-secondary text-sm px-4 py-2.5">Cancel</button>
                </div>
              </div>
            )}

            {/* Patient List */}
            {patients.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-7 h-7 text-gray-300" /></div>
                <p className="text-gray-400 font-medium">No patients found</p>
                <p className="text-xs text-gray-300 mt-1">Add patients or try a different search</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">{patients.length} patient{patients.length !== 1 ? 's' : ''}</p>
                {patients.map((p: any, i: number) => (
                  <div key={p.id} className="glass-card-dark p-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(p.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{p.name || 'Unnamed'}</h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><Phone className="w-3 h-3" />{p.phone}</span>
                          {p.age && <span className="text-[11px] text-gray-400">{p.age}y</span>}
                          {p.gender && <span className="text-[11px] text-gray-400">{p.gender}</span>}
                          {p.city && <span className="text-[11px] text-gray-400">{p.city}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEditPatient(p)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit3 className="w-4 h-4 text-blue-400" />
                      </button>
                      <button onClick={() => deletePatient(p.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEAVES TAB */}
        {tab === 'leaves' && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select value={leaveDoctor} onChange={e => setLeaveDoctor(parseInt(e.target.value))} className="select-field text-sm">
                  <option value={0}>Select a doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.user?.name} - {d.specialization}</option>)}
                </select>
              </div>
              {leaveDoctor > 0 && (
                <button onClick={() => setShowAddLeave(!showAddLeave)} className="px-4 py-3 bg-teal-50 text-teal-700 rounded-xl text-sm font-semibold hover:bg-teal-100 transition-colors flex items-center gap-1.5 flex-shrink-0">
                  <Plus className="w-4 h-4" />Add Leave
                </button>
              )}
            </div>

            {leaveDoctor > 0 && showAddLeave && (
              <div className="glass-card-dark p-5 mb-4 animate-scale-in">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Add Doctor Leave</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Leave Date *</label>
                    <input type="date" value={leaveForm.leaveDate} onChange={e => setLeaveForm({ ...leaveForm, leaveDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Shift (optional)</label>
                    <select value={leaveForm.shiftId} onChange={e => setLeaveForm({ ...leaveForm, shiftId: e.target.value })} className="select-field text-sm">
                      <option value="">Full Day (All Shifts)</option>
                      {leaveDoctorShifts.map(s => <option key={s.id} value={s.id}>{s.shiftName} ({s.startTime}-{s.endTime})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Reason</label>
                    <input placeholder="e.g. Personal" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="input-field text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={addLeave} disabled={loading} className="btn-primary text-sm px-5 py-2.5">{loading ? 'Adding...' : 'Add Leave'}</button>
                  <button onClick={() => setShowAddLeave(false)} className="btn-secondary text-sm px-4 py-2.5">Cancel</button>
                </div>
              </div>
            )}

            {leaveDoctor > 0 && (
              <div className="space-y-2">
                {leaves.length === 0 && <p className="text-gray-400 text-center py-8 text-sm">No leaves scheduled for this doctor.</p>}
                {leaves.map((l: any, i: number) => (
                  <div key={l.id} className="glass-card-dark p-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        new Date(l.leaveDate + 'T12:00:00') < new Date(new Date().toISOString().split('T')[0] + 'T12:00:00') ? 'bg-gray-100' : 'bg-red-50'
                      }`}>
                        <CalendarDays className={`w-4 h-4 ${
                          new Date(l.leaveDate + 'T12:00:00') < new Date(new Date().toISOString().split('T')[0] + 'T12:00:00') ? 'text-gray-400' : 'text-red-500'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {new Date(l.leaveDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{l.shift ? l.shift.shiftName : 'Full Day'}</span>
                          {l.reason && <span className="text-xs text-gray-400">• {l.reason}</span>}
                          <span className="text-[10px] text-gray-300">{l.createdBy === 'ADMIN' ? 'By Admin' : 'By Doctor'}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteLeave(l.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Remove leave">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!leaveDoctor && (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Shield className="w-7 h-7 text-gray-300" /></div>
                <p className="text-gray-400 font-medium">Select a doctor to manage leaves</p>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="space-y-6 max-w-lg">
            <h2 className="text-lg font-bold text-gray-900">Hospital Settings</h2>

            <div className="glass-card-dark p-5 animate-scale-in">
              <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-500" /> Booking Horizon
              </h3>
              <p className="text-xs text-gray-400 mb-4">How many days ahead can patients book appointments?</p>

              <div className="flex items-center gap-4">
                <input type="range" min={1} max={30} value={maxBookingDays}
                  onChange={e => setMaxBookingDays(parseInt(e.target.value))}
                  className="flex-1 accent-blue-500 h-2" />
                <span className="text-lg font-bold text-blue-600 bg-blue-50 rounded-xl px-4 py-2 min-w-[80px] text-center">
                  {maxBookingDays} day{maxBookingDays !== 1 ? 's' : ''}
                </span>
              </div>

              <button onClick={saveSettings} disabled={savingSettings}
                className="btn-primary mt-4 text-sm px-6 py-2.5 flex items-center gap-2">
                {savingSettings ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                ) : (
                  <>Save Settings</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
