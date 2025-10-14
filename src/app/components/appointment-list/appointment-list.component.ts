// src/app/components/appointment-list/appointment-list.component.ts

import { Component, inject, Input, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { PrescriptionService } from '../../services/prescription.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { Appointment } from '../../interfaces/models';
import { Logger } from '../../utils/logger';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.scss']
})
export class AppointmentListComponent {
  @Input({ required: true }) listType: 'upcoming' | 'past' = 'upcoming';

  // Inyecta todos los servicios necesarios
  appointmentService = inject(AppointmentService);
  authService = inject(AuthService);
  prescriptionService = inject(PrescriptionService);
  notificationService = inject(NotificationService);
  confirmationService = inject(ConfirmationService);

  // Señales para manejar el estado de la UI
  editingAppointmentId = signal<number | null>(null);
  currentRating = signal<number | null>(null);

  // Señales computadas para obtener datos del servicio
  appointments = computed(() => {
    return this.listType === 'upcoming'
      ? this.appointmentService.upcomingAppointments()
      : this.appointmentService.pastAppointments();
  });

  title = computed(() => {
    return this.listType === 'upcoming' ? 'Próximas Citas' : 'Historial de Citas';
  });

  userRole = computed(() => this.authService.userProfile()?.role);

  // --- MÉTODOS PARA MANEJAR EL PANEL EXPANDIBLE ---
  openEditor(aptId: number) {
    this.currentRating.set(null);
    this.editingAppointmentId.set(aptId);
  }

  closeEditor() {
    this.editingAppointmentId.set(null);
    this.currentRating.set(null);
  }

  // --- MÉTODO PARA CREAR RECETA ---
  createPrescription(appointment: Appointment) {
    Logger.log('🏥 Creando receta, cerrando panel de detalles...');
    this.closeEditor(); // Cerrar el panel primero
    this.prescriptionService.startCreation(appointment);
  }

  // --- MÉTODOS DE ACCIÓN (LLAMADOS DESDE EL HTML) ---
  async submitDiagnosis(appointmentId: number, diagnosisInput: HTMLTextAreaElement) {
    const diagnosis = diagnosisInput.value.trim();
    
    if (!diagnosis) {
      this.notificationService.showError('El diagnóstico no puede estar vacío.');
      return;
    }
    
    Logger.log('💾 Guardando diagnóstico...');
    
    // PRIMERO: Cerrar el editor inmediatamente
    this.closeEditor();
    
    // SEGUNDO: Guardar y recargar
    await this.appointmentService.updateAppointment(appointmentId, { diagnosis });
    
    Logger.log('✅ Diagnóstico guardado');
  }

  async submitRating(appointmentId: number, rating: number, feedbackInput: HTMLTextAreaElement) {
    Logger.log('⭐ Guardando calificación...');
    
    // PRIMERO: Cerrar el editor inmediatamente
    this.closeEditor();
    
    // SEGUNDO: Guardar y recargar
    await this.appointmentService.updateAppointment(appointmentId, { 
      rating: rating, 
      feedback: feedbackInput.value.trim()
    });
    
    Logger.log('✅ Calificación guardada');
  }

  async completeAppointment(appointmentId: number) {
    Logger.log('✔️ Completando cita...');
    await this.appointmentService.completeAppointment(appointmentId);
    Logger.log('✅ Cita completada');
  }
  
  async cancelAppointment(appointmentId: number) {
    const confirmed = await this.confirmationService.confirm(
      '¿Estás seguro de que quieres cancelar esta cita? Esta acción no se puede deshacer.'
    );

    if (confirmed) {
      Logger.log('❌ Cancelando cita...');
      await this.appointmentService.cancelAppointment(appointmentId);
      Logger.log('✅ Cita cancelada');
    }
  }
}
