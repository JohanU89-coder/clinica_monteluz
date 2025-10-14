// src/app/services/prescription.service.ts

import { inject, Injectable, signal } from '@angular/core';
import { Appointment, Prescription, PrescriptionItem, PrescriptionState } from '../interfaces/models';
import { PrescriptionDAO } from '../daos/prescription.dao';
import { AppointmentService } from './appointment.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service'; // <-- AGREGAR
import { Logger } from '../utils/logger'; // <-- AGREGAR

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private prescriptionDAO = inject(PrescriptionDAO);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService); // <-- AGREGAR

  prescriptionState = signal<PrescriptionState | null>(null);
  viewedPrescription = signal<Prescription | null>(null);
  isSaving = signal<boolean>(false);

  startCreation(appointment: Appointment) {
    Logger.log('Botón "Crear Receta" presionado. Abriendo modal para la cita ID:', appointment.id);

    this.prescriptionState.set({
      appointment: appointment,
      items: [{ medication: '', dosage: '', frequency: '', duration: '', notes: '' }]
    });
  }

  async view(prescriptionId: number) {
    const prescription = await this.prescriptionDAO.getById(prescriptionId);
    if (prescription) {
      this.viewedPrescription.set(prescription);
    }
  }

  async savePrescription() {
    const state = this.prescriptionState();
    if (!state) return;

    if (this.isSaving()) {
      this.notificationService.showWarning('Ya se está guardando una receta...'); // <-- CAMBIO
      return;
    }

    const prescriptionData = {
      appointment_id: state.appointment.id,
      patient_id: state.appointment.patient_id,
      doctor_id: state.appointment.doctor_id
    };

    const itemsData = state.items.filter(item => 
      item.medication && item.medication.trim() !== ''
    );
    
    if (itemsData.length === 0) {
      this.notificationService.showError('Debes añadir al menos un medicamento.'); // <-- CAMBIO
      return;
    }

    this.isSaving.set(true);
    Logger.log('💾 Guardando receta...');

    try {
      const newPrescription = await this.prescriptionDAO.create(
        prescriptionData, 
        itemsData as Omit<PrescriptionItem, 'id' | 'prescription_id'>[]
      );

      if (newPrescription) {
        Logger.log('✅ Receta guardada exitosamente:', newPrescription);
        
        Logger.log('⏳ Esperando 300ms para sincronización...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const user = this.authService.userProfile();
        if (user) {
          Logger.log('🔄 Recargando citas del usuario...');
          await this.appointmentService.loadAllAppointments(user.id, user.role);
          Logger.log('✅ Citas recargadas correctamente');
        }
        
        this.closeModals();
        
        // <-- CAMBIO: Notificación mejorada
        this.notificationService.showSuccess('✅ Receta médica guardada exitosamente');
      } else {
        Logger.error('❌ Error: No se pudo crear la receta');
        this.notificationService.showError('Error al guardar la receta. Intenta nuevamente.'); // <-- CAMBIO
      }
    } catch (error) {
      Logger.error('❌ Excepción al guardar receta:', error);
      this.notificationService.showError('Error inesperado al guardar la receta.'); // <-- CAMBIO
    } finally {
      this.isSaving.set(false);
    }
  }

  closeModals() {
    this.prescriptionState.set(null);
    this.viewedPrescription.set(null);
  }
}
