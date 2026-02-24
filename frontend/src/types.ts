export interface User {
  id: number;
  phone: string;
  name?: string;
  role: 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'PATIENT';
  hospitalId?: number;
  age?: number;
  gender?: string;
  weight?: number;
  city?: string;
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  isActive: boolean;
  _count?: {
    doctors: number;
    appointments: number;
  };
}

export interface Doctor {
  id: number;
  userId: number;
  hospitalId: number;
  name: string;
  specialization: string;
  consultationFee: number;
  dailyTokenLimit: number;
  isActive: boolean;
  user?: {
    id: number;
    name: string;
    phone: string;
  };
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  hospitalId: number;
  appointmentDate: string;
  tokenNumber: number;
  status: 'PENDING' | 'BOOKED' | 'CALLED' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  patient?: {
    id: number;
    name: string;
    phone: string;
    age?: number;
    gender?: string;
    weight?: number;
    city?: string;
  };
  doctor?: {
    id: number;
    specialization: string;
    consultationFee: number;
    user?: {
      id: number;
      name: string;
      phone: string;
    };
  };
  hospital?: {
    id: number;
    name: string;
    city: string;
  };
}

export interface Payment {
  id: number;
  appointmentId: number;
  amount: number;
  provider: string;
  providerPaymentId: string;
  status: string;
}
