// src/app/app.component.ts

import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import localeEsPE from '@angular/common/locales/es-PE';

// Services
import { AuthService } from './services/auth.service';

// Components
import { AuthComponent } from './components/auth/auth.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PrescriptionModalComponent } from './components/prescription-modal/prescription-modal.component';
import { LoadingComponent } from './components/loading/loading.component';
import { NotificationComponent } from './components/notification/notification.component';
import { LandingComponent } from './components/landing/landing.component';
import { ConfirmationModalComponent } from './components/confirmation-modal/confirmation-modal.component'; // <-- 1. AÑADE LA IMPORTACIÓN
import { RouterOutlet } from '@angular/router';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';

registerLocaleData(localeEsPE, 'es-PE');

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    AuthComponent,
    DashboardComponent,
    PrescriptionModalComponent,
    LoadingComponent,
    NotificationComponent,
    LandingComponent,
    ConfirmationModalComponent, // <-- 2. AÑADE EL COMPONENTE AL ARRAY DE IMPORTS
    RouterOutlet,
    NotificationToastComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  authService = inject(AuthService);
  showAuth = signal(false);
  mainView = computed(() => (this.authService.session() ? 'dashboard' : 'loggedOut'));

  constructor() {
    effect(() => {
      if (this.mainView() === 'loggedOut') {
        this.showAuth.set(false);
      }
    });
  }

  onNavigateToAuth() {
    this.showAuth.set(true);
  }

  goToLanding() {
    this.showAuth.set(false);
  }
}