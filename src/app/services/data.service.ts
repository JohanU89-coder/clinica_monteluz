// src/app/services/data.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { Profile, Specialty } from '../interfaces/models';
import { ProfileDAO } from '../daos/profile.dao';
import { SpecialtyDAO } from '../daos/specialty.dao';
import { ScheduleDAO } from '../daos/schedule.dao';
// Importa el DAO de citas cuando lo necesites para los slots
// import { AppointmentDAO } from '../daos/appointment.dao';

@Injectable({ providedIn: 'root' })
export class DataService {
  private profileDAO = inject(ProfileDAO);
  private specialtyDAO = inject(SpecialtyDAO);
  private scheduleDAO = inject(ScheduleDAO);

  specialties = signal<Specialty[]>([]);
  doctors = signal<Profile[]>([]);
  
  constructor() {
    this.loadSpecialties();
  }

  async loadSpecialties() {
    const data = await this.specialtyDAO.getAll();
    this.specialties.set(data);
  }

  async loadDoctorsBySpecialty(specialtyId: number) {
    const data = await this.profileDAO.getDoctors(specialtyId);
    this.doctors.set(data);
  }
}