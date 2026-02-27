import { useState, useEffect } from 'react';
import api from '../api';
import { Hospital, User } from '../types';
import { Building2, Plus, UserPlus, Power, Trash2, Phone, MapPin, LogOut, CheckCircle2, AlertCircle, X, Shield, Users, Search, Edit3, ChevronDown, Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme';

export default function SuperAdminDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const ThemeToggle = () => (
    <button onClick={toggle} className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-gray-100'}`} title="Toggle theme">
      {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
    </button>
  );
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [tab, setTab] = useState<'list' | 'create' | 'users'>('list');
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [adminForm, setAdminForm] = useState({ hospitalId: 0, phone: '', name: '' });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);

  // User management
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({ total: 0, patients: 0, doctors: 0, admins: 0 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ phone: '', name: '', role: 'PATIENT', hospitalId: '', age: '', gender: '', weight: '', city: '' });

  const load = async () => {
    try { const r = await api.get('/super-admin/hospitals'); setHospitals(r.data.hospitals || r.data || []); } catch { setHospitals([]); }
  };

  const loadUsers = async () => {
    try {
      const params: any = {};
      if (userSearch) params.search = userSearch;
      if (userRoleFilter && userRoleFilter !== 'ALL') params.role = userRoleFilter;
      const r = await api.get('/super-admin/users', { params });
      setUsers(r.data.users || []);
      setUserStats(r.data.stats || { total: 0, patients: 0, doctors: 0, admins: 0 });
    } catch { setUsers([]); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab]);

  const createHospital = async () => {
    if (!form.name || !form.address || !form.phone) return setMsg({ type: 'error', text: 'All fields are required' });
    setLoading(true);
    try {
      await api.post('/super-admin/hospitals', form);
      setMsg({ type: 'success', text: 'Hospital created successfully!' }); setForm({ name: '', address: '', phone: '' }); load(); setTab('list');
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Failed to create hospital' }); }
    setLoading(false);
  };

  const toggleStatus = async (id: number) => {
    const h = hospitals.find(x => x.id === id);
    if (!h) return;
    try { await api.put(`/super-admin/hospitals/${id}/status`, { isActive: !h.isActive }); load(); } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const deleteHospital = async (id: number) => {
    if (!confirm('Are you sure you want to delete this hospital? This action cannot be undone.')) return;
    try { await api.delete(`/super-admin/hospitals/${id}`); load(); setMsg({ type: 'success', text: 'Hospital deleted' }); } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const createAdmin = async () => {
    if (!adminForm.hospitalId || !adminForm.phone || !adminForm.name) return setMsg({ type: 'error', text: 'All admin fields are required' });
    setLoading(true);
    try {
      await api.post('/super-admin/hospital-admins', adminForm);
      setMsg({ type: 'success', text: 'Hospital admin created!' }); setAdminForm({ hospitalId: 0, phone: '', name: '' }); setShowAdminForm(false);
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
    setLoading(false);
  };

  const addUser = async () => {
    if (!userForm.phone) return setMsg({ type: 'error', text: 'Phone is required' });
    if (userForm.phone.length !== 10) return setMsg({ type: 'error', text: 'Phone must be 10 digits' });
    setLoading(true);
    try {
      await api.post('/super-admin/users', userForm);
      setMsg({ type: 'success', text: 'User created!' }); resetUserForm(); setShowAddUser(false); loadUsers();
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
    setLoading(false);
  };

  const updateUser = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      await api.patch(`/super-admin/users/${editingUser.id}`, userForm);
      setMsg({ type: 'success', text: 'User updated!' }); setEditingUser(null); resetUserForm(); setShowAddUser(false); loadUsers();
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
    setLoading(false);
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Delete this user and all their data? This cannot be undone!')) return;
    try {
      await api.delete(`/super-admin/users/${id}`);
      setMsg({ type: 'success', text: 'User deleted' }); loadUsers();
    } catch (e: any) { setMsg({ type: 'error', text: e.response?.data?.error || 'Error' }); }
  };

  const startEditUser = (u: any) => {
    setEditingUser(u);
    setUserForm({ phone: u.phone || '', name: u.name || '', role: u.role || 'PATIENT', hospitalId: u.hospitalId?.toString() || '', age: u.age?.toString() || '', gender: u.gender || '', weight: u.weight?.toString() || '', city: u.city || '' });
    setShowAddUser(true);
  };

  const resetUserForm = () => setUserForm({ phone: '', name: '', role: 'PATIENT', hospitalId: '', age: '', gender: '', weight: '', city: '' });

  const roleColor = (r: string) => {
    switch (r) {
      case 'SUPER_ADMIN': return 'bg-violet-50 text-violet-700';
      case 'HOSPITAL_ADMIN': return 'bg-blue-50 text-blue-700';
      case 'DOCTOR': return 'bg-emerald-50 text-emerald-700';
      case 'PATIENT': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Super Admin</h1>
              <p className="text-[11px] text-gray-400 leading-tight">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Logout">
              <LogOut className="w-4.5 h-4.5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-8">
        {/* Toast */}
        {msg && (
          <div className={`mt-4 px-4 py-3 rounded-xl flex items-center gap-3 animate-slide-up ${msg.type === 'success' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
            {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
            <span className={`text-sm flex-1 ${msg.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{msg.text}</span>
            <button onClick={() => setMsg(null)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
        )}

        {/* Tabs + Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 mb-5 gap-3">
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1 overflow-x-auto">
            <button onClick={() => setTab('list')} className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${tab === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              <Building2 className="w-4 h-4" />Hospitals
            </button>
            <button onClick={() => setTab('create')} className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${tab === 'create' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              <Plus className="w-4 h-4" />Add Hospital
            </button>
            <button onClick={() => setTab('users')} className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${tab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              <Users className="w-4 h-4" />Users
            </button>
          </div>
          <button onClick={() => setShowAdminForm(!showAdminForm)} className="px-4 py-2 bg-violet-50 text-violet-700 rounded-xl text-sm font-semibold hover:bg-violet-100 transition-colors flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" />Assign Admin
          </button>
        </div>

        {/* Admin creation modal */}
        {showAdminForm && (
          <div className="glass-card-dark p-5 mb-5 animate-scale-in">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Create Hospital Admin</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Hospital</label>
                <select value={adminForm.hospitalId} onChange={e => setAdminForm({ ...adminForm, hospitalId: parseInt(e.target.value) })} className="select-field text-sm">
                  <option value={0}>Select hospital</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Phone</label>
                <input placeholder="10-digit phone" value={adminForm.phone} onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                <input placeholder="Admin name" value={adminForm.name} onChange={e => setAdminForm({ ...adminForm, name: e.target.value })} className="input-field text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={createAdmin} disabled={loading} className="btn-primary text-sm px-5 py-2.5">{loading ? 'Creating...' : 'Create Admin'}</button>
              <button onClick={() => setShowAdminForm(false)} className="btn-secondary text-sm px-4 py-2.5">Cancel</button>
            </div>
          </div>
        )}

        {/* Hospital list */}
        {tab === 'list' && (
          <div className="space-y-3">
            {hospitals.length === 0 && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">No hospitals yet</p>
                <button onClick={() => setTab('create')} className="btn-primary mt-4 text-sm px-5 py-2.5">Add First Hospital</button>
              </div>
            )}
            {hospitals.map((h, i) => (
              <div key={h.id} className="glass-card-dark p-5 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${h.isActive ? 'bg-gradient-to-br from-emerald-400 to-emerald-500' : 'bg-gray-200'}`}>
                    <Building2 className={`w-5 h-5 ${h.isActive ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{h.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{h.address}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{h.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`status-pill ${h.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {h.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => toggleStatus(h.id)} className="p-2 hover:bg-amber-50 rounded-lg transition-colors" title="Toggle status">
                    <Power className={`w-4 h-4 ${h.isActive ? 'text-amber-500' : 'text-gray-400'}`} />
                  </button>
                  <button onClick={() => deleteHospital(h.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create hospital */}
        {tab === 'create' && (
          <div className="glass-card-dark p-6 max-w-xl animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-5">New Hospital</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Hospital Name</label>
                <input placeholder="e.g. City General Hospital" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Address</label>
                <input placeholder="Full address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone</label>
                <input placeholder="Hospital phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
              </div>
              <button onClick={createHospital} disabled={loading} className="btn-primary w-full py-3.5 text-base">
                {loading ? 'Creating...' : 'Create Hospital'}
              </button>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'Total Users', value: userStats.total, bg: 'bg-blue-50', text: 'text-blue-700' },
                { label: 'Patients', value: userStats.patients, bg: 'bg-gray-100', text: 'text-gray-700' },
                { label: 'Doctors', value: userStats.doctors, bg: 'bg-emerald-50', text: 'text-emerald-700' },
                { label: 'Admins', value: userStats.admins, bg: 'bg-violet-50', text: 'text-violet-700' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 sm:p-4`}>
                  <div className={`text-xl sm:text-2xl font-extrabold ${s.text}`}>{s.value}</div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Search + Filter + Add */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input placeholder="Search by name or phone..."
                  value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadUsers()}
                  className="input-field pl-10 text-sm" />
              </div>
              <div className="relative">
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select value={userRoleFilter} onChange={e => { setUserRoleFilter(e.target.value); }} className="select-field text-sm pr-9">
                  <option value="ALL">All Roles</option>
                  <option value="PATIENT">Patients</option>
                  <option value="DOCTOR">Doctors</option>
                  <option value="HOSPITAL_ADMIN">Hospital Admins</option>
                  <option value="SUPER_ADMIN">Super Admins</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={loadUsers} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                  <Search className="w-4 h-4" />Search
                </button>
                <button onClick={() => { setEditingUser(null); resetUserForm(); setShowAddUser(!showAddUser); }}
                  className="px-4 py-2.5 bg-violet-50 text-violet-700 rounded-xl text-sm font-semibold hover:bg-violet-100 transition-colors flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />Add User
                </button>
              </div>
            </div>

            {/* Add/Edit User Form */}
            {showAddUser && (
              <div className="glass-card-dark p-5 animate-scale-in">
                <h3 className="text-sm font-bold text-gray-900 mb-3">{editingUser ? 'Edit User' : 'New User'}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Phone *</label>
                    <input placeholder="10-digit phone" value={userForm.phone}
                      onChange={e => setUserForm({ ...userForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      maxLength={10} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Name</label>
                    <input placeholder="Name" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Role</label>
                    <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="select-field text-sm">
                      <option value="PATIENT">Patient</option>
                      <option value="DOCTOR">Doctor</option>
                      <option value="HOSPITAL_ADMIN">Hospital Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Hospital</label>
                    <select value={userForm.hospitalId} onChange={e => setUserForm({ ...userForm, hospitalId: e.target.value })} className="select-field text-sm">
                      <option value="">None</option>
                      {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Age</label>
                    <input placeholder="Age" type="number" value={userForm.age} onChange={e => setUserForm({ ...userForm, age: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Gender</label>
                    <select value={userForm.gender} onChange={e => setUserForm({ ...userForm, gender: e.target.value })} className="select-field text-sm">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Weight (kg)</label>
                    <input placeholder="Weight" type="number" value={userForm.weight} onChange={e => setUserForm({ ...userForm, weight: e.target.value })} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">City</label>
                    <input placeholder="City" value={userForm.city} onChange={e => setUserForm({ ...userForm, city: e.target.value })} className="input-field text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={editingUser ? updateUser : addUser} disabled={loading}
                    className="btn-primary text-sm px-5 py-2.5">{loading ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}</button>
                  <button onClick={() => { setShowAddUser(false); setEditingUser(null); }} className="btn-secondary text-sm px-4 py-2.5">Cancel</button>
                </div>
              </div>
            )}

            {/* User List */}
            {users.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-7 h-7 text-gray-300" /></div>
                <p className="text-gray-400 font-medium">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">{users.length} user{users.length !== 1 ? 's' : ''}</p>
                {users.map((u: any, i: number) => (
                  <div key={u.id} className="glass-card-dark p-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        u.role === 'SUPER_ADMIN' ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' :
                        u.role === 'HOSPITAL_ADMIN' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white' :
                        u.role === 'DOCTOR' ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white' :
                        'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                      }`}>
                        {(u.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-gray-900 truncate">{u.name || 'Unnamed'}</h4>
                          <span className={`status-pill text-[10px] ${roleColor(u.role)}`}>{u.role.replace('_', ' ')}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><Phone className="w-3 h-3" />{u.phone}</span>
                          {u.age && <span className="text-[11px] text-gray-400">{u.age}y</span>}
                          {u.gender && <span className="text-[11px] text-gray-400">{u.gender}</span>}
                          {u.city && <span className="text-[11px] text-gray-400">{u.city}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {u.role !== 'SUPER_ADMIN' && (
                        <>
                          <button onClick={() => startEditUser(u)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Edit3 className="w-4 h-4 text-blue-400" />
                          </button>
                          <button onClick={() => deleteUser(u.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
