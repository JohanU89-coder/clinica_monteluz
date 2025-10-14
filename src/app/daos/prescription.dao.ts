// src/app/daos/prescription.dao.ts

import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { Prescription, PrescriptionItem } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class PrescriptionDAO {
  private supabase = inject(SupabaseService).supabase;

  async getById(id: number): Promise<Prescription | null> {
    // Solo incluir el foreign key que existe (doctor_id)
    // Patient_id lo obtendremos manualmente
    const { data, error } = await this.supabase
      .from('prescriptions')
      .select(`
        *,
        items:prescription_items(*),
        doctor:profiles!prescriptions_doctor_id_fkey(full_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching prescription:', error);
      return null;
    }

    // Obtener datos del paciente manualmente (puede estar en profiles o dependents)
    if (data) {
      let patientData = null;

      // Intentar en profiles primero
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', data.patient_id)
        .maybeSingle();

      if (profile) {
        patientData = profile;
      } else {
        // Si no está en profiles, buscar en dependents
        const { data: dependent } = await this.supabase
          .from('dependents')
          .select('id, full_name')
          .eq('id', data.patient_id)
          .maybeSingle();
        
        patientData = dependent;
      }

      return {
        ...data,
        patient: patientData
      } as Prescription;
    }

    return data as Prescription;
  }

  async create(
    prescriptionData: Omit<Prescription, 'id' | 'created_at' | 'items'>,
    itemsData: Omit<PrescriptionItem, 'id' | 'prescription_id'>[]
  ): Promise<Prescription | null> {
    const { data: prescription, error: prescriptionError } = await this.supabase
      .from('prescriptions')
      .insert(prescriptionData)
      .select()
      .single();
    
    if (prescriptionError) {
      console.error('Error creating prescription:', prescriptionError);
      return null;
    }

    const itemsToInsert = itemsData.map(item => ({
      ...item,
      prescription_id: prescription.id,
    }));
    
    const { error: itemsError } = await this.supabase
      .from('prescription_items')
      .insert(itemsToInsert);
      
    if (itemsError) {
      console.error('Error creating prescription items:', itemsError);
      return null;
    }

    return prescription as Prescription;
  }
}
