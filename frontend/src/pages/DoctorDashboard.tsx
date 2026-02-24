import React, { useState, useEffect } from 'react';
import API from '../api';
import { Appointment } from '../types';
import { CheckCircle, Clock, Phone } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, called: 0, pending: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodayQueue();
  }, []);

  const fetchTodayQueue = async () => {
    try {
      setLoading(true);
      const response = await API.get('/doctor/today-queue');
      setAppointments(response.data.appointments);
      setDoctorInfo(response.data.doctor);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await API.post(`/doctor/appointments/${id}/complete`);
      fetchTodayQueue();
    } catch (error) {
      console.error('Failed to complete appointment:', error);
    }
  };

  const nextAppointment = appointments.find((apt) => apt.status === 'CALLED');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Doctor Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome, {doctorInfo?.name}
          </h1>
          <p className="text-gray-600">
            <strong>Specialization:</strong> {doctorInfo?.specialization}
          </p>
          <p className="text-gray-600">
            <strong>Date:</strong> {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Total Appointments</p>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Called</p>
            <p className="text-3xl font-bold text-blue-600">{stats.called}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
        </div>

        {/* Current Call */}
        {nextAppointment && (
          <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">Now Calling</p>
                <p className="text-5xl font-bold">Token #{nextAppointment.tokenNumber}</p>
              </div>
              <Phone size={64} className="opacity-80" />
            </div>
          </div>
        )}

        {/* Queue */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-200 px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-800">Today's Queue</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No appointments for today</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Token</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-3xl font-bold text-blue-600 mr-4">
                          #{apt.tokenNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          apt.status === 'CALLED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {apt.status === 'CALLED' && (
                        <button
                          onClick={() => handleComplete(apt.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700 transition"
                        >
                          <CheckCircle size={18} className="mr-2" /> Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
