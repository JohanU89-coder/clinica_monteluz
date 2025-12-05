import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  authService = inject(AuthService);
  dataService = inject(DataService); // Necesario para las especialidades
  private fb = inject(FormBuilder);

  authMode = signal<'login' | 'register'>('login');
  role = signal<'patient' | 'doctor'>('patient');
  loading = signal(false);
  
  authForm: FormGroup;

  constructor() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: [''], // Se validará dinámicamente si es registro
      specialty_id: [null],
      license_number: ['']
    });
  }

  async handleAuth() {
    if (this.authForm.invalid) return;
    
    this.loading.set(true);
    const { email, password, fullName, specialty_id, license_number } = this.authForm.value;

    try {
      if (this.authMode() === 'login') {
        await this.authService.signIn({ email, password });
      } else {
        await this.authService.signUp({
          email,
          password,
          full_name: fullName,
          role: this.role(),
          specialty_id: this.role() === 'doctor' ? specialty_id : null,
          license_number: this.role() === 'doctor' ? license_number : null
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  toggleMode(mode: 'login' | 'register') {
    this.authMode.set(mode);
    this.authForm.reset();
  }
}