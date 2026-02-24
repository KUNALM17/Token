import React, { useState, useEffect } from 'react';
import API from '../api';
import { Hospital } from '../types';
import { Plus, X } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newHospital, setNewHospital] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const response = await API.get('/super-admin/hospitals');
      setHospitals(response.data.hospitals);
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post('/super-admin/hospitals', newHospital);
      setNewHospital({ name: '', address: '', city: '', state: '', phone: '' });
      setShowForm(false);
      fetchHospitals();
    } catch (error) {
      console.error('Failed to create hospital:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await API.put(`/super-admin/hospitals/${id}/status`, {
        isActive: !currentStatus,
      });
      fetchHospitals();
    } catch (error) {
      console.error('Failed to update hospital:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Super Admin Dashboard</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-700 transition"
          >
            <Plus size={20} className="mr-2" /> Add Hospital
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Create Hospital</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateHospital} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Hospital Name"
                value={newHospital.name}
                onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />
              <input
                type="text"
                placeholder="Address"
                value={newHospital.address}
                onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />
              <input
                type="text"
                placeholder="City"
                value={newHospital.city}
                onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={newHospital.state}
                onChange={(e) => setNewHospital({ ...newHospital, state: e.target.value })}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newHospital.phone}
                onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value })}
                className="border border-gray-300 rounded px-4 py-2"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Creating...' : 'Create Hospital'}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{hospital.name}</h3>
              <p className="text-gray-600 text-sm mb-4">
                <strong>Location:</strong> {hospital.city}, {hospital.state}
              </p>
              <p className="text-gray-600 text-sm mb-4">
                <strong>Address:</strong> {hospital.address}
              </p>
              <p className="text-gray-600 text-sm mb-4">
                <strong>Phone:</strong> {hospital.phone}
              </p>
              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded text-sm font-semibold ${
                    hospital.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {hospital.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => handleToggleStatus(hospital.id, hospital.isActive)}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300 transition"
                >
                  Toggle
                </button>
              </div>
            </div>
          ))}
        </div>

        {hospitals.length === 0 && !showForm && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No hospitals found. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};
