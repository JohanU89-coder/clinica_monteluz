package com.clinica.model;

import java.time.LocalDateTime;
import java.util.List;

public class AppointmentDTO {
    private Long id;
    private String patientId;
    private String doctorId;
    private LocalDateTime appointmentTime;
    private String status;
    private String diagnosis;
    private Integer rating;
    private String feedback;
    
    private ProfileDTO patient;
    private ProfileDTO doctor;
    private List<PrescriptionDTO> prescriptions;
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    
    public LocalDateTime getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(LocalDateTime appointmentTime) { this.appointmentTime = appointmentTime; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    
    public ProfileDTO getPatient() { return patient; }
    public void setPatient(ProfileDTO patient) { this.patient = patient; }
    
    public ProfileDTO getDoctor() { return doctor; }
    public void setDoctor(ProfileDTO doctor) { this.doctor = doctor; }
    
    public List<PrescriptionDTO> getPrescriptions() { return prescriptions; }
    public void setPrescriptions(List<PrescriptionDTO> prescriptions) { this.prescriptions = prescriptions; }
}
