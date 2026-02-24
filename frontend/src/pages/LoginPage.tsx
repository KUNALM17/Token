import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { Phone, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayOtp, setDisplayOtp] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await API.post('/auth/send-otp', { phone });
      setDisplayOtp(response.data.otp || '');
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

    try {
      const response = await API.post('/auth/verify-otp', {
        phone,
        otp,
        name: name || undefined,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect based on role
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Hospital Token</h1>
          <p className="text-gray-600 mt-2">Appointment System</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                <Phone size={20} className="text-gray-400 mr-2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  className="flex-1 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OTP
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                <Lock size={20} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="flex-1 outline-none"
                  required
                />
              </div>
              {displayOtp && (
                <p className="text-sm text-gray-500 mt-1">OTP (dev): {displayOtp}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setName('');
              }}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
