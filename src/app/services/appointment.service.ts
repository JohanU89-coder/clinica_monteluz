// src/app/services/appointment.service.ts

import { inject, Injectable, signal, effect } from '@angular/core';
import { Appointment } from '../interfaces/models';
import { AppointmentDAO } from '../daos/appointment.dao';
import { AuthService } from './auth.service';
import { LoadingService } from './loading.service';
import { NotificationService } from './notification.service';
import { Logger } from '../utils/logger';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private appointmentDAO = inject(AppointmentDAO);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  upcomingAppointments = signal<Appointment[]>([]);
  pastAppointments = signal<Appointment[]>([]);
  
  constructor() {
    effect(async () => {
      const user = this.authService.userProfile();
      if (user) {
        await this.loadAllAppointments(user.id, user.role);
      } else {
        this.upcomingAppointments.set([]);
        this.pastAppointments.set([]);
      }
    });
  }

  public async loadAllAppointments(userId: string, userRole: 'patient' | 'doctor') {
    this.loadingService.show();
    try {
      let allAppointments: Appointment[] = [];
      if (userRole === 'patient') {
        allAppointments = await this.appointmentDAO.getByPatientId(userId);
      } else if (userRole === 'doctor') {
        allAppointments = await this.appointmentDAO.getByDoctorId(userId);
      }
      
      Logger.log('📋 Total de citas cargadas:', allAppointments.length);
      Logger.log('Citas:', allAppointments);
      
      // Log para verificar si las prescriptions se están cargando
      const citaConReceta = allAppointments.find(apt => apt.prescriptions && apt.prescriptions.length > 0);
      if (citaConReceta) {
        Logger.log('🔍 Cita con receta encontrada:', citaConReceta);
        Logger.log('📝 Prescriptions:', citaConReceta.prescriptions);
      } else {
        Logger.log('⚠️ No se encontraron citas con prescriptions');
      }
      
      this.filterAndSetAppointments(allAppointments);
    } finally {
      this.loadingService.hide();
    }
  }

  private filterAndSetAppointments(appointments: Appointment[]) {
    const now = new Date();
    
    const upcoming = appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_time);
      return aptDate >= now && apt.status === 'scheduled';
    });
    
    const past = appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_time);
      return aptDate < now || 
             apt.status === 'completed' || 
             apt.status === 'cancelled';
    });
    
    // Ordenar
    upcoming.sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
    past.sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
    
    Logger.log('📅 Citas próximas:', upcoming.length);
    Logger.log('📜 Historial:', past.length);
    
    // CRÍTICO: Crear NUEVOS arrays para forzar detección de cambios
    this.upcomingAppointments.set([...upcoming]);
    this.pastAppointments.set([...past]);
  }

  async updateAppointment(appointmentId: number, updates: Partial<Appointment>) {
    this.loadingService.show();
    try {
      Logger.log('🔄 Actualizando cita:', appointmentId, updates);
      
      const updatedAppointment = await this.appointmentDAO.update(appointmentId, updates);
      
      if (updatedAppointment) {
        Logger.log('✅ Cita actualizada:', updatedAppointment);
        this.notificationService.showSuccess('Cita actualizada.');
        
        const user = this.authService.userProfile();
        if (user) {
          Logger.log('🔄 Recargando todas las citas...');
          await this.loadAllAppointments(user.id, user.role);
          Logger.log('✅ Citas recargadas completamente');
        }
      } else {
        console.error('❌ Error: No se pudo actualizar la cita');
        this.notificationService.showError('Hubo un error al actualizar la cita.');
      }
    } catch (error) {
      console.error('❌ Excepción al actualizar cita:', error);
      this.notificationService.showError('Error inesperado al actualizar la cita.');
    } finally {
      this.loadingService.hide();
    }
  }

  async completeAppointment(appointmentId: number) {
    this.loadingService.show();
    try {
      const updatedAppointment = await this.appointmentDAO.update(appointmentId, { status: 'completed' });
      if (updatedAppointment) {
        this.notificationService.showSuccess('Cita marcada como completada.');
        const user = this.authService.userProfile();
        if (user) {
          await this.loadAllAppointments(user.id, user.role);
        }
      } else {
        this.notificationService.showError('Hubo un error al completar la cita.');
      }
    } finally {
      this.loadingService.hide();
    }
  }

  async cancelAppointment(appointmentId: number) {
    this.loadingService.show();
    try {
      const updatedAppointment = await this.appointmentDAO.update(appointmentId, { status: 'cancelled' });
      if (updatedAppointment) {
        this.notificationService.showSuccess('Cita cancelada correctamente.');
        const user = this.authService.userProfile();
        if (user) {
          await this.loadAllAppointments(user.id, user.role);
        }
      } else {
        this.notificationService.showError('Hubo un error al cancelar la cita.');
      }
    } finally {
      this.loadingService.hide();
    }
  }

  async exportPrescriptionPdf(appointmentId: number) {
  this.loadingService.show();
  try {
    const response = await fetch(`http://localhost:8080/api/appointments/${appointmentId}/export-pdf`);
    
    if (!response.ok) {
      this.notificationService.showError('No se pudo generar la receta.');
      return;
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receta-monteluz-${appointmentId}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    this.notificationService.showSuccess('Receta descargada correctamente.');
  } catch (error) {
    console.error('Error al exportar receta:', error);
    this.notificationService.showError('Error al descargar la receta.');
  } finally {
    this.loadingService.hide();
  }
}

}
