package com.clinica.service;

import com.clinica.model.*;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfGenerationService {

    public byte[] generatePrescriptionPdf(AppointmentDTO appointment, List<PrescriptionItemDTO> items)
            throws IOException {
        XWPFDocument document = new XWPFDocument();

        // 1. ENCABEZADO
        XWPFParagraph title = document.createParagraph();
        title.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun titleRun = title.createRun();
        titleRun.setText("Clínica Monteluz");
        titleRun.setBold(true);
        titleRun.setFontSize(18);

        XWPFParagraph subtitle = document.createParagraph();
        subtitle.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun subtitleRun = subtitle.createRun();
        subtitleRun.setText("Receta Médica");
        subtitleRun.setFontSize(14);

        // Espacio
        document.createParagraph();

        // 2. TABLA DE INFORMACIÓN
        XWPFTable infoTable = document.createTable(3, 2);

        // Fila 1: Paciente
        String patientName = (appointment.getPatient() != null && appointment.getPatient().getFullName() != null)
                ? appointment.getPatient().getFullName()
                : "Paciente ID: " + appointment.getPatientId();
        infoTable.getRow(0).getCell(0).setText("Paciente: " + patientName);

        // Fila 1: Doctor
        String doctorName = (appointment.getDoctor() != null && appointment.getDoctor().getFullName() != null)
                ? appointment.getDoctor().getFullName()
                : "Doctor ID: " + appointment.getDoctorId();
        infoTable.getRow(0).getCell(1).setText("Doctor: " + doctorName);

        // Fila 2: Fecha
        String appointmentDate = "N/A";
        if (appointment.getAppointmentTime() != null) {
            appointmentDate = appointment.getAppointmentTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }
        infoTable.getRow(1).getCell(0).setText("Fecha: " + appointmentDate);

        // Fila 2: Especialidad
        String specialty = "General";
        if (appointment.getDoctor() != null && appointment.getDoctor().getSpecialties() != null) {
            specialty = appointment.getDoctor().getSpecialties().getName();
        }
        infoTable.getRow(1).getCell(1).setText("Especialidad: " + specialty);

        // Fila 3: Licencia del doctor
        String license = (appointment.getDoctor() != null && appointment.getDoctor().getLicenseNumber() != null)
                ? appointment.getDoctor().getLicenseNumber()
                : "N/A";
        infoTable.getRow(2).getCell(0).setText("Lic. Médica: " + license);
        infoTable.getRow(2).getCell(1).setText("ID Cita: " + appointment.getId());

        // Espacio
        document.createParagraph();

        // 3. DIAGNÓSTICO
        XWPFParagraph diagLabel = document.createParagraph();
        XWPFRun diagRun = diagLabel.createRun();
        diagRun.setText("Diagnóstico:");
        diagRun.setBold(true);
        diagRun.setFontSize(12);

        XWPFParagraph diagText = document.createParagraph();
        String diagnosis = (appointment.getDiagnosis() != null && !appointment.getDiagnosis().isEmpty())
                ? appointment.getDiagnosis()
                : "No especificado";
        diagText.createRun().setText(diagnosis);

        // Espacio
        document.createParagraph();

        // 4. PRESCRIPCIÓN
        XWPFParagraph rxLabel = document.createParagraph();
        XWPFRun rxRun = rxLabel.createRun();
        rxRun.setText("℞ Prescripción:");
        rxRun.setBold(true);
        rxRun.setFontSize(12);

        // Tabla de medicamentos
        if (items != null && !items.isEmpty()) {
            XWPFTable medTable = document.createTable(items.size() + 1, 5);

            // Encabezado
            XWPFTableRow headerRow = medTable.getRow(0);
            setTableHeaderCell(headerRow.getCell(0), "Medicamento");
            setTableHeaderCell(headerRow.getCell(1), "Dosis");
            setTableHeaderCell(headerRow.getCell(2), "Frecuencia");
            setTableHeaderCell(headerRow.getCell(3), "Duración");
            setTableHeaderCell(headerRow.getCell(4), "Notas");

            // Datos
            for (int i = 0; i < items.size(); i++) {
                PrescriptionItemDTO item = items.get(i);
                XWPFTableRow row = medTable.getRow(i + 1);
                row.getCell(0).setText(item.getMedication() != null ? item.getMedication() : "-");
                row.getCell(1).setText(item.getDosage() != null ? item.getDosage() : "-");
                row.getCell(2).setText(item.getFrequency() != null ? item.getFrequency() : "-");
                row.getCell(3).setText(item.getDuration() != null ? item.getDuration() : "-");
                row.getCell(4).setText(item.getNotes() != null ? item.getNotes() : "-");
            }
        } else {
            XWPFParagraph noMeds = document.createParagraph();
            noMeds.createRun().setText("Sin medicamentos prescritos.");
        }

        // Espacio
        document.createParagraph();
        document.createParagraph();

        // Pie de página
        XWPFParagraph footer = document.createParagraph();
        footer.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun footerRun = footer.createRun();
        footerRun.setText("___________________________");

        XWPFParagraph signature = document.createParagraph();
        signature.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun sigRun = signature.createRun();
        sigRun.setText("Firma del Médico");
        sigRun.setFontSize(10);

        XWPFParagraph signatureName = document.createParagraph();
        signatureName.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun sigNameRun = signatureName.createRun();
        sigNameRun.setText(doctorName);
        sigNameRun.setFontSize(10);

        // Convertir a ByteArray
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        document.write(out);
        document.close();

        System.out.println("✓ Documento Word generado exitosamente");
        return out.toByteArray();
    }

    private void setTableHeaderCell(XWPFTableCell cell, String text) {
        cell.setColor("E0E0E0");
        XWPFParagraph paragraph = cell.getParagraphs().get(0);
        XWPFRun run = paragraph.createRun();
        run.setText(text);
        run.setBold(true);
    }
}
