// src/app/daos/profile.dao.ts

import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { Profile } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class ProfileDAO {
  private supabase = inject(SupabaseService).supabase;

  async getProfileById(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*, specialties(id, name, description)')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile;
  }

  async getDoctors(specialtyId?: number): Promise<Profile[]> {
    let query = this.supabase.from('profiles').select('*, specialties(id, name)').eq('role', 'doctor');
    if (specialtyId) {
      query = query.eq('specialty_id', specialtyId);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching doctors:', error);
      return [];
    }
    return data as Profile[];
  }

  // --- MÉTODO QUE FALTABA ---
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*, specialties(id, name, description)') // Vuelve a seleccionar con la relación
      .single();

    if (error) {
        console.error('Error updating profile:', error);
        return null;
    }
    return data as Profile;
  }

   async getDependents(guardianId: string): Promise<Profile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('guardian_id', guardianId);

    if (error) {
      console.error('Error fetching dependents:', error);
      return [];
    }
    return data;
  }

  // --- MÉTODO NUEVO ---
  async createDependent(dependentData: Partial<Profile>): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert(dependentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating dependent:', error);
      return null;
    }
    return data;
  }
}