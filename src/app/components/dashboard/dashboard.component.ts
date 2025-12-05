import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

// Importa tus componentes internos aquí
import { BookAppointmentComponent } from '../book-appointment/book-appointment.component';
import { AppointmentListComponent } from '../appointment-list/appointment-list.component';
import { FamilyComponent } from '../family/family.component';
import { DoctorOfficeComponent } from '../doctor-office/doctor-office.component';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BookAppointmentComponent,
    AppointmentListComponent,
    FamilyComponent,
    DoctorOfficeComponent,
    ProfileComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  authService = inject(AuthService);
  
  // Estado inicial 'home' (se sobrescribirá automáticamente)
  currentView = signal<string>('home'); 

  userProfile = computed(() => this.authService.userProfile());
  userRole = computed(() => this.authService.userProfile()?.role);

  private avatarColors = ['#e57373', '#f06292', '#ba68c8', '#9575cd', '#7986cb', '#64b5f6', '#4dd0e1', '#4db6ac', '#81c784', '#aed581', '#ffb74d', '#ff8a65'];

  constructor() {
    // Lógica inteligente de redirección inicial
    effect(() => {
      const role = this.userRole();
      
      // Solo ejecutamos esto si estamos en la vista por defecto ('home')
      // para no interferir si el usuario ya navegó a otra parte.
      if (role && this.currentView() === 'home') {
        if (role === 'patient') {
          // ¡Aquí está el cambio! Pacientes van directo a Agendar
          this.setView('book');
        } else {
          // Doctores van a su agenda
          this.setView('upcoming');
        }
      }
    }, { allowSignalWrites: true }); // Permitimos actualizar la señal dentro del efecto
  }

  // Cambiar de vista
  setView(view: string) {
    this.currentView.set(view);
  }

  logout() {
    this.authService.signOut();
  }

  // --- HELPERS VISUALES ---
  getInitials(name: string | undefined): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';
  }

  getAvatarColor(name: string | undefined): string {
    if (!name) return '#ccc';
    let hash = 0;
    for (let i = 0; i < name.length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    const index = Math.abs(hash % this.avatarColors.length);
    return this.avatarColors[index];
  }
}