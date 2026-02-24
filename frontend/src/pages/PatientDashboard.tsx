import React, { useState, useEffect } from 'react';
import API from '../api';
import { Hospital, Appointment } from '../types';
import { MapPin, Users, Calendar, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';

interface DoctorInfo {
  id: number;
  name: string;
  specialization: string;
  consultationFee: number;
  dailyTokenLimit: number;
}

declare global {
  interface Window { Razorpay: any; }
}

export const PatientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<number | null>(null);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchHospitals();
    if (activeTab === 'history') fetchMyAppointments();
  }, [activeTab]);

  // Load Razorpay script
  useEffect(() => {
    if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const showMessage = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 5000);
  };

  const fetchHospitals = async () => {
    try {
      const response = await API.get('/patient/hospitals');
      setHospitals(response.data.hospitals);
    } catch (err: any) {
      showMessage('Failed to load hospitals', true);
    }
  };

  const fetchDoctors = async (hospitalId: number) => {
    try {
      const response = await API.get(`/patient/hospitals/${hospitalId}/doctors`);
      setDoctors(response.data.doctors);
      setSelectedDoctor(null);
      setAvailability(null);
    } catch (err: any) {
      showMessage('Failed to load doctors', true);
    }
  };

  const checkAvailability = async (doctorId: number) => {
    try {
      setSelectedDoctor(doctorId);
      const response = await API.get(`/patient/doctors/${doctorId}/availability?date=${selectedDate}`);
      setAvailability(response.data);
    } catch (err: any) {
      showMessage('Failed to check availability', true);
    }
  };

  const bookAndPay = async () => {
    if (!selectedDoctor || !selectedHospital) return;
    try {
      setLoading(true);

      // Step 1: Create appointment (status = PENDING)
      const bookRes = await API.post('/patient/appointments/book', {
        doctorId: selectedDoctor,
        hospitalId: selectedHospital,
        appointmentDate: selectedDate,
      });

      const appointment = bookRes.data.appointment;
      const appointmentId = appointment.id;

      // Step 2: Demo Pay — instantly marks as PAID + BOOKED
      try {
        const payRes = await API.post('/payments/demo-pay', { appointmentId });
        showMessage(payRes.data.message || `✅ Payment successful! Token #${appointment.tokenNumber} is confirmed.`);
        setAvailability(null);
        setSelectedDoctor(null);
        setSelectedHospital(null);
        setDoctors([]);
        setActiveTab('history');
      } catch (err: any) {
        showMessage('Appointment created but payment failed. You can pay from My Appointments.', true);
        setActiveTab('history');
      }
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Failed to book appointment', true);
    } finally {
      setLoading(false);
    }
  };

  const payForAppointment = async (appointmentId: number) => {
    try {
      const payRes = await API.post('/payments/demo-pay', { appointmentId });
      showMessage(payRes.data.message || '✅ Payment successful! Appointment confirmed.');
      fetchMyAppointments();
    } catch (err: any) {
      showMessage(err.response?.data?.error || 'Payment failed', true);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const response = await API.get('/patient/appointments/my');
      setAppointments(response.data.appointments);
    } catch (err: any) {
      showMessage('Failed to load appointments', true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Patient Portal</h1>
        <p className="text-gray-500 mb-6">Book appointments and pay to confirm your token</p>

        {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>}

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setActiveTab('book')}
            className={`px-5 py-2.5 rounded-lg font-medium transition ${
              activeTab === 'book' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}>
            📋 Book Appointment
          </button>
          <button onClick={() => { setActiveTab('history'); fetchMyAppointments(); }}
            className={`px-5 py-2.5 rounded-lg font-medium transition ${
              activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}>
            📜 My Appointments
          </button>
        </div>

        {/* Book Appointment */}
        {activeTab === 'book' && (
          <div className="space-y-5">
            {/* Step 1: Select Hospital */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-blue-600" /> Step 1: Select Hospital
              </h2>
              {hospitals.length === 0 ? (
                <p className="text-gray-400">No hospitals available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {hospitals.map((hospital) => (
                    <button key={hospital.id}
                      onClick={() => { setSelectedHospital(hospital.id); fetchDoctors(hospital.id); }}
                      className={`p-4 rounded-lg border-2 transition text-left ${
                        selectedHospital === hospital.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      }`}>
                      <p className="font-bold text-gray-800">{hospital.name}</p>
                      <p className="text-sm text-gray-500">{hospital.city}, {hospital.state}</p>
                      <p className="text-xs text-gray-400 mt-1">{hospital.address}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Select Doctor */}
            {selectedHospital && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users size={20} className="text-blue-600" /> Step 2: Select Doctor
                </h2>
                {doctors.length === 0 ? (
                  <p className="text-gray-400">No doctors available at this hospital</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {doctors.map((doctor) => (
                      <button key={doctor.id}
                        onClick={() => checkAvailability(doctor.id)}
                        className={`p-4 rounded-lg border-2 transition text-left ${
                          selectedDoctor === doctor.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}>
                        <p className="font-bold text-gray-800">{doctor.name}</p>
                        <p className="text-sm text-gray-500">{doctor.specialization}</p>
                        <p className="text-sm text-green-600 mt-1 font-medium">₹{doctor.consultationFee}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{doctor.dailyTokenLimit} tokens/day</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Date & Pay to Book */}
            {selectedHospital && selectedDoctor && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-blue-600" /> Step 3: Select Date & Pay
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                  <input type="date" value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setAvailability(null);
                      if (selectedDoctor) checkAvailability(selectedDoctor);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                {availability && (
                  <div className={`rounded-lg p-5 ${availability.isAvailable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-800">{availability.doctor.name}</p>
                        <p className="text-sm text-gray-500">{availability.doctor.specialization}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{availability.availableSlots}</p>
                        <p className="text-xs text-gray-500">slots available</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        {availability.appointmentCount} / {availability.doctor.dailyTokenLimit} tokens booked
                      </p>
                      <p className="font-bold text-green-700">₹{availability.doctor.consultationFee}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                      <AlertCircle size={16} className="text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-700">
                        🧪 <b>Test Mode:</b> Payment will be simulated instantly. In production, you'll be redirected to Razorpay to pay ₹{availability.doctor.consultationFee}.
                      </p>
                    </div>

                    <button onClick={bookAndPay}
                      disabled={!availability.isAvailable || loading}
                      className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                        availability.isAvailable
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}>
                      <CreditCard size={18} />
                      {loading ? 'Processing...' : availability.isAvailable ? `Pay ₹${availability.doctor.consultationFee} & Book Token` : 'No Slots Available'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* My Appointments */}
        {activeTab === 'history' && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={fetchMyAppointments}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition text-sm font-medium">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 text-lg">No appointments yet. Book your first appointment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Token</p>
                        <p className="text-3xl font-bold text-blue-600">#{apt.tokenNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Doctor</p>
                        <p className="font-medium text-gray-800">{apt.doctor?.user?.name || 'Doctor'}</p>
                        <p className="text-xs text-gray-400">{apt.doctor?.specialization}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Date</p>
                        <p className="font-medium text-gray-800">{apt.appointmentDate}</p>
                        <p className="text-xs text-gray-400">{apt.hospital?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs uppercase">Status</p>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          apt.status === 'BOOKED' ? 'bg-blue-100 text-blue-700' :
                          apt.status === 'CALLED' ? 'bg-purple-100 text-purple-700' :
                          apt.status === 'SKIPPED' ? 'bg-red-100 text-red-700' :
                          apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {apt.status === 'PENDING' ? '⏳ Awaiting Payment' :
                           apt.status === 'BOOKED' ? '✓ Confirmed' :
                           apt.status === 'CALLED' ? '📣 Your Turn!' :
                           apt.status}
                        </span>
                      </div>
                      <div>
                        {apt.paymentStatus === 'PENDING' && apt.status === 'PENDING' ? (
                          <button onClick={() => payForAppointment(apt.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition flex items-center gap-1">
                            <CreditCard size={14} /> Pay Now
                          </button>
                        ) : (
                          <>
                            <p className="text-gray-400 text-xs uppercase">Payment</p>
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                              apt.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>{apt.paymentStatus === 'PAID' ? '✓ Paid' : apt.paymentStatus}</span>
                          </>
                        )}
                      </div>
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
};
