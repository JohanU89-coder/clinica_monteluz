// src/app/components/clinical-history/clinical-history.component.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ClinicalHistoryService } from '../../services/clinical-history.service';
import { Profile, Appointment } from '../../interfaces/models';
import { NotificationService } from '../../services/notification.service';
import { AppointmentService } from '../../services/appointment.service';
import { PrescriptionService } from '../../services/prescription.service'; // <-- 1. ASEGÚRATE DE IMPORTAR

@Component({
  selector: 'app-clinical-history',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './clinical-history.component.html',
  styleUrls: ['./clinical-history.component.scss']
})
export class ClinicalHistoryComponent {
  clinicalHistoryService = inject(ClinicalHistoryService);
  notificationService = inject(NotificationService);
  appointmentService = inject(AppointmentService);
  prescriptionService = inject(PrescriptionService); // <-- 2. ASEGÚRATE DE INYECTAR

  editingAppointmentId = signal<number | null>(null);

  selectPatient(patient: Profile) {
    this.clinicalHistoryService.selectPatient(patient);
  }

  openEditor(aptId: number) {
    this.editingAppointmentId.set(aptId);
  }

  closeEditor() {
    this.editingAppointmentId.set(null);
  }

  submitDiagnosis(appointmentId: number, diagnosisInput: HTMLTextAreaElement) {
    if (!diagnosisInput.value) {
      this.notificationService.showError('El diagnóstico no puede estar vacío.');
      return;
    }
    this.appointmentService.updateAppointment(appointmentId, { diagnosis: diagnosisInput.value });
    this.closeEditor();
  }
}