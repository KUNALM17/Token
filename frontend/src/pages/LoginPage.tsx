import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Phone, Lock, Clock, Shield, CreditCard, Users, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [view, setView] = useState<'landing' | 'login'>('landing');
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayOtp, setDisplayOtp] = useState('');

  // Registration fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [city, setCity] = useState('');

  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await API.post('/auth/send-otp', { phone });
      setDisplayOtp(response.data.otp || '');
      setIsNewUser(response.data.isNewUser);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // If new user, show registration form first
    if (isNewUser && step === 'otp') {
      setStep('register');
      setLoading(false);
      return;
    }

    try {
      const payload: any = { phone, otp };
      if (isNewUser) {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        payload.name = name;
        payload.age = age || undefined;
        payload.gender = gender || undefined;
        payload.weight = weight || undefined;
        payload.city = city || undefined;
      }

      const response = await API.post('/auth/verify-otp', payload);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const role = response.data.user.role;
      if (role === 'SUPER_ADMIN') navigate('/super-admin');
      else if (role === 'HOSPITAL_ADMIN') navigate('/admin');
      else if (role === 'DOCTOR') navigate('/doctor');
      else navigate('/patient');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // Landing page
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Hero */}
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-12">
          <nav className="flex justify-between items-center mb-20">
            <span className="text-2xl font-bold text-white">🏥 TokenQueue</span>
            <button onClick={() => setView('login')}
              className="bg-white text-blue-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2">
              Login <ArrowRight size={16} />
            </button>
          </nav>

          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Skip the Wait,<br />Not the Care
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
              Book hospital appointments online, get a digital token number, and track your queue position in real-time. No more waiting in long lines!
            </p>
            <button onClick={() => setView('login')}
              className="bg-white text-blue-700 px-10 py-4 rounded-xl text-lg font-bold hover:bg-blue-50 transition shadow-xl shadow-blue-900/20">
              Get Started →
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: <Clock size={28} />, title: 'Real-time Queue', desc: 'Track your token position live' },
              { icon: <CreditCard size={28} />, title: 'Online Payment', desc: 'Pay consultation fees securely via Razorpay' },
              { icon: <Users size={28} />, title: 'Choose Your Doctor', desc: 'Browse specialists & book appointments' },
              { icon: <Shield size={28} />, title: 'OTP Login', desc: 'Secure phone-based authentication' },
            ].map((f, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                <div className="text-white mb-3 flex justify-center">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-1">{f.title}</h3>
                <p className="text-blue-200 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* How it Works */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Login', desc: 'Enter your phone number & verify with OTP' },
                { step: '2', title: 'Select Hospital', desc: 'Choose from nearby registered hospitals' },
                { step: '3', title: 'Pick a Doctor', desc: 'Select a specialist and your preferred date' },
                { step: '4', title: 'Get Token', desc: 'Pay online and receive your queue token number' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 bg-white text-blue-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-blue-200 text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12 text-blue-200 text-sm">
            © 2026 TokenQueue · Hospital Token Management System
          </div>
        </div>
      </div>
    );
  }

  // Login/Register form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button onClick={() => { setView('landing'); setStep('phone'); setError(''); }}
          className="text-gray-400 hover:text-gray-600 text-sm mb-4 flex items-center gap-1">
          ← Back to home
        </button>

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🏥 TokenQueue</h1>
          <p className="text-gray-500 mt-1">
            {step === 'register' ? 'Complete Your Profile' : 'Login with Phone OTP'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <Phone size={18} className="text-gray-400 mr-2" />
                <span className="text-gray-400 mr-1">+91</span>
                <input type="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210" maxLength={10}
                  className="flex-1 outline-none" required />
              </div>
            </div>
            <button type="submit" disabled={loading || phone.length !== 10}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition font-semibold">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500">
                <Lock size={18} className="text-gray-400 mr-2" />
                <input type="text" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6}
                  className="flex-1 outline-none tracking-widest text-lg font-mono" required />
              </div>
              {displayOtp && (
                <p className="text-xs text-gray-400 mt-1 bg-gray-50 p-2 rounded">🔑 Dev OTP: <span className="font-mono font-bold">{displayOtp}</span></p>
              )}
            </div>
            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition font-semibold">
              {loading ? 'Verifying...' : isNewUser ? 'Continue →' : 'Verify & Login'}
            </button>
            <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm">
              ← Change Number
            </button>
          </form>
        )}

        {step === 'register' && (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mb-2">
              👋 Welcome! Since you're new, please fill in your details.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)}
                  placeholder="25" min="1" max="120"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                  placeholder="70" min="1" max="300"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={loading || !name.trim()}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition font-semibold mt-2">
              {loading ? 'Creating Account...' : '✓ Register & Login'}
            </button>
            <button type="button" onClick={() => setStep('otp')}
              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition text-sm">
              ← Back
            </button>
          </form>
        )}

        {step !== 'register' && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Login with your registered phone. New users will be asked to fill profile details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
