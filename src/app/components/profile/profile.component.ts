// src/app/components/profile/profile.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';

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

  constructor() {
    this.initForm();
  }

  initForm() {
    const profile = this.authService.userProfile();
    this.profileForm = this.fb.group({
      full_name: [profile?.full_name || '', Validators.required],
      ...(profile?.role === 'doctor' && {
        license_number: [profile?.license_number || '']
      })
    });
  }

  toggleEdit(editing: boolean) {
    this.isEditing.set(editing);
    if (editing) {
      this.initForm();
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) {
      alert('Por favor, completa los campos requeridos.');
      return;
    }

    const updatedProfile = await this.authService.updateProfile(this.profileForm.value);
    
    if (updatedProfile) {
      this.isEditing.set(false);
    }
  }
}