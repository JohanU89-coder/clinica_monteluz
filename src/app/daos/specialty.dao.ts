// src/app/daos/specialty.dao.ts
import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { Specialty } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class SpecialtyDAO {
  private supabase = inject(SupabaseService).supabase;

  async getAll(): Promise<Specialty[]> {
    const { data, error } = await this.supabase.from('specialties').select('*');
    if (error) {
      console.error('Error fetching specialties:', error);
      return [];
    }
    return data;
  }
}