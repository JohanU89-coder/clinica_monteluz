// src/app/app.component.ts

import { Component, OnInit, signal, WritableSignal, inject, effect } from '@angular/core';
// Se importa FormsModule para usar [(ngModel)]
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile, Specialty, Appointment, Schedule, Prescription, PrescriptionItem } from './interfaces';
import { environment } from '../environments/environment';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type View = 'landing' | 'auth' | 'dashboard';
type AuthMode = 'login' | 'register';
type UserType = 'patient' | 'doctor';
type DashboardTab = 'upcoming' | 'past' | 'profile' | 'office';

// Interface para el estado de creación de receta
interface PrescriptionState {
  appointment: Appointment;
  items: Partial<PrescriptionItem>[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  // Se añade FormsModule al arreglo de imports
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);

  loading = signal(false);
  currentView: WritableSignal<View> = signal('landing');
  authMode: WritableSignal<AuthMode> = signal('login');
  userType: WritableSignal<UserType> = signal('patient');
  session: WritableSignal<Session | null> = signal(null);
  userProfile: WritableSignal<Profile | null> = signal(null);
  dashboardTab: WritableSignal<DashboardTab> = signal('upcoming');

  specialties: WritableSignal<Specialty[]> = signal([]);
  availableDoctors: WritableSignal<Profile[]> = signal([]);
  upcomingAppointments: WritableSignal<Appointment[]> = signal([]);
  pastAppointments: WritableSignal<Appointment[]> = signal([]);
  mySchedule: WritableSignal<Schedule[]> = signal([]);
  selectedDoctorId = signal<string | null>(null);
  doctorAverageRating = signal<number>(0);

  availableSlots = signal<{ display: string, value: string }[]>([]);
  selectedSlot = signal<{ display: string, value: string } | null>(null);
  appointmentToConfirm = signal<any>(null);
  appointmentTicket = signal<any>(null);

  urlTicketBase: string = environment.backend + 'appointments/ticket/';
  urlTicket: SafeResourceUrl | undefined;

  urlCitasExcelBase: string = environment.backend + 'appointments/excel/';
  urlCitasExcel: SafeResourceUrl | undefined;
  
  followUpState = signal<{ patientId: string, patientName: string | undefined } | null>(null);

  // --- SEÑALES PARA RECETAS ---
  prescriptionState = signal<PrescriptionState | null>(null);
  viewedPrescription = signal<(Prescription & { items: PrescriptionItem[] }) | null>(null);

  authForm!: FormGroup;
  profileForm!: FormGroup;

  constructor(private sanitizer: DomSanitizer) {
    effect(async () => {
      const currentSession = this.session();
      if (currentSession) {
        await this.getProfile(currentSession.user.id);
      } else {
        this.currentView.set('landing');
        this.userProfile.set(null);
      }
    });

    effect(() => {
        const profile = this.userProfile();
        if (profile) {
            this.dashboardTab.set(profile.role === 'doctor' ? 'office' : 'upcoming');
            this.loadAllAppointments();
            if (profile.role === 'doctor') {
                this.loadMySchedule();
            }
            this.initProfileForm();
            this.currentView.set('dashboard');
        }
    });
    
    effect(() => {
      if (this.userProfile()?.role === 'doctor') {
        this.calculateDoctorRating();
      }
    });

    effect(() => {
        if(this.currentView() === 'auth'){
            this.initForm();
        }
        if (this.currentView() === 'dashboard' && this.userProfile()?.role === 'patient') {
            this.loadDoctorsBySpecialty('');
        }
    });

    effect(() => {
        const doctorId = this.selectedDoctorId();
        this.availableSlots.set([]);
        this.selectedSlot.set(null);
        if (doctorId) {
            this.loadDoctorScheduleAndGenerateSlots(doctorId);
        }
    });
  }

