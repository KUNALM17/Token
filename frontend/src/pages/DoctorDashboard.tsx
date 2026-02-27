import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { Appointment, User } from '../types';
import {
  PhoneCall, CheckCircle2, SkipForward, RotateCcw, Users, Clock,
  Activity, LogOut, ChevronDown, Zap, Timer, Settings, Sun, Moon, CalendarDays, Trash2, AlertCircle, X,
} from 'lucide-react';
import { useTheme } from '../theme';

export default function DoctorDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { theme, toggle } = useTheme();
  const ThemeToggle = () => (
    <button onClick={toggle} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Toggle theme">
      {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
    </button>
  );
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [skipped, setSkipped] = useState<Appointment[]>([]);
  const [current, setCurrent] = useState<Appointment | null>(null);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [shiftId, setShiftId] = useState<number>(0);
  const [shifts, setShifts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, skipped: 0 });
  const [showSkipped, setShowSkipped] = useState(false);

  // Avg consult time setting
  const [avgTime, setAvgTime] = useState<number>(5);
  const [savingTime, setSavingTime] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Leave management
  const [showLeaves, setShowLeaves] = useState(false);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveShiftId, setLeaveShiftId] = useState<string>('');
  const [leaveReason, setLeaveReason] = useState('');
  const [markingLeave, setMarkingLeave] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      const params: any = {};
      if (shiftId) params.shiftId = shiftId;
      const r = await api.get('/doctor/today-queue', { params });
      const all: Appointment[] = r.data.appointments || [];
      const waiting = all.filter(a => a.status === 'BOOKED' || a.status === 'CALLED');
      const skip = all.filter(a => a.status === 'SKIPPED');
      const called = all.find(a => a.status === 'CALLED');
      setQueue(waiting);
      setSkipped(skip);
      setCurrent(called || waiting[0] || null);
      setShifts(r.data.shifts || []);
      if (r.data.avgConsultTime) setAvgTime(r.data.avgConsultTime);
      setStats({
        total: all.length,
        completed: all.filter(a => a.status === 'COMPLETED').length,
        pending: waiting.filter(a => a.status === 'BOOKED').length,
        skipped: skip.length,
      });
    } catch { setQueue([]); }
  }, [shiftId]);

  useEffect(() => { loadQueue(); const t = setInterval(loadQueue, 8000); return () => clearInterval(t); }, [loadQueue]);

  const handleAction = async (action: 'complete' | 'skip', id: number) => {
    setSwipeDir(action === 'complete' ? 'right' : 'left');
    setTimeout(async () => {
      try {
        const endpoint = action === 'complete' ? `/doctor/complete/${id}` : `/doctor/skip/${id}`;
        await api.patch(endpoint);
        setSwipeDir(null);
        loadQueue();
      } catch { setSwipeDir(null); }
    }, 350);
  };

  const handleUnskip = async (id: number) => {
    try { await api.patch(`/doctor/unskip/${id}`); loadQueue(); } catch {}
  };

  const handleCallNext = async () => {
    try { await api.patch('/doctor/call-next', shiftId ? { shiftId } : {}); loadQueue(); } catch {}
  };

  const saveAvgTime = async () => {
    setSavingTime(true);
    try {
      await api.patch('/doctor/settings', { avgConsultTime: avgTime });
      setShowSettings(false);
    } catch {}
    setSavingTime(false);
  };

  const loadMyLeaves = async () => {
    try { const r = await api.get('/doctor/my-leaves'); setMyLeaves(r.data.leaves || []); } catch {}
  };
  useEffect(() => { if (showLeaves) loadMyLeaves(); }, [showLeaves]);

  const markLeave = async () => {
    if (!leaveDate) { setLeaveMsg({ type: 'error', text: 'Please select a date' }); return; }
    setMarkingLeave(true);
    try {
      await api.post('/doctor/mark-leave', {
        leaveDate,
        shiftId: leaveShiftId ? parseInt(leaveShiftId) : undefined,
        reason: leaveReason || undefined,
      });
      setLeaveMsg({ type: 'success', text: 'Leave marked successfully!' });
      setLeaveDate(''); setLeaveShiftId(''); setLeaveReason('');
      loadMyLeaves();
    } catch (e: any) { setLeaveMsg({ type: 'error', text: e.response?.data?.error || 'Failed to mark leave' }); }
    setMarkingLeave(false);
  };

  const cancelLeave = async (id: number) => {
    try { await api.delete(`/doctor/leaves/${id}`); setLeaveMsg({ type: 'success', text: 'Leave cancelled' }); loadMyLeaves(); }
    catch (e: any) { setLeaveMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Doctor Panel</h1>
              <p className="text-[11px] text-gray-400 leading-tight">Dr. {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => { setShowLeaves(!showLeaves); setShowSettings(false); }} className={`p-2 hover:bg-gray-100 rounded-xl transition-colors ${showLeaves ? 'bg-red-50' : ''}`} title="Manage Leaves">
              <CalendarDays className={`w-4 h-4 ${showLeaves ? 'text-red-500' : 'text-gray-400'}`} />
            </button>
            <button onClick={() => { setShowSettings(!showSettings); setShowLeaves(false); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Settings">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Logout">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg lg:max-w-5xl mx-auto px-4 lg:px-8 pb-8">
        {/* ── Settings Panel ── */}
        {showSettings && (
          <div className="mt-4 glass-card-dark p-4 animate-slide-up">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Timer className="w-4 h-4 text-indigo-500" /> Consultation Settings
            </h3>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 flex-shrink-0 whitespace-nowrap">Avg time per patient</label>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range" min={1} max={60} value={avgTime}
                  onChange={e => setAvgTime(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-500 h-2"
                />
                <span className="text-sm font-bold text-indigo-600 w-14 text-center bg-indigo-50 rounded-lg py-1">{avgTime}m</span>
              </div>
              <button onClick={saveAvgTime} disabled={savingTime}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 active:scale-[0.97] transition-all disabled:opacity-50 flex-shrink-0">
                {savingTime ? '...' : 'Save'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Used to show estimated wait time to patients in live queue.</p>
          </div>
        )}

        {/* ── Leave Panel ── */}
        {showLeaves && (
          <div className="mt-4 glass-card-dark p-4 animate-slide-up space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-red-500" /> Mark Unavailable
            </h3>

            {leaveMsg && (
              <div className={`px-3 py-2 rounded-xl flex items-center gap-2 text-xs ${leaveMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {leaveMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span className="flex-1">{leaveMsg.text}</span>
                <button onClick={() => setLeaveMsg(null)}><X className="w-3.5 h-3.5 opacity-50" /></button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Date *</label>
                <input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Shift (optional)</label>
                <select value={leaveShiftId} onChange={e => setLeaveShiftId(e.target.value)} className="select-field text-sm">
                  <option value="">Full Day</option>
                  {shifts.map((s: any) => <option key={s.id} value={s.id}>{s.shiftName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Reason</label>
                <input placeholder="Optional" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} className="input-field text-sm" />
              </div>
            </div>
            <button onClick={markLeave} disabled={markingLeave}
              className="px-5 py-2.5 bg-red-500 text-white text-xs font-semibold rounded-xl hover:bg-red-600 active:scale-[0.97] transition-all disabled:opacity-50">
              {markingLeave ? 'Marking...' : 'Mark Leave'}
            </button>

            {/* Upcoming leaves list */}
            {myLeaves.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Upcoming Leaves</p>
                <div className="space-y-1.5">
                  {myLeaves.map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between bg-red-50/50 border border-red-100 rounded-xl px-3 py-2">
                      <div>
                        <span className="text-sm font-semibold text-gray-800">
                          {new Date(l.leaveDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">{l.shift ? l.shift.shiftName : 'Full Day'}</span>
                        {l.reason && <span className="text-xs text-gray-400 ml-2">• {l.reason}</span>}
                      </div>
                      <button onClick={() => cancelLeave(l.id)} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors" title="Cancel leave">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Total', value: stats.total, icon: <Users className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', iconColor: 'text-blue-400' },
            { label: 'Done', value: stats.completed, icon: <CheckCircle2 className="w-3.5 h-3.5" />, bg: 'bg-emerald-50', text: 'text-emerald-700', iconColor: 'text-emerald-400' },
            { label: 'Waiting', value: stats.pending, icon: <Clock className="w-3.5 h-3.5" />, bg: 'bg-amber-50', text: 'text-amber-700', iconColor: 'text-amber-400' },
            { label: 'Skipped', value: stats.skipped, icon: <SkipForward className="w-3.5 h-3.5" />, bg: 'bg-red-50', text: 'text-red-700', iconColor: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2.5 sm:p-3 text-center`}>
              <div className={`text-xl sm:text-2xl font-extrabold ${s.text}`}>{s.value}</div>
              <div className={`text-[10px] sm:text-[11px] font-medium ${s.iconColor} flex items-center justify-center gap-1 mt-0.5`}>
                {s.icon}{s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Shift filter */}
        {shifts.length > 0 && (
          <div className="mt-4 relative">
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select value={shiftId} onChange={e => setShiftId(parseInt(e.target.value))} className="select-field text-sm">
              <option value={0}>All Shifts</option>
              {shifts.map((s: any) => <option key={s.id} value={s.id}>{s.shiftName} ({s.startTime}–{s.endTime})</option>)}
            </select>
          </div>
        )}

        {/* Call Next */}
        <button onClick={handleCallNext}
          className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all">
          <Zap className="w-5 h-5" /> Call Next Patient
        </button>

        {/* ── Desktop: 2-column layout for card + queue ── */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── TINDER CARD ── */}
        <div>
          {current ? (
            <div className={`transition-all duration-350 ${
              swipeDir === 'right' ? 'translate-x-[120%] opacity-0 rotate-12' :
              swipeDir === 'left' ? '-translate-x-[120%] opacity-0 -rotate-12' : ''
            }`}>
              <div className="glass-card-dark p-5 sm:p-6 relative overflow-hidden">
                {current.status === 'CALLED' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse" />
                )}

                <div className="text-center">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 rotate-3"
                    style={{ width: '4.5rem', height: '4.5rem' }}>
                    <span className="text-xl sm:text-2xl font-extrabold text-white -rotate-3">#{current.tokenNumber}</span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{current.patient?.name || 'Patient'}</h2>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-400 mb-4">
                    {current.patient?.phone && <span className="flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5" />{current.patient.phone}</span>}
                    {current.patient?.age && <span>Age {current.patient.age}</span>}
                    {current.patient?.gender && <span>{current.patient.gender}</span>}
                  </div>

                  {current.shift && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full text-xs font-medium text-indigo-600">
                      <Clock className="w-3 h-3" />{current.shift.shiftName}
                    </div>
                  )}

                  <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    current.status === 'CALLED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${current.status === 'CALLED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    {current.status === 'CALLED' ? 'In Progress' : 'Waiting'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => handleAction('skip', current.id)}
                  className="flex-1 bg-white border-2 border-red-200 text-red-600 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-300 active:scale-[0.97] transition-all">
                  <SkipForward className="w-5 h-5" /> Skip
                </button>
                <button onClick={() => handleAction('complete', current.id)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.97] transition-all">
                  <CheckCircle2 className="w-5 h-5" /> Complete
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card-dark p-10 sm:p-12 text-center animate-scale-in">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">All Caught Up!</h2>
              <p className="text-gray-400 text-sm">No patients waiting in queue</p>
            </div>
          )}
        </div>

        {/* ── Right column: Queue + Skipped ── */}
        <div>
        {/* Upcoming queue */}
        {queue.length > 1 && (
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Up Next ({queue.length - 1})</h3>
            <div className="space-y-2">
              {queue.slice(1, 5).map((a, i) => (
                <div key={a.id} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-gray-100 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-600">#{a.tokenNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800 truncate block">{a.patient?.name}</span>
                    {a.shift && <span className="text-[11px] text-gray-400">{a.shift.shiftName}</span>}
                  </div>
                </div>
              ))}
              {queue.length > 5 && (
                <p className="text-center text-xs text-gray-400 py-1">+{queue.length - 5} more</p>
              )}
            </div>
          </div>
        )}

        {/* Skipped section */}
        {skipped.length > 0 && (
          <div className="mt-6">
            <button onClick={() => setShowSkipped(!showSkipped)} className="flex items-center justify-between w-full mb-3">
              <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">Skipped ({skipped.length})</h3>
              <ChevronDown className={`w-4 h-4 text-red-400 transition-transform ${showSkipped ? 'rotate-180' : ''}`} />
            </button>

            {showSkipped && (
              <div className="space-y-2 animate-slide-up">
                {skipped.map(a => (
                  <div key={a.id} className="bg-red-50/50 border border-red-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-red-600">#{a.tokenNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800 truncate block">{a.patient?.name}</span>
                      {a.shift && <span className="text-[11px] text-gray-400">{a.shift.shiftName}</span>}
                    </div>
                    <button onClick={() => handleUnskip(a.id)}
                      className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 active:scale-[0.97] transition-all flex items-center gap-1 flex-shrink-0">
                      <RotateCcw className="w-3 h-3" />Unskip
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        </div>{/* end right column */}
        </div>{/* end 2-col grid */}
      </div>
    </div>
  );
}
