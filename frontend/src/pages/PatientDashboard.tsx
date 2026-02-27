import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Hospital, Doctor, Appointment, User, DoctorShift, Invoice } from '../types';
import {
  CalendarDays, Clock, CreditCard, Radio, MapPin, Stethoscope,
  ChevronRight, X, CheckCircle2, AlertCircle, Ticket, LogOut,
  Plus, RefreshCw, Download, FileText, Timer, UserCheck, Repeat, Sun, Moon,
  Search, Building2, ChevronDown,
} from 'lucide-react';
import { useTheme } from '../theme';

/* ── Status visual config ── */
const STATUS_CFG: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  PENDING:   { bg: 'bg-amber-50',  text: 'text-amber-700',  label: 'Awaiting Payment', dot: 'bg-amber-400' },
  BOOKED:    { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Booked',           dot: 'bg-blue-400' },
  CALLED:    { bg: 'bg-emerald-50',text: 'text-emerald-700', label: 'Your Turn!',       dot: 'bg-emerald-400 animate-pulse' },
  COMPLETED: { bg: 'bg-gray-50',   text: 'text-gray-600',   label: 'Completed',        dot: 'bg-gray-400' },
  SKIPPED:   { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Skipped',          dot: 'bg-red-400' },
  CANCELLED: { bg: 'bg-gray-50',   text: 'text-gray-500',   label: 'Cancelled',        dot: 'bg-gray-300' },
};

/* ── Invoice PDF-like generator ── */
function generateInvoiceHTML(inv: Invoice): string {
  return `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1e293b;max-width:600px;margin:auto}
.header{text-align:center;border-bottom:3px solid #3b82f6;padding-bottom:20px;margin-bottom:24px}
.header h1{font-size:22px;color:#1e40af;margin-bottom:4px}
.header p{color:#64748b;font-size:13px}
.badge{display:inline-block;background:#dcfce7;color:#166534;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;margin-top:8px}
.section{margin-bottom:20px}
.section h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px}
.row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
.row .label{color:#64748b}.row .value{font-weight:600}
.token-box{text-align:center;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;border-radius:16px;padding:24px;margin:20px 0}
.token-box .num{font-size:48px;font-weight:800}
.token-box .sub{font-size:12px;opacity:.8;margin-top:4px}
.total{border-top:2px solid #e2e8f0;padding-top:12px;margin-top:12px}
.total .row{font-size:16px}.total .value{color:#059669}
.footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:32px;border-top:1px solid #f1f5f9;padding-top:16px}
</style></head><body>
<div class="header">
  <h1>${inv.hospitalName}</h1>
  <p>${inv.hospitalAddress}</p>
  <div class="badge">PAID</div>
</div>
<div class="section"><h3>Invoice Details</h3>
  <div class="row"><span class="label">Invoice #</span><span class="value">${inv.invoiceId}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${new Date(inv.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span></div>
</div>
<div class="section"><h3>Patient</h3>
  <div class="row"><span class="label">Name</span><span class="value">${inv.patientName}</span></div>
  <div class="row"><span class="label">Phone</span><span class="value">${inv.patientPhone}</span></div>
</div>
<div class="section"><h3>Appointment</h3>
  <div class="row"><span class="label">Doctor</span><span class="value">Dr. ${inv.doctorName}</span></div>
  <div class="row"><span class="label">Specialization</span><span class="value">${inv.specialization}</span></div>
  <div class="row"><span class="label">Appointment Date</span><span class="value">${inv.appointmentDate}</span></div>
  <div class="row"><span class="label">Shift</span><span class="value">${inv.shiftName} (${inv.shiftTime})</span></div>
</div>
<div class="token-box"><div class="sub">YOUR TOKEN NUMBER</div><div class="num">#${inv.tokenNumber}</div></div>
<div class="total">
  <div class="row"><span class="label">Consultation Fee</span><span class="value" style="color:#059669">${String.fromCharCode(8377)}${inv.amount}</span></div>
  <div class="row"><span class="label">Payment</span><span class="value">${inv.paymentMethod}</span></div>
</div>
<div class="footer">Thank you for choosing ${inv.hospitalName}. Please arrive 10 minutes before your turn.<br/>This is a computer-generated invoice.</div>
</body></html>`;
}

function downloadInvoice(inv: Invoice) {
  const html = generateInvoiceHTML(inv);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice_${inv.invoiceId}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Component ── */
export default function PatientDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const ThemeToggle = () => (
    <button onClick={toggle} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`} title="Toggle theme">
      {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
    </button>
  );
  const [tab, setTab] = useState<'my' | 'book'>('my');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myAppts, setMyAppts] = useState<Appointment[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<number>(0);
  const [selectedDoctor, setSelectedDoctor] = useState<number>(0);
  const [selectedShift, setSelectedShift] = useState<number>(0);
  const [shifts, setShifts] = useState<DoctorShift[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxBookingDays, setMaxBookingDays] = useState<number>(7);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Search state for Book tab
  const [searchQuery, setSearchQuery] = useState('');

  // Live status
  const [trackingAppt, setTrackingAppt] = useState<Appointment | null>(null);
  const [liveStatus, setLiveStatus] = useState<any>(null);

  // Invoice modal
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);

  // Reschedule modal
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [rescheduleOptions, setRescheduleOptions] = useState<any[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleShift, setRescheduleShift] = useState<number>(0);
  const [rescheduling, setRescheduling] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Auto-dismiss toasts
  const msgTimer = useRef<ReturnType<typeof setTimeout>>();
  const showMsg = (type: 'success' | 'error' | 'info', text: string) => {
    setMsg({ type, text });
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 5000);
  };

  useEffect(() => { loadHospitals(); loadMyAppts(); }, []);
  useEffect(() => {
    if (selectedHospital) loadDoctors(selectedHospital);
    else { setDoctors([]); setShifts([]); setSelectedDoctor(0); }
  }, [selectedHospital]);
  useEffect(() => {
    if (selectedDoctor) loadAvailability(selectedDoctor);
    else { setShifts([]); setSelectedShift(0); }
  }, [selectedDoctor, date]);

  // Live polling
  useEffect(() => {
    if (!trackingAppt) return;
    const poll = async () => {
      try {
        const r = await api.get(`/doctor/live-status/${trackingAppt.doctorId}`, {
          params: { patientId: user.id, shiftId: trackingAppt.shiftId || undefined },
        });
        setLiveStatus(r.data);
      } catch {}
    };
    poll();
    const t = setInterval(poll, 4000);
    return () => clearInterval(t);
  }, [trackingAppt]);

  const loadHospitals = async () => {
    try { const r = await api.get('/patient/hospitals'); setHospitals(r.data.hospitals || []); } catch {}
  };
  const loadDoctors = async (hId: number) => {
    try { const r = await api.get(`/patient/hospitals/${hId}/doctors`); setDoctors(r.data.doctors || []); } catch {}
  };
  const loadAvailability = async (dId: number) => {
    try {
      const r = await api.get(`/patient/doctors/${dId}/availability`, { params: { date } });
      setShifts(r.data.shifts || []);
      if (r.data.maxBookingDaysAhead !== undefined) setMaxBookingDays(r.data.maxBookingDaysAhead);
    } catch {}
  };
  const loadMyAppts = async () => {
    setRefreshing(true);
    try { const r = await api.get('/patient/appointments/my'); setMyAppts(r.data.appointments || []); } catch {}
    setRefreshing(false);
  };

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedHospital) return showMsg('error', 'Please select hospital and doctor');
    if (shifts.length > 0 && !selectedShift) return showMsg('error', 'Please select a shift');
    setLoading(true);
    try {
      const body: any = { doctorId: selectedDoctor, hospitalId: selectedHospital, appointmentDate: date };
      if (selectedShift) body.shiftId = selectedShift;
      const r = await api.post('/patient/appointments/book', body);
      showMsg('info', r.data.message || 'Booked! Complete payment to get your token.');
      loadMyAppts();
      setTab('my');
      setSelectedDoctor(0);
      setSelectedShift(0);
    } catch (e: any) {
      showMsg('error', e.response?.data?.error || 'Booking failed');
    }
    setLoading(false);
  };

  const payForAppt = async (id: number) => {
    setPaying(id);
    try {
      const r = await api.post(`/payments/demo-pay/${id}`);
      showMsg('success', r.data.message || 'Payment successful!');
      if (r.data.invoice) setInvoiceData(r.data.invoice);
      loadMyAppts();
    } catch (e: any) {
      showMsg('error', e.response?.data?.error || 'Payment failed');
    }
    setPaying(null);
  };

  // ── FETCH INVOICE FOR ANY PAID APPOINTMENT ──
  const fetchInvoice = async (appointmentId: number) => {
    try {
      const r = await api.get(`/payments/invoice/${appointmentId}`);
      if (r.data.invoice) setInvoiceData(r.data.invoice);
    } catch (e: any) {
      showMsg('error', e.response?.data?.error || 'Failed to load invoice');
    }
  };

  // ── RESCHEDULE FUNCTIONS ──
  const openReschedule = async (appt: Appointment) => {
    setRescheduleAppt(appt);
    setRescheduleDate('');
    setRescheduleShift(0);
    setLoadingOptions(true);
    try {
      const r = await api.get(`/patient/appointments/${appt.id}/reschedule-options`);
      setRescheduleOptions(r.data.dates || []);
    } catch (e: any) {
      showMsg('error', 'Failed to load reschedule options');
      setRescheduleAppt(null);
    }
    setLoadingOptions(false);
  };

  const confirmReschedule = async () => {
    if (!rescheduleAppt || !rescheduleDate) return showMsg('error', 'Please select a date');
    // Check if shifts exist and require selection
    const dateOption = rescheduleOptions.find((d: any) => d.date === rescheduleDate);
    const availableShifts = dateOption?.shifts?.filter((s: any) => s.isAvailable && !s.onLeave && !s.notWorkingDay && !s.shiftEnded) || [];
    if (availableShifts.length > 0 && !rescheduleShift) return showMsg('error', 'Please select a shift');

    setRescheduling(true);
    try {
      const body: any = { newDate: rescheduleDate };
      if (rescheduleShift) body.newShiftId = rescheduleShift;
      const r = await api.post(`/patient/appointments/${rescheduleAppt.id}/reschedule`, body);
      showMsg('success', r.data.message || 'Appointment rescheduled!');
      setRescheduleAppt(null);
      loadMyAppts();
    } catch (e: any) {
      showMsg('error', e.response?.data?.error || 'Reschedule failed');
    }
    setRescheduling(false);
  };

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-3 flex justify-between items-center">
          {/* Logo + name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">TokenQ</h1>
              <p className="text-[11px] text-gray-400 leading-tight">{user.name}</p>
            </div>
          </div>
          {/* Desktop tab buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setTab('my')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'my' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Ticket className="w-4 h-4" /> My Tokens
            </button>
            <button onClick={() => setTab('book')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                tab === 'book' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Plus className="w-4 h-4" /> Book New
            </button>
          </div>
          {/* Actions: theme + logout */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Logout">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg lg:max-w-5xl mx-auto px-4 lg:px-8 pb-24">
        {/* Toast */}
        {msg && (
          <div className={`mt-3 px-4 py-3 rounded-xl flex items-start gap-2.5 animate-slide-up text-sm ${
            msg.type === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' :
            msg.type === 'error' ? 'bg-red-50 border border-red-100 text-red-700' :
            'bg-blue-50 border border-blue-100 text-blue-700'
          }`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
             <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <span className="flex-1">{msg.text}</span>
            <button onClick={() => setMsg(null)}><X className="w-4 h-4 opacity-50" /></button>
          </div>
        )}

        {/* ── INVOICE MODAL ── */}
        {invoiceData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setInvoiceData(null)}>
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-sm max-h-[85vh] overflow-auto animate-scale-in shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-5">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-lg text-gray-900">Invoice</h3>
                  <button onClick={() => setInvoiceData(null)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                {/* Token highlight */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-center text-white mb-5">
                  <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Your Token</p>
                  <p className="text-5xl font-extrabold mt-1">#{invoiceData.tokenNumber}</p>
                  <p className="text-xs text-white/60 mt-2">{invoiceData.appointmentDate} | {invoiceData.shiftName}</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Invoice #</span><span className="font-semibold text-gray-700">{invoiceData.invoiceId}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Patient</span><span className="font-semibold text-gray-700">{invoiceData.patientName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Doctor</span><span className="font-semibold text-gray-700">Dr. {invoiceData.doctorName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Hospital</span><span className="font-semibold text-gray-700">{invoiceData.hospitalName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Shift</span><span className="font-semibold text-gray-700">{invoiceData.shiftName} ({invoiceData.shiftTime})</span></div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="text-gray-400">Amount Paid</span>
                    <span className="font-bold text-emerald-600 text-base">{String.fromCharCode(8377)}{invoiceData.amount}</span>
                  </div>
                </div>

                <button onClick={() => downloadInvoice(invoiceData)} className="w-full mt-5 btn-primary py-3 flex items-center justify-center gap-2 text-sm">
                  <Download className="w-4 h-4" /> Download Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LIVE STATUS MODAL ── */}
        {trackingAppt && liveStatus && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in" onClick={() => { setTrackingAppt(null); setLiveStatus(null); }}>
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 w-full max-w-sm animate-scale-in shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg text-gray-900">Live Queue</h3>
                <button onClick={() => { setTrackingAppt(null); setLiveStatus(null); }} className="p-1.5 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Now serving vs Your token */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-4 text-white text-center">
                  <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Now Serving</p>
                  <p className="text-4xl font-extrabold mt-1">{liveStatus.currentToken || '\u2014'}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">Your Token</p>
                  <p className="text-4xl font-extrabold text-emerald-600 mt-1">#{trackingAppt.tokenNumber}</p>
                </div>
              </div>

              {/* Wait info */}
              {liveStatus.tokensAhead !== undefined && (
                <div className={`text-center py-3 px-4 rounded-xl mb-4 ${
                  liveStatus.tokensAhead === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'
                }`}>
                  {liveStatus.tokensAhead === 0 ? (
                    <p className="text-emerald-700 font-semibold flex items-center justify-center gap-2"><UserCheck className="w-4 h-4" />It's your turn!</p>
                  ) : (
                    <>
                      <p className="text-amber-700 font-semibold">{liveStatus.tokensAhead} patient{liveStatus.tokensAhead > 1 ? 's' : ''} ahead</p>
                      {liveStatus.estimatedWait && (
                        <p className="text-amber-600/70 text-xs mt-1 flex items-center justify-center gap-1"><Timer className="w-3 h-3" />{liveStatus.estimatedWait}</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Progress bar */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{liveStatus.completedCount}/{liveStatus.totalBooked} done</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${liveStatus.totalBooked ? (liveStatus.completedCount / liveStatus.totalBooked) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RESCHEDULE MODAL ── */}
        {rescheduleAppt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setRescheduleAppt(null)}>
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-sm max-h-[85vh] overflow-auto animate-scale-in shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-blue-600" /> Reschedule
                  </h3>
                  <button onClick={() => setRescheduleAppt(null)} className="p-1.5 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Current appointment info */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
                  <p className="text-gray-400 text-xs font-medium mb-1.5">Current Appointment</p>
                  <div className="flex justify-between"><span className="text-gray-500">Doctor</span><span className="font-semibold text-gray-700">Dr. {rescheduleAppt.doctor?.user?.name}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-gray-500">Date</span><span className="font-semibold text-gray-700">{rescheduleAppt.appointmentDate}</span></div>
                  {rescheduleAppt.shift && <div className="flex justify-between mt-1"><span className="text-gray-500">Shift</span><span className="font-semibold text-gray-700">{rescheduleAppt.shift.shiftName}</span></div>}
                  {rescheduleAppt.tokenNumber > 0 && <div className="flex justify-between mt-1"><span className="text-gray-500">Token</span><span className="font-bold text-blue-600">#{rescheduleAppt.tokenNumber}</span></div>}
                </div>

                {loadingOptions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Date selection */}
                    <p className="text-sm font-medium text-gray-700 mb-2">Select New Date</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {rescheduleOptions.map((opt: any) => {
                        const isSel = rescheduleDate === opt.date;
                        const hasSlots = opt.shifts.some((s: any) => s.isAvailable && !s.onLeave && !s.notWorkingDay && !s.shiftEnded);
                        const allOnLeave = opt.shifts.length > 0 && opt.shifts.every((s: any) => s.onLeave);
                        const allNotWorking = opt.shifts.length > 0 && opt.shifts.every((s: any) => s.notWorkingDay);
                        const allEnded = opt.shifts.length > 0 && opt.shifts.every((s: any) => s.shiftEnded);
                        const isToday = opt.date === new Date().toISOString().split('T')[0];
                        const isSameDate = opt.date === rescheduleAppt.appointmentDate;
                        const dayLabel = new Date(opt.date + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

                        return (
                          <button
                            key={opt.date}
                            onClick={() => { if (hasSlots && !isSameDate) { setRescheduleDate(opt.date); setRescheduleShift(0); } }}
                            disabled={!hasSlots || isSameDate}
                            className={`p-3 rounded-xl text-left transition-all border-2 ${
                              isSameDate ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed' :
                              !hasSlots ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' :
                              isSel ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                          >
                            <p className={`text-xs font-bold ${isSel ? 'text-blue-600' : 'text-gray-700'}`}>{dayLabel}</p>
                            <p className={`text-[10px] mt-0.5 ${hasSlots && !isSameDate ? 'text-emerald-500' : 'text-gray-400'}`}>
                              {isSameDate ? 'Current date' : allOnLeave ? '🚫 On Leave' : allNotWorking ? '⚠ Not Working' : allEnded ? '⏰ Shifts Ended' : hasSlots ? `${opt.shifts.filter((s: any) => s.isAvailable && !s.onLeave && !s.notWorkingDay && !s.shiftEnded).length} shift(s) open` : 'Full'}
                            </p>
                            {isToday && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold mt-1 inline-block">Today</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Shift selection for selected date */}
                    {rescheduleDate && (() => {
                      const dateOpt = rescheduleOptions.find((d: any) => d.date === rescheduleDate);
                      const availShifts = dateOpt?.shifts?.filter((s: any) => s.isAvailable && !s.onLeave && !s.notWorkingDay && !s.shiftEnded) || [];
                      if (availShifts.length === 0) return null;
                      return (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Select Shift</p>
                          <div className="space-y-2">
                            {availShifts.map((s: any) => {
                              const isSel = rescheduleShift === s.id;
                              return (
                                <button key={s.id} onClick={() => setRescheduleShift(s.id)}
                                  className={`w-full p-3 rounded-xl text-left transition-all border-2 flex justify-between items-center ${
                                    isSel ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white hover:border-gray-200'
                                  }`}>
                                  <div className="flex items-center gap-2.5">
                                    <Clock className={`w-4 h-4 ${isSel ? 'text-emerald-600' : 'text-gray-400'}`} />
                                    <div>
                                      <p className="text-sm font-semibold text-gray-800">{s.shiftName}</p>
                                      <p className="text-xs text-gray-400">{s.startTime} - {s.endTime}</p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-emerald-600">{s.availableSlots} left</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Confirm */}
                    <div className="flex gap-2">
                      <button onClick={() => setRescheduleAppt(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                      <button onClick={confirmReschedule} disabled={!rescheduleDate || !rescheduleShift || rescheduling}
                        className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        {rescheduling ? (
                          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Moving...</>
                        ) : (
                          <><Repeat className="w-4 h-4" />Confirm</>
                        )}
                      </button>
                    </div>
                  </>
                )}

                <p className="text-[11px] text-gray-400 mt-3 text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" /> No cancellation or refund. Reschedule only.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── MY APPOINTMENTS ── */}
        {tab === 'my' && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Your Appointments</h2>
              <button onClick={loadMyAppts} disabled={refreshing} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {myAppts.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">No appointments yet</p>
                <p className="text-gray-300 text-sm mt-1">Book your first appointment</p>
                <button onClick={() => setTab('book')} className="btn-primary mt-4 text-sm px-5 py-2.5">Book Now</button>
              </div>
            )}

            {/* Categorized appointments */}
            {myAppts.length > 0 && (() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayAppts = myAppts.filter(a => a.appointmentDate === todayStr);
              const upcomingAppts = myAppts.filter(a => a.appointmentDate > todayStr);
              const previousAppts = myAppts.filter(a => a.appointmentDate < todayStr);

              const renderAppointmentCard = (a: Appointment, i: number) => {
                const sc = STATUS_CFG[a.status] || STATUS_CFG.PENDING;
                const isPending = a.paymentStatus !== 'PAID' && a.status !== 'CANCELLED';
                const canTrack = a.paymentStatus === 'PAID' && ['BOOKED', 'CALLED'].includes(a.status);
                const canReschedule = a.canReschedule || false;
                const isPaid = a.paymentStatus === 'PAID';

                return (
                  <div key={a.id} className="glass-card-dark p-4 animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    {/* Doctor on leave banner */}
                    {a.doctorOnLeave && (
                      <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Doctor is on leave for this date — please reschedule</span>
                      </div>
                    )}
                    {/* Unviewed past appointment banner */}
                    {a.canRescheduleUnviewed && !a.doctorOnLeave && (
                      <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Missed appointment — you can reschedule to a new date</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          a.paymentStatus === 'PAID' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-200'
                        }`}>
                          <span className={`font-extrabold text-xs sm:text-sm ${a.paymentStatus === 'PAID' ? 'text-white' : 'text-gray-400'}`}>
                            {a.paymentStatus === 'PAID' ? `#${a.tokenNumber}` : '\u2014'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">Dr. {a.doctor?.user?.name || 'Doctor'}</h4>
                          <p className="text-xs text-gray-400 truncate">{a.hospital?.name}</p>
                        </div>
                      </div>
                      <div className={`${sc.bg} px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        <span className={`text-[10px] sm:text-[11px] font-semibold whitespace-nowrap ${sc.text}`}>{sc.label}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{a.appointmentDate}</span>
                      {a.shift && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{a.shift.shiftName}</span>}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {isPending && !a.doctorOnLeave && !a.canRescheduleUnviewed && (
                        <button onClick={() => payForAppt(a.id)} disabled={paying === a.id}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                          {paying === a.id ? (
                            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing</>
                          ) : (
                            <><CreditCard className="w-4 h-4" />Pay & Get Token</>
                          )}
                        </button>
                      )}
                      {canTrack && (
                        <button onClick={() => setTrackingAppt(a)}
                          className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20">
                          <Radio className="w-4 h-4" />Live Status
                        </button>
                      )}
                      {isPaid && (
                        <button onClick={() => fetchInvoice(a.id)}
                          className="bg-gradient-to-r from-violet-500 to-purple-600 text-white py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/20">
                          <FileText className="w-4 h-4" /><span className="hidden sm:inline">Invoice</span>
                        </button>
                      )}
                      {canReschedule && (
                        <button onClick={() => openReschedule(a)}
                          className={`${a.doctorOnLeave || a.canRescheduleUnviewed ? 'flex-1' : ''} bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20`}>
                          <Repeat className="w-4 h-4" /><span className="hidden sm:inline">Reschedule</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              };

              const renderSection = (title: string, appts: Appointment[], emptyMsg: string) => {
                if (appts.length === 0) return null;
                return (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        title === "Today's Appointments" ? 'bg-emerald-500' :
                        title === 'Upcoming' ? 'bg-blue-500' : 'bg-gray-400'
                      }`} />
                      {title}
                      <span className="text-xs font-normal text-gray-400 lowercase">({appts.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {appts.map((a, i) => renderAppointmentCard(a, i))}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {renderSection("Today's Appointments", todayAppts, '')}
                  {renderSection('Upcoming', upcomingAppts, '')}
                  {renderSection('Previous', previousAppts, '')}
                </>
              );
            })()}
          </div>
        )}

        {/* ── BOOK TAB ── */}
        {tab === 'book' && (
          <div className="mt-4 space-y-5 animate-fade-in">
            <h2 className="text-lg font-bold text-gray-900">Book Appointment</h2>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search hospitals or doctors..."
                className="input-field pl-10 text-sm w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: selection steps */}
            <div className="space-y-5">

            {/* Step 1: Hospital cards */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1.5">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full inline-flex items-center justify-center text-[10px] font-bold">1</span>
                Select Hospital
              </label>
              {(() => {
                const q = searchQuery.toLowerCase();
                // Filter hospitals by search (hospital name, address, or doctor name/specialization if expanded)
                const filteredHospitals = hospitals.filter(h => {
                  if (!q) return true;
                  const hospitalMatch = h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q);
                  // Also match if any loaded doctor for the selected hospital matches
                  if (selectedHospital === h.id && doctors.length > 0) {
                    const doctorMatch = doctors.some(d =>
                      d.user?.name?.toLowerCase().includes(q) || d.specialization?.toLowerCase().includes(q)
                    );
                    return hospitalMatch || doctorMatch;
                  }
                  return hospitalMatch;
                });

                if (filteredHospitals.length === 0) {
                  return (
                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                      <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No hospitals match your search</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filteredHospitals.map(h => {
                      const isSelected = selectedHospital === h.id;
                      return (
                        <div key={h.id} className="animate-slide-up">
                          {/* Hospital card */}
                          <button
                            onClick={() => {
                              if (isSelected) { setSelectedHospital(0); setSelectedDoctor(0); setSelectedShift(0); setDoctors([]); }
                              else { setSelectedHospital(h.id); setSelectedDoctor(0); setSelectedShift(0); }
                            }}
                            className={`w-full p-4 rounded-xl text-left transition-all border-2 ${
                              isSelected ? 'border-blue-500 bg-blue-50/60 shadow-md shadow-blue-500/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-100'
                              }`}>
                                <Building2 className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm">{h.name}</h4>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{h.address}</span>
                                </p>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isSelected ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {/* Doctors nested inside selected hospital */}
                          {isSelected && (
                            <div className="mt-2 ml-4 pl-4 border-l-2 border-blue-200 space-y-2 animate-slide-up">
                              <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1.5">
                                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full inline-flex items-center justify-center text-[10px] font-bold">2</span>
                                Choose Doctor
                              </label>
                              {doctors.length === 0 ? (
                                <div className="bg-gray-50 rounded-xl p-6 text-center">
                                  <Stethoscope className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                  <p className="text-sm text-gray-400">No doctors available</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-1 gap-2">
                                  {doctors
                                    .filter(d => {
                                      if (!q) return true;
                                      return d.user?.name?.toLowerCase().includes(q)
                                        || d.specialization?.toLowerCase().includes(q)
                                        || h.name.toLowerCase().includes(q)
                                        || h.address.toLowerCase().includes(q);
                                    })
                                    .map(d => {
                                      const isDSel = selectedDoctor === d.id;
                                      const initial = (d.user?.name || 'D')[0].toUpperCase();
                                      return (
                                        <button key={d.id} onClick={() => { setSelectedDoctor(d.id); setSelectedShift(0); }}
                                          className={`w-full p-3.5 rounded-xl text-left transition-all border-2 ${
                                            isDSel ? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                                          }`}>
                                          <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                              isDSel ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                              {initial}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-semibold text-gray-900 text-sm truncate">Dr. {d.user?.name}</h4>
                                              <p className="text-xs text-gray-400 truncate">{d.specialization}</p>
                                              {d.shifts && d.shifts.length > 0 && (
                                                <p className="text-[10px] text-gray-300 mt-0.5">{d.shifts.length} shift{d.shifts.length > 1 ? 's' : ''} available</p>
                                              )}
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                              <span className="text-sm font-bold text-emerald-600">{String.fromCharCode(8377)}{d.consultationFee}</span>
                                              {d.avgConsultTime && (
                                                <p className="text-[10px] text-gray-300 flex items-center justify-end gap-0.5 mt-0.5">
                                                  <Timer className="w-2.5 h-2.5" />{d.avgConsultTime}m/patient
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Step 3: Date */}
            {selectedDoctor > 0 && (
              <div className="animate-slide-up">
                <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full inline-flex items-center justify-center text-[10px] font-bold">3</span>
                  Select Date
                  <span className="text-[10px] text-gray-400 font-normal ml-1">(up to {maxBookingDays} days ahead)</span>
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={(() => { const d = new Date(); d.setDate(d.getDate() + maxBookingDays); return d.toISOString().split('T')[0]; })()}
                    className="input-field pl-10 text-sm" />
                </div>
              </div>
            )}

            {/* Step 4: Shift cards */}
            {selectedDoctor > 0 && shifts.length > 0 && (
              <div className="animate-slide-up">
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full inline-flex items-center justify-center text-[10px] font-bold">4</span>
                  Pick Shift
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {shifts.map(s => {
                    const isSel = selectedShift === s.id;
                    const isOnLeave = s.onLeave || false;
                    const isNotWorkDay = s.notWorkingDay || false;
                    const isShiftEnded = s.shiftEnded || false;
                    const isBlocked = isOnLeave || isNotWorkDay || isShiftEnded || !s.isAvailable;
                    return (
                      <button key={s.id} onClick={() => !isBlocked && setSelectedShift(s.id)} disabled={isBlocked}
                        className={`w-full p-3.5 rounded-xl text-left transition-all border-2 ${
                          isBlocked ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' :
                          isSel ? 'border-emerald-500 bg-emerald-50/50 shadow-md shadow-emerald-500/10' : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isShiftEnded ? 'bg-gray-200' : isOnLeave ? 'bg-red-100' : isNotWorkDay ? 'bg-amber-100' :
                              isSel ? 'bg-emerald-500 text-white' : 'bg-gray-100'
                            }`}>
                              <Clock className={`w-4 h-4 ${isShiftEnded ? 'text-gray-400' : isOnLeave ? 'text-red-500' : isNotWorkDay ? 'text-amber-500' : isSel ? '' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <span className="font-semibold text-sm text-gray-900">{s.shiftName}</span>
                              <p className="text-xs text-gray-400">{s.startTime} - {s.endTime}</p>
                              {isShiftEnded && <span className="text-[10px] text-gray-500 font-semibold">⏰ Shift Ended</span>}
                              {isOnLeave && !isShiftEnded && <span className="text-[10px] text-red-500 font-semibold">🚫 Doctor on Leave</span>}
                              {isNotWorkDay && !isOnLeave && !isShiftEnded && <span className="text-[10px] text-amber-500 font-semibold">⚠ Not a Working Day</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {isShiftEnded ? (
                              <span className="text-xs font-semibold text-gray-500">Ended</span>
                            ) : isOnLeave || isNotWorkDay ? (
                              <span className="text-xs font-semibold text-red-500">Unavailable</span>
                            ) : (
                              <>
                                <span className={`text-sm font-bold ${s.isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {s.availableSlots}/{s.tokenLimit}
                                </span>
                                <p className="text-[10px] text-gray-400">slots left</p>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary & Book — right column on desktop */}
            </div>
            {selectedDoctorData && (
              <div className="lg:sticky lg:top-24">
              <div className="animate-slide-up space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2.5">Booking Summary</p>
                  <div className="space-y-1.5 text-sm text-gray-700">
                    <div className="flex justify-between"><span className="text-gray-400">Doctor</span><span className="font-semibold">Dr. {selectedDoctorData.user?.name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Date</span><span className="font-semibold">{date}</span></div>
                    {selectedShift > 0 && <div className="flex justify-between"><span className="text-gray-400">Shift</span><span className="font-semibold">{shifts.find(s => s.id === selectedShift)?.shiftName}</span></div>}
                    <div className="flex justify-between"><span className="text-gray-400">Fee</span><span className="font-bold text-emerald-600">{String.fromCharCode(8377)}{selectedDoctorData.consultationFee}</span></div>
                  </div>
                  <p className="text-[11px] text-blue-500 mt-3 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> Token assigned after payment. One booking per doctor per day.
                  </p>
                </div>

                <button onClick={bookAppointment} disabled={loading}
                  className="btn-primary w-full py-3.5 text-sm sm:text-base flex items-center justify-center gap-2">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Booking...</>
                  ) : (
                    <>Book Appointment <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Tab Bar (mobile-first) ── */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-30 sm:hidden">
        <div className="flex">
          <button onClick={() => setTab('my')} className={`flex-1 py-3 flex flex-col items-center gap-0.5 ${tab === 'my' ? 'text-emerald-600' : 'text-gray-400'}`}>
            <Ticket className="w-5 h-5" />
            <span className="text-[10px] font-medium">My Tokens</span>
          </button>
          <button onClick={() => setTab('book')} className={`flex-1 py-3 flex flex-col items-center gap-0.5 ${tab === 'book' ? 'text-emerald-600' : 'text-gray-400'}`}>
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-medium">Book New</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
