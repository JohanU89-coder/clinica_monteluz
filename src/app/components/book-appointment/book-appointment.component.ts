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
  
  selectedDoctor = computed(() => {
    const doctorId = this.bookingService.selectedDoctorId();
    if (!doctorId) return null;
    return this.dataService.doctors().find(d => d.id === doctorId);
  });

  constructor() {
    effect(() => {
      const profiles = this.authService.bookableProfiles();
      if (profiles.length === 1) {
        this.bookingService.forPatientId.set(profiles[0].id);
      }
    });
  }

  onSpecialtyChange(specialtyId: number | null) {
    this.selectedSpecialtyId = specialtyId;
    this.bookingService.resetDoctorAndSlotSelection(); 
    if (specialtyId) {
      this.dataService.loadDoctorsBySpecialty(specialtyId);
    }
  }
  
  selectDoctor(doctor: Profile) {
    if (this.authService.bookableProfiles().length === 1 && !this.bookingService.forPatientId()) {
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
}