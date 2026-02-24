import React, { useState, useEffect } from 'react';
import API from '../api';
import { Hospital, Doctor, Appointment } from '../types';
import { Plus, Download, Phone, AlertCircle } from 'lucide-react';

export const HospitalAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'doctors'>('queue');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    userId: '',
    specialization: '',
    consultationFee: 0,
    dailyTokenLimit: 50,
  });

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchTodayAppointments();
    } else {
      fetchDoctors();
    }
  }, [activeTab]);

  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/appointments/today');
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/doctors');
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async (id: string) => {
    try {
      await API.post(`/admin/appointments/${id}/call-next`);
      fetchTodayAppointments();
    } catch (error) {
      console.error('Failed to call appointment:', error);
    }
  };

  const handleSkip = async (id: string) => {
    try {
      await API.post(`/admin/appointments/${id}/skip`);
      fetchTodayAppointments();
    } catch (error) {
      console.error('Failed to skip appointment:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await API.post(`/admin/appointments/${id}/complete`);
      fetchTodayAppointments();
    } catch (error) {
      console.error('Failed to complete appointment:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await API.get('/admin/export/csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `appointments_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const booked = appointments.filter((a) => a.status === 'BOOKED').length;
  const called = appointments.filter((a) => a.status === 'CALLED').length;
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Hospital Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'queue'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            Queue Management
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'doctors'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            Doctors
          </button>
        </div>

        {/* Queue Management Tab */}
        {activeTab === 'queue' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm">Total Appointments</p>
                <p className="text-3xl font-bold text-gray-800">{appointments.length}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm">Booked</p>
                <p className="text-3xl font-bold text-yellow-600">{booked}</p>
              </div>
              <div className="bg-blue-50 rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm">Called</p>
                <p className="text-3xl font-bold text-blue-600">{called}</p>
              </div>
              <div className="bg-green-50 rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completed}</p>
              </div>
            </div>

            {/* Export Button */}
            <div className="mb-6">
              <button
                onClick={handleExportCSV}
                className="bg-green-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-green-700 transition"
              >
                <Download size={20} className="mr-2" /> Export CSV
              </button>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Token</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Patient</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Doctor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-600">
                        No appointments for today
                      </td>
                    </tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt.id} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4 font-bold text-lg text-blue-600">
                          #{apt.tokenNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold">Patient</p>
                            <p className="text-sm text-gray-600">{apt.patientId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">Doctor</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              apt.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : apt.status === 'CALLED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {apt.status === 'BOOKED' && (
                              <button
                                onClick={() => handleCallNext(apt.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              >
                                Call
                              </button>
                            )}
                            {apt.status === 'CALLED' && (
                              <>
                                <button
                                  onClick={() => handleComplete(apt.id)}
                                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                >
                                  Done
                                </button>
                                <button
                                  onClick={() => handleSkip(apt.id)}
                                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                >
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
              <button
                onClick={() => setShowDoctorForm(!showDoctorForm)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-700 transition"
              >
                <Plus size={20} className="mr-2" /> Add Doctor
              </button>
            </div>

            {showDoctorForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <form className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="User ID (Phone)"
                    value={newDoctor.userId}
                    onChange={(e) => setNewDoctor({ ...newDoctor, userId: e.target.value })}
                    className="border border-gray-300 rounded px-4 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Specialization"
                    value={newDoctor.specialization}
                    onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                    className="border border-gray-300 rounded px-4 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Consultation Fee"
                    value={newDoctor.consultationFee}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, consultationFee: Number(e.target.value) })
                    }
                    className="border border-gray-300 rounded px-4 py-2"
                  />
                  <input
                    type="number"
                    placeholder="Daily Token Limit"
                    value={newDoctor.dailyTokenLimit}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, dailyTokenLimit: Number(e.target.value) })
                    }
                    className="border border-gray-300 rounded px-4 py-2"
                  />
                  <button
                    type="submit"
                    className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Create Doctor
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{doctor.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Specialization:</strong> {doctor.specialization}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Fee:</strong> ₹{doctor.consultationFee}
                  </p>
                  <p className="text-gray-600 text-sm mb-2">
                    <strong>Daily Limit:</strong> {doctor.dailyTokenLimit} tokens
                  </p>
                  <span
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      doctor.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {doctor.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
