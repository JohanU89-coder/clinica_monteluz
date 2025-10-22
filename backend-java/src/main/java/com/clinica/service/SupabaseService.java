package com.clinica.service;

import com.clinica.model.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;

@Service
public class SupabaseService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public SupabaseService() {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }

    public AppointmentDTO getAppointmentWithDetails(Long appointmentId) {
        try {
            System.out.println("=== INICIANDO CONSULTA A SUPABASE ===");
            System.out.println("Supabase URL: " + supabaseUrl);
            System.out.println("API Key (primeros 20 chars): "
                    + supabaseKey.substring(0, Math.min(20, supabaseKey.length())) + "...");

            // 1. Obtener appointment básico
            String aptUrl = supabaseUrl + "/rest/v1/appointments?id=eq." + appointmentId + "&select=*";
            System.out.println("URL de consulta: " + aptUrl);

            String aptResponse = webClient.get()
                    .uri(aptUrl)
                    .header("apikey", supabaseKey)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            System.out.println("Respuesta de Supabase: " + aptResponse);

            JsonNode appointments = objectMapper.readTree(aptResponse);
            System.out.println("Número de citas encontradas: " + appointments.size());

            if (appointments.isEmpty()) {
                System.out.println("ERROR: Array vacío - La consulta no devolvió resultados");
                return null;
            }

            JsonNode aptNode = appointments.get(0);
            System.out.println("Cita encontrada: " + aptNode.toString());

            AppointmentDTO appointment = new AppointmentDTO();
            appointment.setId(aptNode.get("id").asLong());
            appointment.setPatientId(aptNode.get("patient_id").asText());
            appointment.setDoctorId(aptNode.get("doctor_id").asText());
            appointment.setDiagnosis(
                    aptNode.has("diagnosis") && !aptNode.get("diagnosis").isNull() ? aptNode.get("diagnosis").asText()
                            : null);

            System.out.println("✓ Appointment parseado correctamente");

            // 2. Obtener datos del paciente
            System.out.println("Consultando datos del paciente: " + appointment.getPatientId());
            String patientUrl = supabaseUrl + "/rest/v1/profiles?id=eq." + appointment.getPatientId() + "&select=*";
            String patientResponse = webClient.get()
                    .uri(patientUrl)
                    .header("apikey", supabaseKey)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode patients = objectMapper.readTree(patientResponse);
            if (!patients.isEmpty()) {
                JsonNode patientNode = patients.get(0);
                ProfileDTO patient = new ProfileDTO();
                patient.setId(patientNode.get("id").asText());
                patient.setFullName(patientNode.get("full_name").asText());
                appointment.setPatient(patient);
                System.out.println("✓ Paciente obtenido: " + patient.getFullName());
            } else {
                System.out.println("⚠ No se encontró el paciente");
            }

            // 3. Obtener datos del doctor
            System.out.println("Consultando datos del doctor: " + appointment.getDoctorId());
            String doctorUrl = supabaseUrl + "/rest/v1/profiles?id=eq." + appointment.getDoctorId() + "&select=*";
            String doctorResponse = webClient.get()
                    .uri(doctorUrl)
                    .header("apikey", supabaseKey)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode doctors = objectMapper.readTree(doctorResponse);
            if (!doctors.isEmpty()) {
                JsonNode doctorNode = doctors.get(0);
                ProfileDTO doctor = new ProfileDTO();
                doctor.setId(doctorNode.get("id").asText());
                doctor.setFullName(doctorNode.get("full_name").asText());
                doctor.setLicenseNumber(doctorNode.has("license_number") && !doctorNode.get("license_number").isNull()
                        ? doctorNode.get("license_number").asText()
                        : null);

                // Obtener especialidad si existe
                if (doctorNode.has("specialty_id") && !doctorNode.get("specialty_id").isNull()) {
                    int specialtyId = doctorNode.get("specialty_id").asInt();
                    System.out.println("Consultando especialidad: " + specialtyId);
                    String specUrl = supabaseUrl + "/rest/v1/specialties?id=eq." + specialtyId + "&select=*";
                    String specResponse = webClient.get()
                            .uri(specUrl)
                            .header("apikey", supabaseKey)
                            .header("Authorization", "Bearer " + supabaseKey)
                            .retrieve()
                            .bodyToMono(String.class)
                            .block();

                    JsonNode specialties = objectMapper.readTree(specResponse);
                    if (!specialties.isEmpty()) {
                        JsonNode specNode = specialties.get(0);
                        SpecialtyDTO specialty = new SpecialtyDTO();
                        specialty.setId(specNode.get("id").asInt());
                        specialty.setName(specNode.get("name").asText());
                        doctor.setSpecialties(specialty);
                        System.out.println("✓ Especialidad obtenida: " + specialty.getName());
                    }
                }

                appointment.setDoctor(doctor);
                System.out.println("✓ Doctor obtenido: " + doctor.getFullName());
            } else {
                System.out.println("⚠ No se encontró el doctor");
            }

            System.out.println("=== CONSULTA COMPLETADA EXITOSAMENTE ===");
            return appointment;

        } catch (Exception e) {
            System.out.println("!!! EXCEPCIÓN CAPTURADA !!!");
            System.out.println("Tipo: " + e.getClass().getName());
            System.out.println("Mensaje: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error obteniendo datos de Supabase: " + e.getMessage());
        }
    }

    public List<PrescriptionItemDTO> getPrescriptionItems(Long prescriptionId) {
        try {
            System.out.println("Consultando items de prescripción: " + prescriptionId);
            String url = supabaseUrl + "/rest/v1/prescription_items?prescription_id=eq." + prescriptionId + "&select=*";

            String response = webClient.get()
                    .uri(url)
                    .header("apikey", supabaseKey)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            System.out.println("Respuesta de prescription_items: " + response);

            JsonNode items = objectMapper.readTree(response);
            List<PrescriptionItemDTO> result = new ArrayList<>();

            for (JsonNode item : items) {
                PrescriptionItemDTO dto = new PrescriptionItemDTO();
                dto.setId(item.get("id").asLong());
                dto.setPrescriptionId(item.get("prescription_id").asLong());
                dto.setMedication(
                        item.has("medication") && !item.get("medication").isNull() ? item.get("medication").asText()
                                : null);
                dto.setDosage(item.has("dosage") && !item.get("dosage").isNull() ? item.get("dosage").asText() : null);
                dto.setFrequency(
                        item.has("frequency") && !item.get("frequency").isNull() ? item.get("frequency").asText()
                                : null);
                dto.setDuration(
                        item.has("duration") && !item.get("duration").isNull() ? item.get("duration").asText() : null);
                dto.setNotes(item.has("notes") && !item.get("notes").isNull() ? item.get("notes").asText() : null);
                result.add(dto);
                System.out.println("  ✓ Medicamento: " + dto.getMedication());
            }

            System.out.println("✓ Total items obtenidos: " + result.size());
            return result;

        } catch (Exception e) {
            System.out.println("!!! ERROR en getPrescriptionItems !!!");
            e.printStackTrace();
            throw new RuntimeException("Error obteniendo items de prescripción: " + e.getMessage());
        }
    }

    public Long getPrescriptionIdByAppointment(Long appointmentId) {
        try {
            System.out.println("Buscando prescription_id para appointment: " + appointmentId);
            String url = supabaseUrl + "/rest/v1/prescriptions?appointment_id=eq." + appointmentId
                    + "&select=id&limit=1";

            String response = webClient.get()
                    .uri(url)
                    .header("apikey", supabaseKey)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            System.out.println("Respuesta de prescriptions: " + response);

            JsonNode prescriptions = objectMapper.readTree(response);
            if (prescriptions.isEmpty()) {
                System.out.println("⚠ No se encontró prescripción para esta cita");
                return null;
            }

            Long prescriptionId = prescriptions.get(0).get("id").asLong();
            System.out.println("✓ Prescription ID encontrado: " + prescriptionId);
            return prescriptionId;

        } catch (Exception e) {
            System.out.println("!!! ERROR en getPrescriptionIdByAppointment !!!");
            e.printStackTrace();
            return null;
        }
    }
}
