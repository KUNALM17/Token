export interface User {
  id: string;
  phone: string;
  name?: string;
  role: 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'PATIENT';
  hospitalId?: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  consultationFee: number;
  dailyTokenLimit: number;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  appointmentDate: string;
  tokenNumber: number;
  status: 'BOOKED' | 'CALLED' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}
