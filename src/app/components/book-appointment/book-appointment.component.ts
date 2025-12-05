import { Component, inject, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { Profile } from '../../interfaces/models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.scss']
})
export class BookAppointmentComponent {
  dataService = inject(DataService);
  bookingService = inject(BookingService);
  authService = inject(AuthService);
  
  selectedSpecialtyId: number | null = null;
  
  // Computed para obtener el objeto del doctor seleccionado
  selectedDoctor = computed(() => {
    const doctorId = this.bookingService.selectedDoctorId();
    if (!doctorId) return null;
    return this.dataService.doctors().find(d => d.id === doctorId);
  });

  constructor() {
    // Si solo hay un perfil (el usuario), selecciónalo automáticamente
    effect(() => {
      const profiles = this.authService.bookableProfiles();
      if (profiles.length === 1) {
        this.bookingService.forPatientId.set(profiles[0].id);
      }
    });
  }

  onSpecialtyChange(specialtyId: any) {
    // Aseguramos que sea número
    const id = Number(specialtyId);
    this.selectedSpecialtyId = id;
    
    // Reseteamos selecciones posteriores
    this.bookingService.resetDoctorAndSlotSelection(); 
    
    if (id) {
      this.dataService.loadDoctorsBySpecialty(id);
    }
  }
  
  selectDoctor(doctor: Profile) {
    // Si no se ha seleccionado paciente (caso borde), seleccionar al usuario actual
    if (!this.bookingService.forPatientId()) {
      this.bookingService.forPatientId.set(this.authService.userProfile()!.id);
    }
    this.bookingService.selectedDoctorId.set(doctor.id);
  }
  
  selectDay(date: Date) {
    const dateString = date.toISOString().split('T')[0];
    this.bookingService.selectedDate.set(dateString);
    this.bookingService.selectedSlot.set(null);
  }

  selectSlot(slot: { display: string, value: string, date: string }) {
    this.bookingService.selectedSlot.set(slot);
  }

  confirmBooking() {
    this.bookingService.bookAppointment();
  }

  // --- HELPERS VISUALES ---

  // Obtener iniciales (ej: Juan Perez -> JP)
  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '';
  }

  // Obtener nombre del paciente para el resumen
  getPatientName(): string | undefined {
    const profile = this.authService.bookableProfiles().find(p => p.id === this.bookingService.forPatientId());
    return profile?.full_name;
  }

  // Obtener nombre de la especialidad para el resumen
  getSpecialtyName(): string | undefined {
    const spec = this.dataService.specialties().find(s => s.id === this.selectedSpecialtyId);
    return spec?.name;
  }
}