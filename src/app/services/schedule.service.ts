// src/app/services/schedule.service.ts

import { effect, inject, Injectable, signal } from '@angular/core';
import { Schedule } from '../interfaces/models';
import { ScheduleDAO } from '../daos/schedule.dao';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private scheduleDAO = inject(ScheduleDAO);
  private authService = inject(AuthService);

  mySchedule = signal<Schedule[]>([]);

  constructor() {
    // Reacciona a los cambios del perfil de usuario
    effect(() => {
      const user = this.authService.userProfile();
      // Si el usuario es un doctor, carga su horario
      if (user && user.role === 'doctor') {
        this.loadMySchedule(user.id);
      } else {
        // Si no es doctor o cierra sesión, limpia el horario
        this.mySchedule.set([]);
      }
    });
  }

  private async loadMySchedule(doctorId: string) {
    const schedules = await this.scheduleDAO.getByDoctorId(doctorId);
    this.mySchedule.set(schedules);
  }

  async addSchedule(day: number, startTime: string, endTime: string) {
    const user = this.authService.userProfile();
    if (!user || !day || !startTime || !endTime) return;

    const newSchedule = await this.scheduleDAO.add({
      doctor_id: user.id,
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
    });

    if (newSchedule) {
      // Actualiza el estado local para reflejar el cambio instantáneamente
      this.mySchedule.update(currentSchedules => 
        [...currentSchedules, newSchedule].sort((a, b) => a.day_of_week - b.day_of_week)
      );
    }
  }

  async deleteSchedule(scheduleId: number) {
    const success = await this.scheduleDAO.delete(scheduleId);
    if (success) {
      // Actualiza el estado local eliminando el horario
      this.mySchedule.update(currentSchedules => 
        currentSchedules.filter(s => s.id !== scheduleId)
      );
    }
  }
}