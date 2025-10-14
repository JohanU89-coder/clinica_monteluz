// src/app/services/confirmation.service.ts

import { Injectable, signal } from '@angular/core';

interface ConfirmationState {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  state = signal<ConfirmationState | null>(null);

  confirm(message: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.state.set({
        message,
        onConfirm: () => {
          this.state.set(null);
          resolve(true);
        },
        onCancel: () => {
          this.state.set(null);
          resolve(false);
        }
      });
    });
  }
}