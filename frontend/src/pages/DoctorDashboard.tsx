import React, { useState, useEffect } from 'react';
import API from '../api';
import { Appointment } from '../types';
import { CheckCircle, Clock, Play, SkipForward, RefreshCw, User, Phone } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, booked: 0, called: 0, pending: 0, completed: 0, skipped: 0 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    fetchTodayQueue();
  }, []);

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const fetchTodayQueue = async () => {
    try {
      setLoading(true);
      const response = await API.get('/doctor/today-queue');
      setAppointments(response.data.appointments);
      setDoctorInfo(response.data.doctor);
      setStats(response.data.stats);
      // If there's a CALLED appointment, session is active
      const hasCalled = response.data.appointments.some((a: any) => a.status === 'CALLED');
      if (hasCalled) setIsSessionActive(true);
    } catch (err: any) {
      showMsg('Failed to fetch queue', true);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAppointments = async () => {
    setIsSessionActive(true);
    await handleCallNext();
  };

  const handleCallNext = async () => {
    try {
      const response = await API.post('/doctor/call-next');
      if (response.data.appointment) {
        showMsg(`Token #${response.data.appointment.tokenNumber} called!`);
      } else {
        showMsg(response.data.message || 'No more patients in queue');
      }
      fetchTodayQueue();
    } catch (err: any) {
      showMsg(err.response?.data?.error || 'Failed to call next', true);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await API.post(`/doctor/appointments/${id}/complete`);
      showMsg('Patient marked as completed! Calling next...');
      // Auto call next after completing
      setTimeout(() => handleCallNext(), 500);
    } catch (err: any) {
      showMsg(err.response?.data?.error || 'Failed to complete', true);
    }
  };

  const handleSkip = async (id: number) => {
    try {
      await API.post(`/doctor/appointments/${id}/skip`);
      showMsg('Patient skipped, moved to later in queue. Calling next...');
      // Auto call next after skipping
      setTimeout(() => handleCallNext(), 500);
    } catch (err: any) {
      showMsg(err.response?.data?.error || 'Failed to skip', true);
    }
  };

  const calledAppointment = appointments.find((apt) => apt.status === 'CALLED');
  const waitingQueue = appointments.filter((apt) => apt.status === 'BOOKED');
  const skippedQueue = appointments.filter((apt) => apt.status === 'SKIPPED');
  const completedQueue = appointments.filter((apt) => apt.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Doctor Info Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Welcome, Dr. {doctorInfo?.name || 'Doctor'}
              </h1>
              <p className="text-gray-500 mt-1">
                {doctorInfo?.specialization} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-gray-400 text-sm mt-0.5">
                Daily Limit: {doctorInfo?.dailyTokenLimit || 0} tokens
              </p>
            </div>
            <button onClick={fetchTodayQueue}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition text-sm font-medium">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>}
        {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <p className="text-gray-500 text-xs uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-sm p-4 border border-blue-100">
            <p className="text-blue-600 text-xs uppercase">Booked</p>
            <p className="text-2xl font-bold text-blue-700">{stats.booked}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-sm p-4 border border-yellow-100">
            <p className="text-yellow-600 text-xs uppercase">Serving</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.called}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-4 border border-green-100">
            <p className="text-green-600 text-xs uppercase">Done</p>
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-4 border border-red-100">
            <p className="text-red-600 text-xs uppercase">Skipped</p>
            <p className="text-2xl font-bold text-red-700">{stats.skipped}</p>
          </div>
        </div>

        {/* Start Appointments Button */}
        {!isSessionActive && stats.booked > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-8 mb-6 text-center">
            <Play size={48} className="mx-auto text-white/80 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Start?</h2>
            <p className="text-green-100 mb-6">{stats.booked} patients are waiting in queue</p>
            <button onClick={handleStartAppointments}
              className="bg-white text-green-700 px-10 py-3 rounded-xl font-bold text-lg hover:bg-green-50 transition shadow-lg">
              ▶ Start Appointments
            </button>
          </div>
        )}

        {/* Currently Serving Patient — Full Profile Card */}
        {calledAppointment && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl shadow-lg p-8 mb-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-blue-200 text-sm uppercase tracking-wider mb-1">Now Serving</p>
                <p className="text-5xl font-bold mb-4">Token #{calledAppointment.tokenNumber}</p>
                
                <div className="bg-white/15 backdrop-blur-sm rounded-lg p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-blue-200 text-xs uppercase">Patient Name</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <User size={16} /> {calledAppointment.patient?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs uppercase">Phone</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <Phone size={16} /> {calledAppointment.patient?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs uppercase">Age / Gender</p>
                    <p className="text-lg font-semibold">
                      {calledAppointment.patient?.age || '—'} yrs · {calledAppointment.patient?.gender || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs uppercase">Weight</p>
                    <p className="text-lg font-semibold">
                      {calledAppointment.patient?.weight ? `${calledAppointment.patient.weight} kg` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs uppercase">City</p>
                    <p className="text-lg font-semibold">
                      {calledAppointment.patient?.city || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => handleComplete(calledAppointment.id)}
                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition text-lg">
                <CheckCircle size={22} /> Mark Completed
              </button>
              <button onClick={() => handleSkip(calledAppointment.id)}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition text-lg">
                <SkipForward size={22} /> Skip Patient
              </button>
            </div>
          </div>
        )}

        {/* No patients being served but session is active */}
        {isSessionActive && !calledAppointment && (stats.booked > 0 || stats.skipped > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6 text-center">
            <p className="text-gray-500 mb-4">No patient currently being served</p>
            <button onClick={handleCallNext}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
              📣 Call Next Patient
            </button>
          </div>
        )}

        {/* All Done */}
        {isSessionActive && !calledAppointment && stats.booked === 0 && stats.skipped === 0 && stats.completed > 0 && (
          <div className="bg-green-50 rounded-xl border border-green-200 p-8 mb-6 text-center">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">All Done! 🎉</h2>
            <p className="text-green-600">You've completed all {stats.completed} appointments for today.</p>
          </div>
        )}

        {/* Waiting Queue */}
        {waitingQueue.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="bg-blue-50 border-b px-6 py-4">
              <h2 className="text-lg font-bold text-blue-800">📋 Waiting Queue ({waitingQueue.length})</h2>
            </div>
            <div className="divide-y">
              {waitingQueue.map((apt, idx) => (
                <div key={apt.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-blue-600">#{apt.tokenNumber}</span>
                    <div>
                      <p className="font-medium text-gray-800">{apt.patient?.name || 'Patient'}</p>
                      <p className="text-xs text-gray-400">{apt.patient?.phone} · {apt.patient?.age ? `${apt.patient.age}yrs` : ''} {apt.patient?.gender || ''}</p>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                    #{idx + 1} in line
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skipped (will be recalled) */}
        {skippedQueue.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="bg-orange-50 border-b px-6 py-4">
              <h2 className="text-lg font-bold text-orange-800">⏭ Skipped — Will Be Recalled ({skippedQueue.length})</h2>
            </div>
            <div className="divide-y">
              {skippedQueue.map((apt) => (
                <div key={apt.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                  <span className="text-2xl font-bold text-orange-500">#{apt.tokenNumber}</span>
                  <div>
                    <p className="font-medium text-gray-800">{apt.patient?.name || 'Patient'}</p>
                    <p className="text-xs text-gray-400">{apt.patient?.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedQueue.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-green-50 border-b px-6 py-4">
              <h2 className="text-lg font-bold text-green-800">✅ Completed ({completedQueue.length})</h2>
            </div>
            <div className="divide-y">
              {completedQueue.map((apt) => (
                <div key={apt.id} className="px-6 py-4 flex items-center gap-4 opacity-60">
                  <span className="text-2xl font-bold text-green-500">#{apt.tokenNumber}</span>
                  <div>
                    <p className="font-medium text-gray-800">{apt.patient?.name || 'Patient'}</p>
                    <p className="text-xs text-gray-400">{apt.patient?.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && appointments.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Clock size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 text-lg">No appointments booked for today</p>
          </div>
        )}
      </div>
    </div>
  );
};
