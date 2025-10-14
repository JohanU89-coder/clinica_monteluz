// src/app/components/landing/landing.component.ts

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  @Output() navigateToAuth = new EventEmitter<void>();

  goToAuth() {
    this.navigateToAuth.emit();
  }
}