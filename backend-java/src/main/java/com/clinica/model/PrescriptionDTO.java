package com.clinica.model;

import java.time.LocalDateTime;
import java.util.List;

public class PrescriptionDTO {
    private Long id;
    private Long appointmentId;
    private String patientId;
    private String doctorId;
    private LocalDateTime createdAt;
    private List<PrescriptionItemDTO> items;

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(String doctorId) {
        this.doctorId = doctorId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<PrescriptionItemDTO> getItems() {
        return items;
    }

    public void setItems(List<PrescriptionItemDTO> items) {
        this.items = items;
    }
}
