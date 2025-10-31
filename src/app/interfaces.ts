import { User } from '@supabase/supabase-js';

export interface Specialty {
  id: number;
  name: string;
  description?: string;
}

export interface Profile {
  id: string; // uuid
  email: string;
  full_name?: string;
  role: 'patient' | 'doctor';
  specialty_id?: number;
  specialty_name?: string;
  average_rating?: number;
  license_number?: string;
  created_at?: string;
}

export interface Schedule {
  id?: number;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Appointment {
  id?: number;
  patient_id: string;
  doctor_id: string;
  appointment_time: string; // ISO 8601 string
  status: 'scheduled' | 'completed' | 'canceled';
  rating?: number;
  feedback?: string;
  diagnosis?: string;
  created_at?: string;
  // Propiedades para joins
  doctor?: { full_name: string };
  patient?: { full_name: string };
}

// --- NUEVAS INTERFACES PARA RECETAS ---

export interface Prescription {
  id?: number;
  appointment_id: number;
  patient_id: string;
  doctor_id: string;
  created_at: string;
  // Propiedad para join
  items?: PrescriptionItem[];
}

export interface PrescriptionItem {
  id?: number;
  prescription_id: number;
  medication: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}

// --- FIN DE NUEVAS INTERFACES ---


export interface AppUser extends User {
  profile: Profile | null;
}
