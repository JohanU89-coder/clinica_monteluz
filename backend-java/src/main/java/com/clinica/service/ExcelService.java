package com.clinica.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Service;

import com.clinica.model.AppointmentDTO;

@Service
public class ExcelService {
	public ByteArrayOutputStream printList(List<AppointmentDTO> apts) throws IOException{
		Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Citas");

        // Estilo encabezado
        CellStyle headerStyle = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        headerStyle.setFont(font);

        String[] columnas = {"ID", "Fecha y hora", "Doctor", "Paciente", "Especialidad"};
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < columnas.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(columnas[i]);
            cell.setCellStyle(headerStyle);
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a");
        int i = 1;
        for (AppointmentDTO apt: apts) {
            Row row = sheet.createRow(i);
            row.createCell(0).setCellValue(String.valueOf(apt.getId())); // ID
            row.createCell(1).setCellValue(apt.getAppointmentTime().format(formatter)); // Fecha y hora
            row.createCell(2).setCellValue("Dr. " + String.valueOf(apt.getDoctor().getFullName()));
            row.createCell(3).setCellValue(String.valueOf(apt.getPatient().getFullName()));
            row.createCell(4).setCellValue(String.valueOf(apt.getDoctor().getSpecialties().getName()));
            i++;
        }

        for (int p = 0; p < columnas.length; p++) {
            sheet.autoSizeColumn(p);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        
        return out;
	}
}
