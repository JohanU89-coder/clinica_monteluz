// src/app/components/doctor-office/doctor-office.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ScheduleService } from '../../services/schedule.service';

@Component({
  selector: 'app-doctor-office',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './doctor-office.component.html',
  styleUrls: ['./doctor-office.component.scss']
})
export class DoctorOfficeComponent {
  scheduleService = inject(ScheduleService);
  private fb = inject(FormBuilder);

  scheduleForm: FormGroup;
  daysOfWeek = [
    { id: 1, name: 'Lunes' }, { id: 2, name: 'Martes' }, { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' }, { id: 5, name: 'Viernes' }, { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' }
  ];

  constructor() {
    this.scheduleForm = this.fb.group({
      day: [null, Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required]
    });
  }

  // Función de ayuda para mostrar el nombre del día
  getDayName(dayNumber: number): string {
    return this.daysOfWeek.find(d => d.id === dayNumber)?.name || 'Día inválido';
  }

  async handleAddSchedule() {
    if (this.scheduleForm.invalid) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const { day, startTime, endTime } = this.scheduleForm.value;
    await this.scheduleService.addSchedule(day, startTime, endTime);
    this.scheduleForm.reset(); // Limpia el formulario después de añadir
  }

  async handleDeleteSchedule(scheduleId: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este horario?')) {
      await this.scheduleService.deleteSchedule(scheduleId);
    }
  }
}