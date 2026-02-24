import React, { useState, useEffect } from 'react';
import API from '../api';
import { Hospital } from '../types';
import { Plus, X, UserPlus, Building2, Users } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newHospital, setNewHospital] = useState({
    name: '', address: '', city: '', state: '', phone: '',
  });
  const [newAdmin, setNewAdmin] = useState({
    phone: '', name: '', hospitalId: '',
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const fetchHospitals = async () => {
    try {
      const response = await API.get('/super-admin/hospitals');
      setHospitals(response.data.hospitals);
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Failed to fetch hospitals', true);
    }
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/super-admin/hospitals', newHospital);
      setNewHospital({ name: '', address: '', city: '', state: '', phone: '' });
      setShowHospitalForm(false);
      showMessage('Hospital created successfully!');
      fetchHospitals();
    } catch (err: any) {
      showMessage(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Failed to create hospital', true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/super-admin/hospital-admins', newAdmin);
      setNewAdmin({ phone: '', name: '', hospitalId: '' });
      setShowAdminForm(false);
      showMessage('Hospital Admin created successfully!');
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Failed to create admin', true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await API.put(`/super-admin/hospitals/${id}/status`, {
        isActive: !currentStatus,
      });
      showMessage(`Hospital ${currentStatus ? 'deactivated' : 'activated'}!`);
      fetchHospitals();
    } catch (err: any) {
      showMessage('Failed to update hospital status', true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage hospitals and platform onboarding</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowAdminForm(!showAdminForm); setShowHospitalForm(false); }}
              className="bg-purple-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition font-medium"
            >
              <UserPlus size={18} /> Assign Admin
            </button>
            <button
              onClick={() => { setShowHospitalForm(!showHospitalForm); setShowAdminForm(false); }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-medium"
            >
              <Plus size={18} /> Add Hospital
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={18} /></button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4 flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess('')}><X size={18} /></button>
          </div>
        )}

        {/* Create Hospital Form */}
        {showHospitalForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Building2 size={22} /> Create Hospital
              </h2>
              <button onClick={() => setShowHospitalForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleCreateHospital} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name *</label>
                <input type="text" placeholder="e.g. City Medical Center" value={newHospital.name}
                  onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (10 digits) *</label>
                <input type="tel" placeholder="9876543210" value={newHospital.phone}
                  onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required maxLength={10} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input type="text" placeholder="123 Healthcare Lane" value={newHospital.address}
                  onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input type="text" placeholder="Mumbai" value={newHospital.city}
                    onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input type="text" placeholder="Maharashtra" value={newHospital.state}
                    onChange={(e) => setNewHospital({ ...newHospital, state: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="md:col-span-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium">
                {loading ? 'Creating...' : 'Create Hospital'}
              </button>
            </form>
          </div>
        )}

        {/* Assign Hospital Admin Form */}
        {showAdminForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <UserPlus size={22} /> Assign Hospital Admin
              </h2>
              <button onClick={() => setShowAdminForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Phone (10 digits) *</label>
                <input type="tel" placeholder="9876543210" value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  required maxLength={10} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                <input type="text" placeholder="John Doe" value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
                <select value={newAdmin.hospitalId}
                  onChange={(e) => setNewAdmin({ ...newAdmin, hospitalId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  required>
                  <option value="">Select Hospital</option>
                  {hospitals.filter(h => h.isActive).map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={loading}
                className="md:col-span-3 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition font-medium">
                {loading ? 'Assigning...' : 'Assign Admin'}
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-gray-500 text-sm">Total Hospitals</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{hospitals.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-gray-500 text-sm">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{hospitals.filter(h => h.isActive).length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-gray-500 text-sm">Inactive</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{hospitals.filter(h => !h.isActive).length}</p>
          </div>
        </div>

        {/* Hospital Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-800">{hospital.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  hospital.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {hospital.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                <p>📍 {hospital.city}, {hospital.state}</p>
                <p>🏠 {hospital.address}</p>
                <p>📞 {hospital.phone}</p>
                {hospital._count && (
                  <p>👨‍⚕️ {hospital._count.doctors} doctors · 📋 {hospital._count.appointments} appointments</p>
                )}
              </div>
              <button onClick={() => handleToggleStatus(hospital.id, hospital.isActive ?? true)}
                className={`w-full py-2 rounded-lg text-sm font-medium transition ${
                  hospital.isActive
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}>
                {hospital.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>

        {hospitals.length === 0 && !showHospitalForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No hospitals yet. Click "Add Hospital" to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};
