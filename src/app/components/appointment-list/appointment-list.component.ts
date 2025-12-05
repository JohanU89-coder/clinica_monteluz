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

  appointmentService = inject(AppointmentService);
  authService = inject(AuthService);
  prescriptionService = inject(PrescriptionService);
  notificationService = inject(NotificationService);
  confirmationService = inject(ConfirmationService);

  editingAppointmentId = signal<number | null>(null);
  currentRating = signal<number | null>(null);

  appointments = computed(() => {
    return this.listType === 'upcoming'
      ? this.appointmentService.upcomingAppointments()
      : this.appointmentService.pastAppointments();
  });

  title = computed(() => {
    return this.listType === 'upcoming' ? 'Próximas Citas' : 'Historial de Citas';
  });

  userRole = computed(() => this.authService.userProfile()?.role);

  // Diccionario simple para traducir estados
  statusLabels: any = {
    scheduled: 'Programada',
    completed: 'Completada',
    cancelled: 'Cancelada'
  };

  // --- HELPERS VISUALES ---
  getInitials(name: string | undefined): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  // --- MÉTODOS DE LÓGICA (Sin cambios) ---
  openEditor(aptId: number) {
    this.currentRating.set(null);
    this.editingAppointmentId.set(aptId);
  }

  closeEditor() {
    this.editingAppointmentId.set(null);
    this.currentRating.set(null);
  }

  createPrescription(appointment: Appointment) {
    this.closeEditor();
    this.prescriptionService.startCreation(appointment);
  }

  async submitDiagnosis(appointmentId: number, diagnosisInput: HTMLTextAreaElement) {
    const diagnosis = diagnosisInput.value.trim();
    if (!diagnosis) {
      this.notificationService.showError('El diagnóstico no puede estar vacío.');
      return;
    }
    this.closeEditor();
    await this.appointmentService.updateAppointment(appointmentId, { diagnosis });
  }

  async submitRating(appointmentId: number, rating: number, feedbackInput: HTMLTextAreaElement) {
    this.closeEditor();
    await this.appointmentService.updateAppointment(appointmentId, { 
      rating: rating, 
      feedback: feedbackInput.value.trim()
    });
  }

  async completeAppointment(appointmentId: number) {
    await this.appointmentService.completeAppointment(appointmentId);
  }
  
  async cancelAppointment(appointmentId: number) {
    const confirmed = await this.confirmationService.confirm(
      '¿Estás seguro de que quieres cancelar esta cita?'
    );
    if (confirmed) {
      await this.appointmentService.cancelAppointment(appointmentId);
    }
  }
}