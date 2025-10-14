// src/app/components/auth/auth.component.ts
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { AuthMode, UserRole } from '../../interfaces/models';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  dataService = inject(DataService);

  loading = signal(false);
  authMode = signal<AuthMode>('login');
  role = signal<UserRole>('patient');
  authForm!: FormGroup;

  constructor() {
    // Re-inicializa el form cuando cambian los modos para ajustar validadores
    effect(() => {
      this.authMode();
      this.role();
      this.initForm();
    });
  }

  initForm() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      fullName: [null, this.authMode() === 'register' ? [Validators.required] : []],
      role: [this.role()],
      specialty_id: [null, this.authMode() === 'register' && this.role() === 'doctor' ? [Validators.required] : []],
      license_number: [null, this.authMode() === 'register' && this.role() === 'doctor' ? [Validators.required] : []]
    });
  }

  async handleAuth() {
    if (this.authForm.invalid) return;
    this.loading.set(true);
    try {
      if (this.authMode() === 'login') {
        const { email, password } = this.authForm.value;
        const { error } = await this.authService.signIn({ email, password });
        if (error) throw error;
      } else {
        const { error } = await this.authService.signUp(this.authForm.value);
        if (error) throw error;
        alert('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.');
        this.authMode.set('login');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      this.loading.set(false);
    }
  }
}