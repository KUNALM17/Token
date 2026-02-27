export interface User {
  id: number;
  phone: string;
  name: string;
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
  phone: string;
  maxBookingDaysAhead?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Doctor {
  id: number;
  userId: number;
  hospitalId: number;
  specialization: string;
  consultationFee: number;
  avgConsultTime?: number;
  isActive: boolean;
  user: User;
  hospital?: Hospital;
  shifts?: DoctorShift[];
}

export interface DoctorShift {
  id: number;
  doctorId: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  tokenLimit: number;
  workingDays?: string;
  isActive: boolean;
  appointmentCount?: number;
  availableSlots?: number;
  isAvailable?: boolean;
  onLeave?: boolean;
  notWorkingDay?: boolean;
  shiftEnded?: boolean;
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  hospitalId: number;
  shiftId?: number;
  tokenNumber: number;
  appointmentDate: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  patient?: User;
  doctor?: Doctor;
  hospital?: Hospital;
  shift?: DoctorShift;
  canReschedule?: boolean;
  canRescheduleUnviewed?: boolean;
  doctorOnLeave?: boolean;
}

export interface LiveStatus {
  currentToken: number;
  yourToken: number;
  tokensAhead: number;
  status: string;
  estimatedWait: string;
  avgConsultTime?: number;
}

export interface Invoice {
  invoiceId: string;
  date: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  specialization: string;
  hospitalName: string;
  hospitalAddress: string;
  shiftName: string;
  shiftTime: string;
  appointmentDate: string;
  tokenNumber: number;
  amount: number;
  paymentMethod: string;
  status: string;
}
