package com.clinica.service;

import org.springframework.stereotype.Service;

import com.clinica.model.AppointmentDTO;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

import org.apache.pdfbox.pdmodel.font.PDType1Font;

@Service
public class PdfService {
	
	public ByteArrayOutputStream printTicket(AppointmentDTO apt) throws IOException{
		PDRectangle customSize = new PDRectangle(600, 400);
        PDDocument document = new PDDocument();
        PDPage page = new PDPage(customSize);
        document.addPage(page);

        try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, 30);
            contentStream.setLeading(30f);
            contentStream.newLineAtOffset(50, 350);
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a");

            contentStream.showText("Ticket #" + String.valueOf(apt.getId()));
            contentStream.newLine();
            contentStream.setFont(PDType1Font.HELVETICA, 24);
            contentStream.showText("Fecha y hora: " +  String.valueOf(apt.getAppointmentTime().format(formatter)));
            contentStream.newLine();
            contentStream.showText("Doctor: Dr. " + String.valueOf(apt.getDoctor().getFullName()));
            contentStream.newLine();
            contentStream.showText("Paciente: " + String.valueOf(apt.getPatient().getFullName()));
            contentStream.newLine();
            contentStream.showText("Especialidad: " + String.valueOf(apt.getDoctor().getSpecialties().getName()));
            contentStream.endText();
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        document.save(out);
        document.close();
        
        return out;
	}
}
