import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Phone, Lock, Clock, CreditCard, Users, Shield, Activity, ArrowRight, CheckCircle2, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme';

export const LoginPage: React.FC = () => {
  const { theme, toggle, isDark } = useTheme();
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [displayOtp, setDisplayOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await API.post('/auth/send-otp', { phone });
      setDisplayOtp(res.data.otp || '');
      setIsNewUser(res.data.isNewUser);
      setStep('otp');
      if (!res.data.otp) setError('');
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewUser) { setStep('register'); return; }
    await doLogin();
  };

  const doLogin = async () => {
    setLoading(true); setError('');
    try {
      const res = await API.post('/auth/verify-otp', { phone, otp, name: name || undefined, age: age || undefined, gender: gender || undefined, weight: weight || undefined, city: city || undefined });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      const role = res.data.user.role;
      if (role === 'SUPER_ADMIN') navigate('/super-admin');
      else if (role === 'HOSPITAL_ADMIN') navigate('/admin');
      else if (role === 'DOCTOR') navigate('/doctor');
      else navigate('/patient');
    } catch (err: any) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  };

  // ── LANDING PAGE ──
  if (!showLogin) return (
    <div className={`min-h-screen overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0b0f1a]' : 'bg-gradient-to-b from-slate-50 via-white to-blue-50'}`}>
      {/* Floating orbs background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-500/[0.07]' : 'bg-blue-400/10'}`} />
        <div className={`absolute top-1/3 -left-20 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/[0.06]' : 'bg-indigo-400/10'}`} />
        <div className={`absolute bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-emerald-500/[0.04]' : 'bg-emerald-400/[0.08]'}`} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Token<span className="text-blue-500">Q</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className={`p-2.5 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-white/[0.06] text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`} title="Toggle theme">
            {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
          <button onClick={() => setShowLogin(true)} className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.97] ${isDark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 border rounded-full text-sm font-medium mb-8 animate-fade-in ${isDark ? 'bg-blue-500/[0.08] border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
            <Sparkles className="w-4 h-4" />
            Smart Hospital Queue Management
          </div>
          <h1 className={`text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6 animate-slide-up ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Skip the Wait,
            <br />
            <span className={`bg-clip-text text-transparent ${isDark ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600'}`}>
              Not the Care
            </span>
          </h1>
          <p className={`text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto animate-slide-up ${isDark ? 'text-slate-400' : 'text-gray-500'}`} style={{ animationDelay: '0.1s' }}>
            Book appointments, pay instantly, and track your token in real-time. 
            No more sitting in crowded waiting rooms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button onClick={() => setShowLogin(true)} className={`group px-8 py-4 text-white text-lg font-bold rounded-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-2 ${isDark ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 shadow-xl shadow-blue-500/15' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/25'}`}>
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-24">
          {[
            { icon: <Clock className="w-6 h-6" />, title: 'Digital Tokens', desc: 'Get your token instantly after payment', color: 'from-blue-500 to-blue-600', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50', iconColor: 'text-blue-500' },
            { icon: <CreditCard className="w-6 h-6" />, title: 'Instant Payment', desc: 'Pay consultation fees in one tap', color: 'from-emerald-500 to-emerald-600', bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50', iconColor: 'text-emerald-500' },
            { icon: <Users className="w-6 h-6" />, title: 'Live Queue', desc: 'Track your position in real-time', color: 'from-violet-500 to-violet-600', bg: isDark ? 'bg-violet-500/10' : 'bg-violet-50', iconColor: 'text-violet-500' },
            { icon: <Shield className="w-6 h-6" />, title: 'OTP Login', desc: 'Secure passwordless authentication', color: 'from-amber-500 to-amber-600', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50', iconColor: 'text-amber-500' },
          ].map((f, i) => (
            <div key={i} className="group glass-card-dark p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
              <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <div className={f.iconColor}>{f.icon}</div>
              </div>
              <h3 className={`font-bold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-28 text-center">
          <h2 className={`text-3xl md:text-4xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>How It Works</h2>
          <p className={`mb-12 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Three simple steps to see your doctor</p>
          <div className="flex flex-col md:flex-row justify-center gap-8 max-w-3xl mx-auto">
            {[
              { step: '01', label: 'Book Online', desc: 'Choose hospital, doctor & shift', emoji: '📱' },
              { step: '02', label: 'Pay Instantly', desc: 'Complete payment to get your token', emoji: '💳' },
              { step: '03', label: 'Walk In', desc: 'Track queue & visit when called', emoji: '🏥' },
            ].map((s, i) => (
              <div key={i} className="flex-1 relative">
                <div className="glass-card-dark p-6 text-center hover:shadow-xl transition-all">
                  <div className="text-4xl mb-3">{s.emoji}</div>
                  <div className={`text-xs font-bold tracking-widest mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>STEP {s.step}</div>
                  <h3 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.label}</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{s.desc}</p>
                </div>
                {i < 2 && <div className={`hidden md:block absolute top-1/2 -right-5 text-2xl ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative z-10 py-8 text-center text-sm ${isDark ? 'border-t border-white/[0.06] text-slate-500' : 'border-t border-gray-100 text-gray-400'}`}>
        <p>© 2026 TokenQ — Built for modern healthcare</p>
      </footer>
    </div>
  );

  // ── LOGIN FORM ──
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0b0f1a]' : 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950'}`}>
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-500/[0.06]' : 'bg-blue-500/10'}`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/[0.05]' : 'bg-indigo-500/10'}`} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className={`backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border transition-colors duration-300 ${isDark ? 'bg-[#111827]/95 border-white/[0.06]' : 'bg-white/95 border-white/20'}`}>
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome to Token<span className="text-blue-500">Q</span></h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Sign in with your phone number</p>
          </div>

          {error && (
            <div className={`px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2 animate-scale-in ${isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-100 text-red-600'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>!</div>
              {error}
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className={`text-sm font-medium mb-1.5 block ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Phone Number</label>
                <div className={`flex items-center rounded-xl px-4 py-3 transition-all ${isDark ? 'bg-white/[0.04] border border-white/[0.08] focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:border-blue-500/30' : 'bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-400'}`}>
                  <Phone size={18} className={`mr-3 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                  <span className={`mr-2 font-medium ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>+91</span>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} placeholder="Enter 10-digit number" maxLength={10} className={`flex-1 bg-transparent outline-none ${isDark ? 'text-white placeholder:text-slate-500' : 'text-gray-900 placeholder:text-gray-400'}`} required />
                </div>
              </div>
              <button type="submit" disabled={loading || phone.length !== 10} className="btn-primary w-full py-3.5 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span>
                ) : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className={`text-sm font-medium mb-1.5 block ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Enter OTP</label>
                <div className={`flex items-center rounded-xl px-4 py-3 transition-all ${isDark ? 'bg-white/[0.04] border border-white/[0.08] focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:border-blue-500/30' : 'bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-400'}`}>
                  <Lock size={18} className={`mr-3 flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit OTP" maxLength={6} className={`flex-1 bg-transparent outline-none tracking-[0.3em] font-mono font-bold text-lg placeholder:tracking-normal placeholder:font-normal placeholder:text-sm ${isDark ? 'text-white placeholder:text-slate-500' : 'text-gray-900 placeholder:text-gray-400'}`} required />
                </div>
              </div>
              {displayOtp ? (
                <div className={`rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 ${isDark ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-amber-50 border border-amber-100 text-amber-700'}`}>
                  <span className={isDark ? 'text-amber-400' : 'text-amber-500'}>⚡</span>
                  Dev OTP: <span className="font-mono font-bold tracking-widest">{displayOtp}</span>
                </div>
              ) : (
                <div className={`rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'}`}>
                  <span className={isDark ? 'text-emerald-400' : 'text-emerald-500'}>✓</span>
                  OTP sent to <span className="font-semibold">+91 {phone}</span>
                </div>
              )}
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3.5 text-base">
                {loading ? (
                  <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</span>
                ) : 'Verify & Continue'}
              </button>
              <button type="button" onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="btn-secondary w-full">
                ← Back
              </button>
            </form>
          )}

          {step === 'register' && (
            <form onSubmit={(e) => { e.preventDefault(); doLogin(); }} className="space-y-3">
              <div className={`rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 mb-4 ${isDark ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-blue-50 border border-blue-100 text-blue-700'}`}>
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                OTP verified! Complete your profile to continue.
              </div>
              <div>
                <label className={`text-sm font-medium mb-1.5 block ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Full Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Age</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" className="input-field" />
                </div>
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className="select-field">
                    <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Weight (kg)</label>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Weight" className="input-field" />
                </div>
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="input-field" />
                </div>
              </div>
              <button type="submit" disabled={loading || !name} className="btn-success w-full py-3.5 text-base mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</span>
                ) : 'Create Account & Continue'}
              </button>
            </form>
          )}
        </div>

        <button onClick={() => { setShowLogin(false); setStep('phone'); setError(''); }} className={`mt-6 text-sm w-full text-center transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-white/50 hover:text-white/80'}`}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
};
