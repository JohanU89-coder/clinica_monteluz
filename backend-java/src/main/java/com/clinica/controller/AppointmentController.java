package com.clinica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clinica.model.AppointmentDTO;
import com.clinica.service.ExcelService;
import com.clinica.service.PdfService;
import com.clinica.service.SupabaseService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:4200")
public class AppointmentController {

	@Autowired
    private SupabaseService supabaseService;

    @Autowired
    private PdfService pdfService;

    @Autowired
    private ExcelService excelService;
    
    @GetMapping("/ticket/{id}")
    public ResponseEntity<byte[]> printTicket(@PathVariable Long id) throws IOException {
    	
    	AppointmentDTO appointment = supabaseService.getAppointmentWithDetails(id);
    	
    	ByteArrayOutputStream out = pdfService.printTicket(appointment);
    	HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        //headers.setContentDispositionFormData("inline", "ticket.pdf");
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=ticket.pdf");

        return ResponseEntity
                .ok()
                .headers(headers)
                .body(out.toByteArray());
    }
    
    @GetMapping("/excel/{id}")
    public ResponseEntity<byte[]> printExcel(@PathVariable String id) throws Exception {    	
    	List<AppointmentDTO> apts = supabaseService.getAppointmentsByPatient(id);
    	
    	ByteArrayOutputStream out = excelService.printList(apts);
    	HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=citas.xlsx");

        return ResponseEntity
                .ok()
                .headers(headers)
                .body(out.toByteArray());
    }
}
