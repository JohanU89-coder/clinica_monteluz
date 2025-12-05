package com.clinica.model;

public class ProfileDTO {
    private String id;
    private String fullName;
    private String email;
    private String role;
    private String licenseNumber;
    private SpecialtyDTO specialties;
    
    // Getters y Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    
    public SpecialtyDTO getSpecialties() { return specialties; }
    public void setSpecialties(SpecialtyDTO specialties) { this.specialties = specialties; }
}

