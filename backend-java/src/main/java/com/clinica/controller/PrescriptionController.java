package com.clinica.controller;

import com.clinica.model.*;
import com.clinica.service.PdfGenerationService;
import com.clinica.service.SupabaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:4200")
public class PrescriptionController {

    @Autowired
    private SupabaseService supabaseService;

    @Autowired
    private PdfGenerationService pdfGenerationService;

    @GetMapping("/{id}/export-pdf")
    public ResponseEntity<byte[]> exportPrescriptionPdf(@PathVariable Long id) {
        try {
            System.out.println("=== EXPORTANDO RECETA PARA CITA: " + id + " ===");

            // 1. Obtener datos de Supabase
            AppointmentDTO appointment = supabaseService.getAppointmentWithDetails(id);

            if (appointment == null) {
                System.out.println("ERROR: No se encontró la cita");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            System.out.println("✓ Cita encontrada");
            System.out.println("  Paciente: "
                    + (appointment.getPatient() != null ? appointment.getPatient().getFullName() : "NULL"));
            System.out.println(
                    "  Doctor: " + (appointment.getDoctor() != null ? appointment.getDoctor().getFullName() : "NULL"));

            // 2. Obtener prescription_id
            Long prescriptionId = supabaseService.getPrescriptionIdByAppointment(id);

            if (prescriptionId == null) {
                System.out.println("ERROR: No se encontró receta para esta cita");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }

            System.out.println("✓ Receta encontrada: ID = " + prescriptionId);

            // 3. Obtener items
            List<PrescriptionItemDTO> items = supabaseService.getPrescriptionItems(prescriptionId);

            System.out.println("✓ Items encontrados: " + items.size());

            // 4. Generar PDF
            byte[] pdfBytes = pdfGenerationService.generatePrescriptionPdf(appointment, items);

            System.out.println("✓ Documento generado: " + pdfBytes.length + " bytes");

            // 5. Configurar headers para descarga
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", "receta-monteluz-" + id + ".docx");
            headers.setContentLength(pdfBytes.length);

            System.out.println("=== EXPORTACIÓN COMPLETADA ===");

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (IOException e) {
            System.out.println("ERROR IO: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        } catch (Exception e) {
            System.out.println("ERROR GENERAL: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
