// src/app/interfaces/models.ts

export type AuthMode = 'login' | 'register';
export type UserRole = 'patient' | 'doctor';
export type DashboardTab = 'book' | 'upcoming' | 'past' | 'profile' | 'office' | 'family';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  specialty_id?: number;
  license_number?: string;
  created_at: string;
  specialties?: Specialty;
  guardian_id?: string;
}

export interface Specialty {
  id: number;
  name: string;
  description?: string;
}

export interface Schedule {
  id: number;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Appointment {
  id: number;
  patient_id: string;
  doctor_id: string;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'canceled' | 'cancelled'; // <-- AGREGADO 'cancelled'
  diagnosis?: string;
  rating?: number;
  feedback?: string;
  created_at: string;
  doctor?: { full_name: string; specialties?: { name: string } };
  patient?: { full_name: string; };
  prescriptions?: { id: number }[];
}

export interface Prescription {
  id: number;
  appointment_id: number;
  patient_id: string;
  doctor_id: string;
  created_at: string;
  items: PrescriptionItem[];
  patient?: { full_name: string };
  doctor?: { full_name: string };
}

export interface PrescriptionItem {
  id: number;
  prescription_id: number;
  medication: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}

export interface PrescriptionState {
  appointment: Appointment;
  items: Partial<PrescriptionItem>[];
}

export interface Dependent {
  id: string;
  full_name: string;
  guardian_id: string;
}
