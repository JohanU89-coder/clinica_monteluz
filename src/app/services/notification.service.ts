// src/app/services/notification.service.ts

import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications = signal<Notification[]>([]);

  private show(message: string, type: Notification['type'] = 'success', duration = 5000) {
    const newNotification: Notification = {
      id: Date.now(),
      message,
      type,
      duration
    };

    this.notifications.update(current => [...current, newNotification]);

    setTimeout(() => {
      this.remove(newNotification.id);
    }, duration);
  }

  showSuccess(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  showError(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  showWarning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  showInfo(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }

  remove(id: number) {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }
}
