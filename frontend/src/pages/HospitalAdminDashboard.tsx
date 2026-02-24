import React, { useState, useEffect } from 'react';
import API from '../api';
import { Appointment } from '../types';
import { Plus, Download, X, RefreshCw } from 'lucide-react';

interface DoctorData {
  id: number;
  specialization: string;
  consultationFee: number;
  dailyTokenLimit: number;
  isActive: boolean;
  user?: { id: number; name: string; phone: string };
}

export const HospitalAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'doctors'>('queue');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newDoctor, setNewDoctor] = useState({
    phone: '', name: '', specialization: '', consultationFee: '', dailyTokenLimit: '50',
  });

  useEffect(() => {
    if (activeTab === 'queue') fetchTodayAppointments();
    else fetchDoctors();
  }, [activeTab]);

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/appointments/today');
      setAppointments(response.data.appointments);
    } catch (err: any) {
      showMessage('Failed to fetch appointments', true);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/doctors');
      setDoctors(response.data.doctors);
    } catch (err: any) {
      showMessage('Failed to fetch doctors', true);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async (id: number) => {
    try {
      await API.post(`/admin/appointments/${id}/call-next`);
      showMessage('Patient called!');
      fetchTodayAppointments();
    } catch (err: any) { showMessage('Failed to call', true); }
  };

  const handleSkip = async (id: number) => {
    try {
      await API.post(`/admin/appointments/${id}/skip`);
      showMessage('Patient skipped');
      fetchTodayAppointments();
    } catch (err: any) { showMessage('Failed to skip', true); }
  };

  const handleComplete = async (id: number) => {
    try {
      await API.post(`/admin/appointments/${id}/complete`);
      showMessage('Appointment completed!');
      fetchTodayAppointments();
    } catch (err: any) { showMessage('Failed to complete', true); }
  };

  const handleExportCSV = async () => {
    try {
      const response = await API.get('/admin/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `appointments_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showMessage('CSV downloaded!');
    } catch (err: any) { showMessage('Failed to export CSV', true); }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/doctors', newDoctor);
      setNewDoctor({ phone: '', name: '', specialization: '', consultationFee: '', dailyTokenLimit: '50' });
      setShowDoctorForm(false);
      showMessage('Doctor added successfully!');
      fetchDoctors();
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Failed to create doctor', true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDoctor = async (doctor: DoctorData) => {
    try {
      await API.put(`/admin/doctors/${doctor.id}`, { isActive: !doctor.isActive });
      showMessage(`Doctor ${doctor.isActive ? 'deactivated' : 'activated'}!`);
      fetchDoctors();
    } catch (err: any) { showMessage('Failed to update doctor', true); }
  };

  const booked = appointments.filter((a) => a.status === 'BOOKED').length;
  const called = appointments.filter((a) => a.status === 'CALLED').length;
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
  const skipped = appointments.filter((a) => a.status === 'SKIPPED').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Hospital Admin Dashboard</h1>
        <p className="text-gray-500 mb-6">Manage doctors and patient queue</p>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setActiveTab('queue')}
            className={`px-5 py-2.5 rounded-lg font-medium transition ${
              activeTab === 'queue' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}>
            🎟️ Queue Management
          </button>
          <button onClick={() => setActiveTab('doctors')}
            className={`px-5 py-2.5 rounded-lg font-medium transition ${
              activeTab === 'doctors' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}>
            👨‍⚕️ Doctors
          </button>
        </div>

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <>
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <p className="text-gray-500 text-xs uppercase">Total</p>
                <p className="text-3xl font-bold text-gray-800">{appointments.length}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl shadow-sm p-5 border border-yellow-100">
                <p className="text-yellow-600 text-xs uppercase">Waiting</p>
                <p className="text-3xl font-bold text-yellow-700">{booked}</p>
              </div>
              <div className="bg-blue-50 rounded-xl shadow-sm p-5 border border-blue-100">
                <p className="text-blue-600 text-xs uppercase">Called</p>
                <p className="text-3xl font-bold text-blue-700">{called}</p>
              </div>
              <div className="bg-green-50 rounded-xl shadow-sm p-5 border border-green-100">
                <p className="text-green-600 text-xs uppercase">Done</p>
                <p className="text-3xl font-bold text-green-700">{completed}</p>
              </div>
              <div className="bg-red-50 rounded-xl shadow-sm p-5 border border-red-100">
                <p className="text-red-600 text-xs uppercase">Skipped</p>
                <p className="text-3xl font-bold text-red-700">{skipped}</p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={fetchTodayAppointments}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition text-sm font-medium">
                <RefreshCw size={16} /> Refresh
              </button>
              <button onClick={handleExportCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition text-sm font-medium">
                <Download size={16} /> Export CSV
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Token</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Doctor</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Loading...</td></tr>
                  ) : appointments.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No appointments for today</td></tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt.id} className="border-t hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <span className="text-xl font-bold text-blue-600">#{apt.tokenNumber}</span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800">{apt.patient?.name || 'Patient'}</p>
                          <p className="text-xs text-gray-400">{apt.patient?.phone}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800">{apt.doctor?.user?.name || 'Doctor'}</p>
                          <p className="text-xs text-gray-400">{apt.doctor?.specialization}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            apt.status === 'CALLED' ? 'bg-blue-100 text-blue-700' :
                            apt.status === 'SKIPPED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{apt.status}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            apt.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>{apt.paymentStatus}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5">
                            {apt.status === 'BOOKED' && (
                              <button onClick={() => handleCallNext(apt.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 font-medium">
                                Call
                              </button>
                            )}
                            {apt.status === 'CALLED' && (
                              <>
                                <button onClick={() => handleComplete(apt.id)}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 font-medium">
                                  Done
                                </button>
                                <button onClick={() => handleSkip(apt.id)}
                                  className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 font-medium">
                                  Skip
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <>
            <div className="mb-6">
              <button onClick={() => setShowDoctorForm(!showDoctorForm)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-medium">
                <Plus size={18} /> Add Doctor
              </button>
            </div>

            {showDoctorForm && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Add New Doctor</h2>
                  <button onClick={() => setShowDoctorForm(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={22} />
                  </button>
                </div>
                <form onSubmit={handleCreateDoctor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Phone (10 digits) *</label>
                    <input type="tel" placeholder="9876543210" value={newDoctor.phone}
                      onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      required maxLength={10} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
                    <input type="text" placeholder="Dr. Sharma" value={newDoctor.name}
                      onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                    <input type="text" placeholder="Cardiology" value={newDoctor.specialization}
                      onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹) *</label>
                    <input type="number" placeholder="500" value={newDoctor.consultationFee}
                      onChange={(e) => setNewDoctor({ ...newDoctor, consultationFee: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      required min={0} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Token Limit</label>
                    <input type="number" placeholder="50" value={newDoctor.dailyTokenLimit}
                      onChange={(e) => setNewDoctor({ ...newDoctor, dailyTokenLimit: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      min={1} max={500} />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" disabled={loading}
                      className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium">
                      {loading ? 'Adding...' : 'Add Doctor'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{doctor.user?.name || 'Doctor'}</h3>
                      <p className="text-sm text-gray-400">{doctor.user?.phone}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      doctor.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {doctor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p>🔬 {doctor.specialization}</p>
                    <p>💰 ₹{doctor.consultationFee} per consultation</p>
                    <p>🎟️ {doctor.dailyTokenLimit} tokens/day</p>
                  </div>
                  <button onClick={() => handleToggleDoctor(doctor)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition ${
                      doctor.isActive
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}>
                    {doctor.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>

            {doctors.length === 0 && !showDoctorForm && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-400 text-lg">No doctors yet. Click "Add Doctor" to register one.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
