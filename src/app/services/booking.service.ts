// src/app/services/booking.service.ts

import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AppointmentDAO } from '../daos/appointment.dao';
import { ScheduleDAO } from '../daos/schedule.dao';
import { AuthService } from './auth.service';
import { AppointmentService } from './appointment.service';
import { LoadingService } from './loading.service';
import { NotificationService } from './notification.service';
import { SupabaseService } from '../supabase.service';
import { Logger } from '../utils/logger';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private scheduleDAO = inject(ScheduleDAO);
  private appointmentDAO = inject(AppointmentDAO);
  private authService = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private supabaseService = inject(SupabaseService);

  selectedDoctorId = signal<string | null>(null);
  forPatientId = signal<string | null>(null);
  private allAvailableSlots = signal<{ display: string, value: string, date: string }[]>([]);
  selectedDate = signal<string | null>(null);
  selectedSlot = signal<{ display: string, value: string, date: string } | null>(null);
  bookingStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

  availableDays = computed(() => {
    const slots = this.allAvailableSlots();
    const uniqueDays = [...new Set(slots.map(slot => slot.date))];
    return uniqueDays.map(dateStr => new Date(dateStr + 'T00:00:00-05:00'));
  });

  filteredSlotsByDay = computed(() => {
    const allSlots = this.allAvailableSlots();
    const date = this.selectedDate();
    if (!date) return [];
    return allSlots.filter(slot => slot.date === date);
  });

  constructor() {
    effect(() => {
      const doctorId = this.selectedDoctorId();
      this.resetSlotSelection();
      if (doctorId) {
        this.generateAndSetAvailableSlots(doctorId);
      } else {
        this.allAvailableSlots.set([]);
      }
    });
  }

  private async generateAndSetAvailableSlots(doctorId: string) {
    this.loadingService.show();
    try {
      const schedules = await this.scheduleDAO.getByDoctorId(doctorId);
      const bookedTimes = await this.appointmentDAO.getBookedSlotsForDoctor(doctorId);
      
      const slots: { display: string, value: string, date: string }[] = [];
      const now = new Date();
      
      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(now.getDate() + i);
        const dayOfWeek = date.getDay();
        
        const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek);
        if (daySchedule) {
          const appointmentDuration = 30;
          const [startHour, startMinute] = daySchedule.start_time.split(':').map(Number);
          const [endHour, endMinute] = daySchedule.end_time.split(':').map(Number);

          let slotTime = new Date(date);
          slotTime.setHours(startHour, startMinute, 0, 0);

          const endTime = new Date(date);
          endTime.setHours(endHour, endMinute, 0, 0);

          while (slotTime < endTime) {
            if (slotTime > now && !bookedTimes.includes(slotTime.toISOString())) {
              slots.push({
                display: slotTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                value: slotTime.toISOString(),
                date: slotTime.toISOString().split('T')[0]
              });
            }
            slotTime.setMinutes(slotTime.getMinutes() + appointmentDuration);
          }
        }
      }
      this.allAvailableSlots.set(slots);
    } catch (error) {
      console.error('Error generating slots:', error);
      this.notificationService.showError('Error al cargar horarios disponibles');
    } finally {
      this.loadingService.hide();
    }
  }

  async bookAppointment() {
    const doctorId = this.selectedDoctorId();
    const slot = this.selectedSlot();
    let patientId = this.forPatientId();

    if (!doctorId || !slot) {
      this.notificationService.showError('Faltan datos para agendar la cita.');
      return;
    }

    if (this.bookingStatus() === 'loading') {
      Logger.log('Ya hay una reserva en proceso');
      return;
    }

    const { data: { user }, error: authError } = await this.supabaseService.supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Error obteniendo usuario:', authError);
      this.notificationService.showError('Debes iniciar sesión para agendar una cita');
      return;
    }

    Logger.log('👤 Usuario autenticado (auth.uid()):', user.id);
    Logger.log('🏥 Patient ID solicitado:', patientId);

    if (!patientId) {
      patientId = user.id;
      this.forPatientId.set(user.id);
      Logger.log('✅ Patient ID establecido automáticamente:', patientId);
    }

    // Determinar si es para un dependiente
    const isForDependent = patientId !== user.id;
    
    // Verificar dependiente si es necesario
    if (isForDependent) {
      Logger.log('🔍 Verificando si es un dependiente...');
      
      const { data: dependent, error: depError } = await this.supabaseService.supabase
        .from('dependents')
        .select('*')
        .eq('id', patientId)
        .eq('guardian_id', user.id)
        .maybeSingle();

      Logger.log('📋 Resultado consulta dependiente:', { dependent, depError });

      if (depError) {
        console.error('❌ Error verificando dependiente:', depError);
        this.notificationService.showError('Error al verificar permisos');
        return;
      }

      if (!dependent) {
        console.error('❌ El patient_id no es un dependiente válido del usuario');
        console.error(`Guardian ID esperado: ${user.id}, Patient ID: ${patientId}`);
        this.notificationService.showError('No tienes permiso para crear una cita para este paciente');
        return;
      }
      
      Logger.log('✅ Dependiente válido confirmado:', dependent);
    }

    this.loadingService.show();
    this.bookingStatus.set('loading');

    try {
      // Crear el objeto de datos con booked_by_id
      const appointmentData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_time: slot.value,
        status: 'scheduled' as const,
        booked_by_id: isForDependent ? user.id : null
      };

      Logger.log('📤 Intentando reservar cita:', {
        ...appointmentData,
        current_auth_uid: user.id
      });

      const { data, error } = await this.appointmentDAO.create(appointmentData);

      if (error) {
        console.error('❌ Error detallado al crear cita:', error);
        
        // Manejo específico de error del trigger P0001
        if (error.code === 'P0001') {
          this.notificationService.showWarning(`⚠️ ${error.message}`);
          this.bookingStatus.set('error');
          return;
        }

        if (error.code === '42501') {
          console.error('🔒 Violación de política RLS');
          console.error('Verifica que la política RLS en Supabase esté configurada correctamente');
          console.error(`auth.uid() = ${user.id}, patient_id = ${patientId}`);
          this.notificationService.showError('Error de permisos. Por favor, contacta al soporte técnico.');
          this.bookingStatus.set('error');
          return;
        }

        if (error.code === 'SLOT_NOT_AVAILABLE' || 
            error.code === 'DUPLICATE_APPOINTMENT' || 
            error.code === '23505') {
          this.notificationService.showWarning('⚠️ Este horario acaba de ser reservado. Por favor, selecciona otro.');
          await this.generateAndSetAvailableSlots(doctorId);
          this.selectedSlot.set(null);
          this.bookingStatus.set('idle');
          return;
        }

        if (error.code === 'PGRST301' || 
            error.message?.includes('permission denied') || 
            error.message?.includes('forbidden')) {
          this.notificationService.showError('No tienes permisos para realizar esta acción.');
          this.bookingStatus.set('error');
          return;
        }

        this.notificationService.showError(`Error al agendar: ${error.message || 'Error desconocido'}`);
        this.bookingStatus.set('error');
        return;
      }

      Logger.log('✅ Cita creada exitosamente:', data);
      this.bookingStatus.set('success');
      
      // Mostrar notificación apropiada
      if (isForDependent) {
        this.notificationService.showSuccess('✅ Cita agendada exitosamente para tu familiar');
      } else {
        this.notificationService.showSuccess('✅ Cita agendada exitosamente');
      }

      const userProfile = this.authService.userProfile();
      if (userProfile) {
        await this.appointmentService.loadAllAppointments(userProfile.id, userProfile.role);
      }

      this.resetBookingState();

    } catch (error: any) {
      console.error('❌ Error inesperado en bookAppointment:', error);
      this.notificationService.showError('Error inesperado al agendar la cita');
      this.bookingStatus.set('error');
    } finally {
      this.loadingService.hide();
    }
  }

  resetBookingState() {
    this.resetDoctorAndSlotSelection();
    this.forPatientId.set(null);
    this.bookingStatus.set('idle');
  }
  
  resetDoctorAndSlotSelection() {
    this.selectedDoctorId.set(null);
    this.resetSlotSelection();
  }

  private resetSlotSelection() {
    this.selectedDate.set(null);
    this.selectedSlot.set(null);
  }
}
