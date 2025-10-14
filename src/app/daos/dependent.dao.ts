// src/app/daos/dependent.dao.ts
import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { Dependent } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class DependentDAO {
  private supabase = inject(SupabaseService).supabase;

  async getDependents(guardianId: string): Promise<Dependent[]> {
    const { data, error } = await this.supabase
      .from('dependents')
      .select('*')
      .eq('guardian_id', guardianId);
    if (error) {
      console.error('Error fetching dependents:', error);
      return [];
    }
    return data;
  }

  async create(dependentData: { full_name: string; guardian_id: string }): Promise<Dependent | null> {
    const { data, error } = await this.supabase
      .from('dependents')
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