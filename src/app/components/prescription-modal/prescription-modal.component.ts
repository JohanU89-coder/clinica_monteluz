// src/app/components/prescription-modal/prescription-modal.component.ts

import { Component, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrescriptionService } from '../../services/prescription.service';

@Component({
  selector: 'app-prescription-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './prescription-modal.component.html',
  styleUrls: ['./prescription-modal.component.scss']
})
export class PrescriptionModalComponent {
  prescriptionService = inject(PrescriptionService);

  // Computed signals para acceso reactivo
  prescriptionState = computed(() => this.prescriptionService.prescriptionState());
  viewedPrescription = computed(() => this.prescriptionService.viewedPrescription());
  isSaving = computed(() => this.prescriptionService.isSaving());

  // Método para agregar medicamento (usado en el HTML)
  addItem() {
    this.prescriptionService.prescriptionState.update(state => {
      if (!state) return null;
      state.items.push({ 
        medication: '', 
        dosage: '', 
        frequency: '', 
        duration: '', 
        notes: '' 
      });
      return { ...state };
    });
  }

  // Método para remover medicamento (usado en el HTML)
  removeItem(index: number) {
    this.prescriptionService.prescriptionState.update(state => {
      if (!state || state.items.length <= 1) return state;
      state.items.splice(index, 1);
      return { ...state };
    });
  }

  // Guardar la receta
  save() {
    if (!this.isValid()) {
      alert('Debes añadir al menos un medicamento con nombre.');
      return;
    }
    this.prescriptionService.savePrescription();
  }

  // Cerrar ambos modales
  close() {
    this.prescriptionService.closeModals();
  }

  // Validar si hay al menos un medicamento con nombre
  private isValid(): boolean {
    const state = this.prescriptionState();
    if (!state) return false;
    
    return state.items.some(item => 
      item.medication && item.medication.trim() !== ''
    );
  }
}
