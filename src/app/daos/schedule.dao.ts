// src/app/daos/schedule.dao.ts
import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { Schedule } from '../interfaces/models';

@Injectable({ providedIn: 'root' })
export class ScheduleDAO {
    private supabase = inject(SupabaseService).supabase;

    public async getByDoctorId(doctorId: string): Promise<Schedule[]> {
        const { data, error } = await this.supabase
            .from('schedules')
            .select('*')
            .eq('doctor_id', doctorId)
            .order('day_of_week', { ascending: true });

        if (error) {
            console.error('Error fetching schedules:', error);
            return [];
        }
        return data;
    }

    public async add(scheduleData: Omit<Schedule, 'id'>): Promise<Schedule | null> {
        const { data, error } = await this.supabase
            .from('schedules')
            .insert(scheduleData)
            .select()
            .single();

        if (error) {
            console.error('Error adding schedule:', error);
            return null;
        }
        return data;
    }

    public async delete(scheduleId: number): Promise<boolean> {
        const { error } = await this.supabase
            .from('schedules')
            .delete()
            .eq('id', scheduleId);

        if (error) {
            console.error('Error deleting schedule:', error);
            return false;
        }
        return true;
    }
}