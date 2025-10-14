import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { Appointment } from '../interfaces/models';
import { Logger } from '../utils/logger';

@Injectable({ providedIn: 'root' })
export class AppointmentDAO {
  private supabase = inject(SupabaseService).supabase;

  async getByPatientId(patientId: string): Promise<Appointment[]> {
    // 1. Obtener IDs de dependientes del usuario
    const { data: dependents } = await this.supabase
      .from('dependents')
      .select('id')
      .eq('guardian_id', patientId);
    
    const dependentIds = dependents?.map(d => d.id) || [];
    
    // 2. Crear array con el ID del usuario + IDs de dependientes
    const allPatientIds = [patientId, ...dependentIds];
    
    Logger.log('👨‍👩‍👧‍👦 Buscando citas para:', allPatientIds);
    
    // 3. Obtener citas del usuario Y sus dependientes
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*, prescriptions(id)')
      .in('patient_id', allPatientIds);  // <-- Cambio clave: usar 'in' en lugar de 'eq'
      
    if (error) {
      console.error('Error fetching patient appointments:', error.message);
      return [];
    }
    
    // 4. Obtener datos de doctores manualmente
    if (data && data.length > 0) {
      const doctorIds = [...new Set(data.map(apt => apt.doctor_id))];
      const { data: doctors } = await this.supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', doctorIds);
      
      // 5. Obtener nombres de pacientes (usuarios + dependientes)
      const patientIdsInAppointments = [...new Set(data.map(apt => apt.patient_id))];
      
      // Intentar obtener de profiles primero
      const { data: profiles } = await this.supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', patientIdsInAppointments);
      
      // Para los que no están en profiles, buscar en dependents
      const missingIds = patientIdsInAppointments.filter(id => !profiles?.some(p => p.id === id));
      let dependentsData: Array<{ id: string; full_name: string }> = [];
      
      if (missingIds.length > 0) {
        const { data: deps } = await this.supabase
          .from('dependents')
          .select('id, full_name')
          .in('id', missingIds);
        dependentsData = deps || [];
      }
      
      const allPatients = [...(profiles || []), ...dependentsData];
        
      return data.map(apt => ({
        ...apt,
        doctor: doctors?.find(d => d.id === apt.doctor_id) || null,
        patient: allPatients.find(p => p.id === apt.patient_id) || { full_name: 'Desconocido' }
      }));
    }
    
    return data || [];
  }

  async getByDoctorId(doctorId: string): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from('appointments')
      .select('*, prescriptions(id)')
      .eq('doctor_id', doctorId);
      
    if (error) {
      console.error('Error fetching doctor appointments:', error.message);
      return [];
    }
    
    if (data && data.length > 0) {
      const patientIds = [...new Set(data.map(apt => apt.patient_id))];
      
      const { data: profiles } = await this.supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', patientIds);
      
      const missingIds = patientIds.filter(id => !profiles?.some(p => p.id === id));
      let dependents: Array<{ id: string; full_name: string }> = [];
      
      if (missingIds.length > 0) {
        const { data: deps } = await this.supabase
          .from('dependents')
          .select('id, full_name')
          .in('id', missingIds);
        dependents = deps || [];
      }
      
      const allPatients = [...(profiles || []), ...dependents];
      
      return data.map(apt => ({
        ...apt,
        patient: allPatients.find(p => p.id === apt.patient_id) || { full_name: 'Desconocido' }
      }));
    }
    
    return data || [];
  }

  async getBookedSlotsForDoctor(doctorId: string): Promise<string[]> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', doctorId)
      .eq('status', 'scheduled')
      .gte('appointment_time', now);

    if (error) {
      console.error('Error fetching booked slots:', error);
      return [];
    }
    return data.map(apt => new Date(apt.appointment_time).toISOString());
  }

  async create(appointmentData: { 
    patient_id: string, 
    doctor_id: string, 
    appointment_time: string 
  }): Promise<{ data: Appointment | null, error: any }> {
    
    Logger.log('📤 [DAO] Intentando crear cita:', appointmentData);

    try {
      const { data, error } = await this.supabase
        .from('appointments')
        .insert(appointmentData)
        .select('*')
        .single();

      if (error) {
        console.error('❌ [DAO] Error al insertar:', {
          code: error.code,
          message: error.message
        });
        
        if (error.code === '23505') {
          return {
            data: null,
            error: {
              message: 'Este horario ya fue reservado',
              code: 'DUPLICATE_APPOINTMENT',
              details: error.message
            }
          };
        }

        if (error.code === '42501') {
          return {
            data: null,
            error: {
              message: 'No tienes permisos para crear esta cita',
              code: 'PERMISSION_DENIED',
              details: error.message
            }
          };
        }

        return { data: null, error };
      }

      Logger.log('✅ [DAO] Cita creada exitosamente:', data);
      return { data, error: null };

    } catch (exception: any) {
      console.error('❌ [DAO] Excepción:', exception);
      return {
        data: null,
        error: {
          message: 'Error inesperado',
          code: 'UNEXPECTED_ERROR',
          details: exception.message
        }
      };
    }
  }

  async update(appointmentId: number, updates: Partial<Appointment>): Promise<Appointment | null> {
    const { data, error } = await this.supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return null;
    }
    return data;
  }
}
