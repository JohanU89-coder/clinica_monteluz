import {computed, effect, inject, Injectable, signal } from '@angular/core';
import { Appointment, Profile } from '../interfaces/models';
import { AppointmentDAO } from '../daos/appointment.dao';
import { AuthService } from './auth.service';
import { AppointmentService } from './appointment.service';
import { LoadingService } from './loading.service';

@Injectable({
    providedIn: 'root'
})
export class ClinicalHistoryService {
    private authService = inject(AuthService);
    private appointmentService = inject(AppointmentService);
    private appointmentDAO = inject(AppointmentDAO);
    private loadingService = inject(LoadingService);

    //señales de estado para este modulo
    uniquePatients = signal<Profile[]>([]);
    selectedPatient = signal<Profile | null>(null);
    patientHistory = signal<Appointment[]>([]);

    constructor() {
        //Este effect se activa cuando cambian las citas pasadas del doctor
        effect(() => {
            const pastAppointments = this.appointmentService.pastAppointments();
            const user = this.authService.userProfile();

            if (user?.role === 'doctor') {
                //Extraemos los pacientes unicos de la lista de citas pasadas
                const patientMap = new Map<string, Profile>();
                pastAppointments.forEach(apt =>{
                    if (apt.patient && !patientMap.has(apt.patient_id)) {
                        patientMap.set(apt.patient_id, { 
                            id: apt.patient_id, 
                            full_name: apt.patient.full_name, 
                        }   as Profile);
                    }
                });
                this.uniquePatients.set(Array.from(patientMap.values()));
            }
        });

        //Este effect se activa cuando el doctor selecciona un paciente
        effect(() => {
            const patient = this.selectedPatient();
            if (patient){
                this.loadHistoryForPatient(patient.id);
            } else {
                this.patientHistory.set([]);
            }
        });    
    }

    selectPatient(patient: Profile | null) {
        this.selectedPatient.set(patient);
    }

    private async loadHistoryForPatient(patientId: string) {
        const doctor = this.authService.userProfile();
        if (!doctor) return;

        this.loadingService.show();
        try{
            //usaremos el metodo existente, pero podrias crear uno mas eficiente en el DAO
            const allPatientAppointments = await this.appointmentDAO.getByPatientId(patientId);
            //Filtramos solo las citas del doctor actual y las ordenamos
            const historyWithCurrentDoctor = allPatientAppointments
                .filter(apt => apt.doctor_id === doctor.id)
                .sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
            this.patientHistory.set(historyWithCurrentDoctor);
        }   finally{
            this.loadingService.hide();
        }
    }
}

    