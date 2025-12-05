import { Component, inject, computed } from '@angular/core';
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
  
  // Días de la semana ordenados para mostrar en la UI
  daysOfWeek = [
    { id: 1, name: 'Lunes' }, 
    { id: 2, name: 'Martes' }, 
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' }, 
    { id: 5, name: 'Viernes' }, 
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' }
  ];

  // Computada para agrupar horarios por día { 1: [h1, h2], 2: [] ... }
  groupedSchedules = computed(() => {
    const schedules = this.scheduleService.mySchedule();
    const groups: Record<number, any[]> = {};
    
    // Inicializar grupos vacíos
    this.daysOfWeek.forEach(d => groups[d.id] = []);

    // Llenar grupos
    schedules.forEach(sch => {
      if (groups[sch.day_of_week]) {
        groups[sch.day_of_week].push(sch);
      }
    });

    // Ordenar horarios dentro de cada día por hora de inicio
    Object.keys(groups).forEach(key => {
      groups[+key].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return groups;
  });

  // Computada para contar total de bloques horarios
  totalBlocks = computed(() => this.scheduleService.mySchedule().length);

  constructor() {
    this.scheduleForm = this.fb.group({
      day: [null, Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required]
    });
  }

  // Validador lógico de horas
  async handleAddSchedule() {
    if (this.scheduleForm.invalid) return;

    const { day, startTime, endTime } = this.scheduleForm.value;

    // Validación simple: Inicio debe ser antes del fin
    if (startTime >= endTime) {
      alert('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    await this.scheduleService.addSchedule(day, startTime, endTime);
    
    // Resetear solo las horas para facilitar carga masiva del mismo día
    this.scheduleForm.patchValue({ startTime: '', endTime: '' });
  }

  async handleDeleteSchedule(scheduleId: number) {
    if (confirm('¿Eliminar este bloque horario?')) {
      await this.scheduleService.deleteSchedule(scheduleId);
    }
  }

  // Helpers para la vista
  getDayName(dayId: number): string {
    return this.daysOfWeek.find(d => d.id === +dayId)?.name || '';
  }

  hasSchedules(dayId: number): boolean {
    return this.groupedSchedules()[dayId]?.length > 0;
  }
}