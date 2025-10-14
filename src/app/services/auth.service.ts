import { inject, Injectable, signal, effect, computed } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase.service';
import { Profile, Dependent } from '../interfaces/models'; // <-- Importa Dependent
import { ProfileDAO } from '../daos/profile.dao';
import { DependentDAO } from '../daos/dependent.dao'; // <-- Importa DependentDAO
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService).supabase;
  private profileDAO = inject(ProfileDAO);
  private dependentDAO = inject(DependentDAO); // <-- Inyecta el nuevo DAO
  private notificationService = inject(NotificationService);

  session = signal<Session | null>(null);
  userProfile = signal<Profile | null>(null);
  dependents = signal<Dependent[]>([]); // <-- El tipo ahora es Dependent[]

  // Combina el perfil del tutor y sus dependientes en una sola lista para agendar
  bookableProfiles = computed(() => {
    const profile = this.userProfile();
    if (!profile) return [];
    // Mapea los dependientes para que tengan la misma estructura que un perfil simple
    const dependentProfiles = this.dependents().map(d => ({ 
      id: d.id, 
      full_name: d.full_name,
      role: 'patient' as const // Asigna el rol explícitamente
    }));
    return [profile, ...dependentProfiles];
  });

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => this.session.set(session));

    effect(() => {
      const currentSession = this.session();
      if (currentSession) {
        this.getProfile(currentSession.user.id);
      } else {
        this.userProfile.set(null);
        this.dependents.set([]); // Limpia los dependientes al cerrar sesión
      }
    });

    // Carga los dependientes cuando el perfil del tutor está listo
    effect(() => {
      const user = this.userProfile();
      if (user && user.role === 'patient') {
        this.loadDependents(user.id);
      }
    });
  }
  
  private async getProfile(userId: string) {
    const profile = await this.profileDAO.getProfileById(userId);
    this.userProfile.set(profile);
  }

  async loadDependents(guardianId: string) {
    const data = await this.dependentDAO.getDependents(guardianId);
    this.dependents.set(data);
  }

  async addDependent(name: string) {
    const user = this.userProfile();
    if (!user) return;

    // Llama al nuevo DAO para crear en la tabla 'dependents'
    const newDependent = await this.dependentDAO.create({
      full_name: name,
      guardian_id: user.id
    });

    if (newDependent) {
      this.dependents.update(current => [...current, newDependent]);
      this.notificationService.showSuccess('Familiar añadido con éxito.');
    } else {
      this.notificationService.showError('Error al añadir familiar.');
    }
  }

  async signIn(credentials: { email: string, password: string }) {
    return this.supabase.auth.signInWithPassword(credentials);
  }

  async signUp(credentials: any) {
    const { email, password, fullName, role, specialty_id, license_number } = credentials;
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          specialty_id: role === 'doctor' ? specialty_id : null,
          license_number: role === 'doctor' ? license_number : null
        }
      }
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async updateProfile(updates: { full_name: string; license_number?: string }) {
    const user = this.userProfile();
    if (!user) {
      this.notificationService.showError('No hay un usuario activo para actualizar.');
      return null;
    }

    const updatedProfile = await this.profileDAO.updateProfile(user.id, updates);

    if (updatedProfile) {
      this.userProfile.set(updatedProfile);
      this.notificationService.showSuccess('Perfil actualizado con éxito.');
    } else {
      this.notificationService.showError('Hubo un error al actualizar el perfil.');
    }
    
    return updatedProfile;
  }
}