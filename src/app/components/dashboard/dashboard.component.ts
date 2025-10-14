// src/app/components/dashboard/dashboard.component.ts

import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AppointmentService } from '../../services/appointment.service';
import { DashboardTab } from '../../interfaces/models';

// Import all the components used in the template
import { BookAppointmentComponent } from '../book-appointment/book-appointment.component';
import { AppointmentListComponent } from '../appointment-list/appointment-list.component';
import { DoctorOfficeComponent } from '../doctor-office/doctor-office.component';
import { ProfileComponent } from '../profile/profile.component';
import { ClinicalHistoryComponent } from '../clinical-history/clinical-history.component';
import { FamilyComponent } from '../family/family.component'; // <-- NUEVO

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    BookAppointmentComponent, 
    AppointmentListComponent,
    DoctorOfficeComponent,
    ProfileComponent,
    ClinicalHistoryComponent,
    FamilyComponent // <-- NUEVO
  ], 
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  authService = inject(AuthService);
  appointmentService = inject(AppointmentService);
  
  initialTab = computed<DashboardTab>(() => 
    this.authService.userProfile()?.role === 'doctor' ? 'office' : 'book'
  );
  
  activeTab = signal<DashboardTab>('book');

  constructor() {
    effect(() => {
      this.activeTab.set(this.initialTab());
    });
  }

  async handleLogout() {
    await this.authService.signOut();
  }
}