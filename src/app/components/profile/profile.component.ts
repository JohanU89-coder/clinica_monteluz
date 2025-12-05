import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  isEditing = signal(false);
  profileForm!: FormGroup;

  // Paleta de colores para avatares
  private avatarColors = [
    '#e57373', '#f06292', '#ba68c8', '#9575cd', 
    '#7986cb', '#64b5f6', '#4dd0e1', '#4db6ac', 
    '#81c784', '#aed581', '#ffb74d', '#ff8a65'
  ];

  constructor() {
    this.initForm();
  }

  initForm() {
    const profile = this.authService.userProfile();
    this.profileForm = this.fb.group({
      full_name: [profile?.full_name || '', [Validators.required, Validators.minLength(3)]],
      ...(profile?.role === 'doctor' && {
        license_number: [profile?.license_number || '', Validators.required]
      })
    });
  }

  toggleEdit(editing: boolean) {
    this.isEditing.set(editing);
    if (editing) {
      this.initForm(); // Reiniciar form al abrir para tener datos frescos
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;

    const updatedProfile = await this.authService.updateProfile(this.profileForm.value);
    
    if (updatedProfile) {
      this.isEditing.set(false);
    }
  }

  // --- HELPERS VISUALES ---
  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';
  }

  getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % this.avatarColors.length);
    return this.avatarColors[index];
  }
}