  ngOnInit(): void {
    this.supabaseService.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
    });
    this.loadSpecialties();
  }

  // --- Lógica de Navegación y Formularios ---
  
  switchView(view: View, mode: AuthMode = 'login', type: UserType = 'patient') {
    this.authMode.set(mode);
    this.userType.set(type);
    this.currentView.set(view);
  }
  
  switchDashboardTab(tab: DashboardTab) {
    this.dashboardTab.set(tab);
  }

  setUserType(type: UserType) {
    this.userType.set(type);
    this.initForm();
  }

  initForm() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: [null, this.authMode() === 'register' ? [Validators.required] : []],
      specialty_id: [null, this.authMode() === 'register' && this.userType() === 'doctor' ? [Validators.required] : []],
      license_number: [null, this.authMode() === 'register' && this.userType() === 'doctor' ? [Validators.required] : []]
    });
  }
  
  initProfileForm() {
    const profile = this.userProfile();
    this.profileForm = this.fb.group({
      fullName: [profile?.full_name || '', Validators.required],
      ...(profile?.role === 'doctor' && {
        license_number: [profile?.license_number || '', Validators.required]
      })
    });
  }

  async printTicket(ticketID: any){
    this.appointmentTicket.set(ticketID);
    this.urlTicket = this.sanitizer.bypassSecurityTrustResourceUrl(this.urlTicketBase + ticketID);
  }

  async downloadAppointments(patientID: string){
    this.urlCitasExcel = this.sanitizer.bypassSecurityTrustResourceUrl(this.urlCitasExcelBase + patientID);
    window.open(this.urlCitasExcelBase + patientID);
  }

  // --- Lógica de Autenticación ---
  async handleAuth() {
    if (this.authForm.invalid) return;
    this.loading.set(true);
    const { email, password, fullName, specialty_id, license_number } = this.authForm.value;

    try {
      if (this.authMode() === 'login') {
        const { error } = await this.supabaseService.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await this.supabaseService.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: this.userType(),
              specialty_id: this.userType() === 'doctor' ? specialty_id : null,
              license_number: this.userType() === 'doctor' ? license_number : null
            }
          }
        });
        if (error) throw error;
        alert('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      this.loading.set(false);
    }
  }

  async handleLogout() {
    await this.supabaseService.supabase.auth.signOut();
    this.session.set(null);
    this.userProfile.set(null);
    this.upcomingAppointments.set([]);
    this.pastAppointments.set([]);
    this.mySchedule.set([]);
    this.currentView.set('landing');
  }

  // --- Lógica de Datos ---

  async getProfile(userId: string) {
    const { data, error } = await this.supabaseService.supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) this.userProfile.set(data);
    if (error) console.error('Error fetching profile:', error);
  }

  async handleProfileUpdate() {
    if (this.profileForm.invalid || !this.session()) return;
    this.loading.set(true);
    
    const { data, error } = await this.supabaseService.supabase.from('profiles').update(this.profileForm.value).eq('id', this.session()!.user.id).select().single();

    if (error) {
      alert(`Error al actualizar el perfil: ${error.message}`);
    } else {
      this.userProfile.set(data);
      alert('Perfil actualizado con éxito.');
    }
    this.loading.set(false);
  }
  
  async loadSpecialties() {
    const { data } = await this.supabaseService.supabase.from('specialties').select('*');
    this.specialties.set(data || []);
  }

  async loadDoctorsBySpecialty(specialtyId: string) {
      let query = this.supabaseService.supabase.from('profiles').select('*').eq('role', 'doctor');
      if (specialtyId) {
          query = query.eq('specialty_id', specialtyId);
      }
      const { data } = await query;
      this.availableDoctors.set(data || []);
  }

  // --- Lógica de Citas ---
  
  loadAllAppointments() {
    if (this.userProfile()?.role === 'patient') {
      this.loadAppointmentsAsPatient();
    } else if (this.userProfile()?.role === 'doctor') {
      this.loadAppointmentsAsDoctor();
    }
  }
  
  private filterAndSetAppointments(allAppointments: Appointment[]) {
    const now = new Date();
    const upcoming = allAppointments.filter(apt => new Date(apt.appointment_time) >= now && apt.status === 'scheduled');
    const past = allAppointments.filter(apt => new Date(apt.appointment_time) < now || apt.status !== 'scheduled');
    upcoming.sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
    past.sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
    this.upcomingAppointments.set(upcoming);
    this.pastAppointments.set(past);
  }

  async loadAppointmentsAsPatient() {
    const userId = this.session()?.user.id;
    if (!userId) return;
    const { data, error } = await this.supabaseService.supabase
      .from('appointments')
      .select('*, doctor:profiles!doctor_id(full_name), prescriptions(id)')
      .eq('patient_id', userId);
    if (error) console.error('Error fetching patient appointments:', error.message);
    else this.filterAndSetAppointments(data || []);
  }
  
  async loadAppointmentsAsDoctor() {
    const userId = this.session()?.user.id;
    if (!userId) return;
    const { data, error } = await this.supabaseService.supabase
      .from('appointments')
      .select('*, patient:profiles!patient_id(full_name), prescriptions(id)')
      .eq('doctor_id', userId);
    if (error) console.error('Error fetching doctor appointments:', error.message);
    else this.filterAndSetAppointments(data || []);
  }

  async submitDiagnosis(appointmentId: number, diagnosis: string) {
    if(!diagnosis) {
        alert('Por favor, ingrese un diagnóstico.');
        return;
    }
    const { error } = await this.supabaseService.supabase.from('appointments').update({ diagnosis: diagnosis }).eq('id', appointmentId);
    
    if (error) {
      alert(`Error al guardar el diagnóstico: ${error.message}`);
    } else {
      alert('Diagnóstico guardado.');
      this.loadAllAppointments();
    }
  }
  
  async loadDoctorScheduleAndGenerateSlots(doctorId: string) {
    this.loading.set(true);
    try {
        const { data: scheduleData, error: scheduleError } = await this.supabaseService.supabase.from('schedules').select('*').eq('doctor_id', doctorId);
        if (scheduleError) throw scheduleError;
        const now = new Date().toISOString();
        const { data: appointmentData, error: appointmentError } = await this.supabaseService.supabase.from('appointments').select('appointment_time').eq('doctor_id', doctorId).eq('status', 'scheduled').gte('appointment_time', now);
        if (appointmentError) throw appointmentError;
        const bookedTimes = appointmentData?.map(apt => new Date(apt.appointment_time).toISOString()) || [];
        const slots = this.generateAvailableSlots(scheduleData || [], bookedTimes);
        this.availableSlots.set(slots);
    } catch (error: any) {
        alert(`Error al cargar horarios: ${error.message}`);
    } finally {
        this.loading.set(false);
    }
  }

  generateAvailableSlots(schedules: Schedule[], bookedTimes: string[]): { display: string, value: string }[] {
    const slots: { display: string, value: string }[] = [];
    const now = new Date();
    const appointmentDuration = 30;
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(now.getDate() + i);
        const dayOfWeek = date.getDay(); 
        const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek);
        if (daySchedule) {
            const [startHour, startMinute] = daySchedule.start_time.split(':').map(Number);
            const [endHour, endMinute] = daySchedule.end_time.split(':').map(Number);
            let slotTime = new Date(date);
            slotTime.setHours(startHour, startMinute, 0, 0);
            const endTime = new Date(date);
            endTime.setHours(endHour, endMinute, 0, 0);
            while (slotTime < endTime) {
                if (slotTime > now && !bookedTimes.includes(slotTime.toISOString())) {
                    slots.push({
                        display: slotTime.toLocaleString('es-ES', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        value: slotTime.toISOString()
                    });
                }
                slotTime.setMinutes(slotTime.getMinutes() + appointmentDuration);
            }
        }
    }
    return slots;
  }
  
  prepareAppointmentConfirmation() {
    if (!this.selectedSlot()) return;
  
    const isFollowUp = !!this.followUpState();
    
    const doctorProfile = isFollowUp 
      ? this.userProfile() 
      : this.availableDoctors().find(d => d.id === this.selectedDoctorId());

    const patientName = isFollowUp
      ? this.followUpState()!.patientName
      : this.userProfile()?.full_name;

    this.appointmentToConfirm.set({
      doctorName: doctorProfile?.full_name,
      slot: this.selectedSlot(),
      patientName: patientName
    });
  }
  
  async bookAppointment() {
    const slot = this.appointmentToConfirm()?.slot;
    if (!slot || !this.session()) return;
  
    const isFollowUp = !!this.followUpState();
    const patientId = isFollowUp ? this.followUpState()!.patientId : this.session()!.user.id;
    const doctorId = isFollowUp ? this.session()!.user.id : this.selectedDoctorId();
  
    if (!doctorId) {
      alert('Error: No se ha seleccionado un médico.');
      return;
    }
  
    this.loading.set(true);
    const { error } = await this.supabaseService.supabase.from('appointments').insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_time: new Date(slot.value).toISOString()
    });
  
    if (error) {
      alert(`Error al reservar: ${error.message}`);
    } else {
      alert('Cita reservada con éxito!');
      this.loadAllAppointments();
      if (isFollowUp) {
        this.cancelFollowUp();
      } else {
        this.resetBookingState();
      }
    }
    this.loading.set(false);
  }

  resetBookingState() {
    this.selectedSlot.set(null);
    this.availableSlots.set([]);
    this.selectedDoctorId.set(null);
    this.appointmentToConfirm.set(null);
    this.appointmentTicket.set(null);
    this.followUpState.set(null);
    const docSelect = document.getElementById('docSelect') as HTMLSelectElement;
    if(docSelect) docSelect.value = "";
    const specSelect = document.getElementById('specSelect') as HTMLSelectElement;
    if(specSelect) specSelect.value = "";
  }

  async updateAppointmentStatus(appointmentId: number, status: 'completed' | 'canceled') {
    const { error } = await this.supabaseService.supabase.from('appointments').update({ status: status }).eq('id', appointmentId);
    if (error) alert(`Error al actualizar la cita: ${error.message}`);
    else this.loadAllAppointments();
  }

  async submitFeedback(appointmentId: number, rating: string, feedback: string) {
    if (!rating) { alert('Por favor, selecciona una calificación.'); return; }
    const { error } = await this.supabaseService.supabase.from('appointments').update({ rating: parseInt(rating, 10), feedback: feedback, }).eq('id', appointmentId);
    if (error) alert(`Error al enviar la reseña: ${error.message}`);
    else { alert('¡Gracias por tu reseña!'); this.loadAllAppointments(); }
  }

  // --- Lógica de Horarios ---
  async loadMySchedule() {
    if (!this.session()) return;
    const { data } = await this.supabaseService.supabase.from('schedules').select('*').eq('doctor_id', this.session()!.user.id);
    this.mySchedule.set(data || []);
  }

  async addSchedule(day: string, startTime: string, endTime: string) {
    if (!day || !startTime || !endTime || !this.session()) return;
    this.loading.set(true);
    const { error } = await this.supabaseService.supabase.from('schedules').insert({ doctor_id: this.session()!.user.id, day_of_week: parseInt(day), start_time: startTime, end_time: endTime });
    if (error) alert(`Error al añadir horario: ${error.message}`);
    else this.loadMySchedule();
    this.loading.set(false);
  }

  async deleteSchedule(scheduleId: number) {
    const { error } = await this.supabaseService.supabase.from('schedules').delete().eq('id', scheduleId);
    if (error) alert(`Error al borrar horario: ${error.message}`);
    else this.loadMySchedule();
  }

  // --- FUNCIONES DE SEGUIMIENTO ---
  startFollowUp(appointment: Appointment) {
    if (!appointment.patient_id || !appointment.patient?.full_name) {
      alert('No se puede programar el seguimiento: faltan datos del paciente.');
      return;
    }
    this.followUpState.set({
      patientId: appointment.patient_id,
      patientName: appointment.patient.full_name,
    });
    this.selectedDoctorId.set(this.session()!.user.id);
  }

  cancelFollowUp() {
    this.followUpState.set(null);
    this.selectedDoctorId.set(null);
    this.availableSlots.set([]);
    this.selectedSlot.set(null);
    this.appointmentToConfirm.set(null);
    this.appointmentTicket.set(null);
  }

  // --- LÓGICA DE RECETAS ---

  startPrescription(appointment: Appointment) {
    this.prescriptionState.set({
      appointment: appointment,
      items: [{ medication: '', dosage: '', frequency: '', duration: '' }]
    });
  }

  cancelPrescription() {
    this.prescriptionState.set(null);
  }

  addMedicationItem() {
    this.prescriptionState.update(state => {
      if (!state) return null;
      state.items.push({ medication: '', dosage: '', frequency: '', duration: '' });
      return { ...state };
    });
  }

  removeMedicationItem(index: number) {
    this.prescriptionState.update(state => {
      if (!state) return null;
      state.items.splice(index, 1);
      return { ...state };
    });
  }

  async savePrescription() {
    const state = this.prescriptionState();
    if (!state || state.items.length === 0) return;

    this.loading.set(true);
    try {
      const { data: prescription, error: prescriptionError } = await this.supabaseService.supabase
        .from('prescriptions')
        .insert({
          appointment_id: state.appointment.id!,
          patient_id: state.appointment.patient_id,
          doctor_id: state.appointment.doctor_id,
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      const itemsToInsert = state.items
        .filter(item => item.medication)
        .map(item => ({
          prescription_id: prescription.id,
          ...item
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await this.supabaseService.supabase
          .from('prescription_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }
      
      alert('Receta guardada con éxito.');
      this.cancelPrescription();
      this.loadAllAppointments();
    } catch (error: any) {
      alert(`Error al guardar la receta: ${error.message}`);
    } finally {
      this.loading.set(false);
    }
  }

  async loadAndShowPrescription(prescriptionId: number) {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('prescriptions')
        .select('*, items:prescription_items(*)')
        .eq('id', prescriptionId)
        .single();

      if (error) throw error;
      if (data) {
        this.viewedPrescription.set(data as Prescription & { items: PrescriptionItem[] });
      }
    } catch (error: any) {
      alert(`Error al cargar la receta: ${error.message}`);
    } finally {
      this.loading.set(false);
    }
  }

  closePrescription() {
    this.viewedPrescription.set(null);
  }


  // --- Funciones de Ayuda ---
  getDayName(day: number): string {
    return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day];
  }
  
  calculateDoctorRating() {
    const ratedAppointments = this.pastAppointments().filter(apt => apt.rating && apt.rating > 0);
    if (ratedAppointments.length === 0) {
      this.doctorAverageRating.set(0);
      return;
    }
    const totalRating = ratedAppointments.reduce((sum, apt) => sum + apt.rating!, 0);
    const average = totalRating / ratedAppointments.length;
    this.doctorAverageRating.set(parseFloat(average.toFixed(1)));
  }
}