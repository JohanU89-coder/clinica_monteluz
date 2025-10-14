// src/app/components/family/family.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-family',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './family.component.html',
  styleUrls: ['./family.component.scss']
})
export class FamilyComponent {
  authService = inject(AuthService);
  newDependentName: string = '';

  addDependent() {
    if (!this.newDependentName.trim()) return;
    this.authService.addDependent(this.newDependentName);
    this.newDependentName = '';
  }
}