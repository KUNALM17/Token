import React, { useState, useEffect } from 'react';
import API from '../api';
import { Hospital, Doctor, Appointment } from '../types';
import { MapPin, Users, Calendar, CreditCard } from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availability, setAvailability] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHospitals();
    if (activeTab === 'history') {
      fetchMyAppointments();
    }
  }, [activeTab]);

  const fetchHospitals = async () => {
    try {
      const response = await API.get('/patient/hospitals');
      setHospitals(response.data.hospitals);
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    }
  };

  const fetchDoctors = async (hospitalId: string) => {
    try {
      const response = await API.get(`/patient/hospitals/${hospitalId}/doctors`);
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const checkAvailability = async (doctorId: string) => {
    try {
      const response = await API.get(`/patient/doctors/${doctorId}/availability?date=${selectedDate}`);
      setAvailability(response.data);
    } catch (error) {
      console.error('Failed to check availability:', error);
    }
  };

  const bookAppointment = async (doctorId: string) => {
    try {
      setLoading(true);
      const response = await API.post('/patient/appointments/book', {
        doctorId,
        hospitalId: selectedHospital,
        appointmentDate: selectedDate,
      });

      // Redirect to payment
      if (response.data.appointment.paymentStatus === 'PENDING') {
        window.location.href = `/payment/${response.data.appointment.id}`;
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const response = await API.get('/patient/appointments/my');
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Patient Portal</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'book'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            Book Appointment
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            My Appointments
          </button>
        </div>

        {/* Book Appointment */}
        {activeTab === 'book' && (
          <div className="space-y-6">
            {/* Step 1: Select Hospital */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <MapPin className="mr-2" /> Select Hospital
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitals.map((hospital) => (
                  <button
                    key={hospital.id}
                    onClick={() => {
                      setSelectedHospital(hospital.id);
                      fetchDoctors(hospital.id);
                    }}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      selectedHospital === hospital.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-bold text-gray-800">{hospital.name}</p>
                    <p className="text-sm text-gray-600">{hospital.city}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Doctor */}
            {selectedHospital && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Users className="mr-2" /> Select Doctor
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => checkAvailability(doctor.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left"
                    >
                      <p className="font-bold text-gray-800">{doctor.name}</p>
                      <p className="text-sm text-gray-600">{doctor.specialization}</p>
                      <p className="text-sm text-green-600 mt-2">
                        ₹{doctor.consultationFee} per consultation
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Select Date & Confirm */}
            {selectedHospital && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Calendar className="mr-2" /> Select Date
                </h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setAvailability(null);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="border border-gray-300 rounded px-4 py-2 mb-4"
                />

                {availability && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-semibold text-blue-900 mb-2">
                      Availability: {availability.availableSlots} slots remaining
                    </p>
                    <p className="text-sm text-blue-700 mb-4">
                      {availability.appointmentCount} of {availability.doctor.dailyTokenLimit} slots booked
                    </p>
                    <button
                      onClick={() => bookAppointment(availability.doctor.id)}
                      disabled={!availability.isAvailable || loading}
                      className={`w-full py-3 rounded-lg font-semibold transition flex items-center justify-center ${
                        availability.isAvailable
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <CreditCard size={20} className="mr-2" />
                      {loading ? 'Booking...' : 'Proceed to Payment'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* My Appointments */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-600 text-lg">No appointments yet</p>
              </div>
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Token Number</p>
                      <p className="text-2xl font-bold text-blue-600">#{apt.tokenNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Date</p>
                      <p className="font-semibold">{apt.appointmentDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Status</p>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                          apt.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : apt.status === 'CALLED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Payment</p>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                          apt.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {apt.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
